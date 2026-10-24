import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Multi-turn Gemini Chatbot
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      model = 'gemini-3.8-flash',
      role = 'tutor',
      context = null,
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Valid message string is required.' });
      return;
    }

    let systemInstruction = `You are "Dr. Hypo", an enthusiastic, world-class Statistics Professor and interactive mentor specializing in Null & Alternative Hypothesis Testing.
Your mission is to guide learners to achieve true intuitive and mathematical mastery of hypothesis testing.

Pedagogical Core Principles:
1. Emphasize why we "fail to reject H0" instead of "accepting H0" (courtroom analogy: innocent until proven guilty; lack of evidence ≠ proof of innocence).
2. Clarify the 5-step framework:
   - Step 1: Formulate H0 (equality =, <=, >=) and Ha (!=, >, <). Always about population parameter (e.g. mu, p), never sample statistic (x-bar, p-hat).
   - Step 2: Choose significance level alpha (commonly 0.05) & test type (z-test for known sigma, t-test for unknown sigma / small n, 1-sample vs 2-sample).
   - Step 3: Compute test statistic (z or t) and Standard Error (s / sqrt(n)).
   - Step 4: Calculate p-value (probability of finding a sample as extreme as observed assuming H0 is true) or critical regions.
   - Step 5: Decision & Conclusion (p <= alpha -> reject H0; p > alpha -> fail to reject H0) with real-world interpretation.
3. Master Type I Error (alpha: false alarm, convicting innocent) vs Type II Error (beta: missed detection, letting guilty walk) and Statistical Power (1 - beta).
4. Be engaging, Socratic, clear, encouraging, and provide step-by-step math breakdowns when asked. Use formatting (bolding, bullet points, clean equations) to make reading pleasant.`;

    if (role === 'practice_reviewer') {
      systemInstruction += `\nYou are currently acting as a Practice Problem Reviewer. Give constructive feedback on student attempts, point out any misconception (e.g. confusing sample mean with population mean), and hint towards the correct mathematical resolution without just spoonfeeding the answer.`;
    }

    if (context) {
      systemInstruction += `\nCurrent User Context:\n${JSON.stringify(context, null, 2)}`;
    }

    // Map history to SDK format
    const contents = history.map((item: { role: string; content: string }) => ({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.content }],
    }));

    // Append latest user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const targetModel = model || 'gemini-3.8-flash';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I couldn't generate a response. Please try rephrasing your question!";
    res.json({ reply, model: targetModel });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process chat message with Gemini.',
    });
  }
});

// Generate dynamic statistical practice scenario
app.post('/api/generate-scenario', async (req: Request, res: Response) => {
  try {
    const { category = 'any', difficulty = 'intermediate', testType = 'z_test' } = req.body;

    const prompt = `Generate a realistic, mathematically coherent hypothesis testing practice problem in JSON format.
Domain: ${category} (e.g. medicine, e-commerce, environmental science, quality control, education, tech).
Difficulty: ${difficulty} (beginner, intermediate, advanced).
Test Type: ${testType} (z_test or t_test, one_tailed_right, one_tailed_left, or two_tailed).

Requirements:
Ensure all numbers calculate accurately:
- mu0: claim value
- sampleMean: observed mean
- stdDev: standard deviation (sigma or s)
- n: sample size (e.g. 25-100)
- alpha: 0.05, 0.01, or 0.10
- calculate standardError = stdDev / sqrt(n)
- calculate testStatistic = (sampleMean - mu0) / standardError
- compute precise p-value
- correct decision ("reject" or "fail_to_reject")

Return purely valid JSON matching the schema:
{
  "title": string,
  "domain": string,
  "scenario": string,
  "parameterSymbol": string (e.g. "mu" or "p"),
  "parameterDescription": string,
  "mu0": number,
  "direction": "two_tailed" | "right_tailed" | "left_tailed",
  "directionDescription": string,
  "h0Text": string,
  "haText": string,
  "testType": "z_test" | "t_test",
  "alpha": number,
  "n": number,
  "df": number,
  "sampleMean": number,
  "stdDev": number,
  "stdError": number,
  "testStatistic": number,
  "criticalValue": number,
  "pValue": number,
  "decision": "reject" | "fail_to_reject",
  "plainEnglishConclusion": string,
  "commonPitfall": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ scenario: parsed });
  } catch (error: any) {
    console.error('Scenario generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate scenario.' });
  }
});

// Image Generation using gemini-nano-banana-2.1 with fallback
app.post('/api/image/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1', imageSize = '1K' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const enhancedPrompt = `Educational high-clarity scientific statistical diagram/illustration: ${prompt}. Clean, beautiful aesthetic, professional infographic, accurate annotations, soft academic color palette.`;

    let imageUrl: string | null = null;
    let usedModel = 'gemini-nano-banana-2.1';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: {
          parts: [{ text: enhancedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: (aspectRatio as any) || '1:1',
            imageSize: (imageSize as any) || '1K',
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (primaryErr: any) {
      console.warn('gemini-nano-banana-2.1 failed or requires paid key, attempting fallback to gemini-3.1-flash-lite-image:', primaryErr.message);
      usedModel = 'gemini-3.1-flash-lite-image';
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: enhancedPrompt }],
        },
      });

      const parts = fallbackResponse.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      res.status(500).json({ error: 'Image was not generated in response.' });
      return;
    }

    res.json({ imageUrl, model: usedModel, prompt });
  } catch (error: any) {
    console.error('Image generate error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image.' });
  }
});

// Image Editing using gemini-nano-banana-2.1 with fallback
app.post('/api/image/edit', async (req: Request, res: Response) => {
  try {
    const { imageBase64, prompt, mimeType = 'image/png' } = req.body;

    if (!imageBase64 || !prompt) {
      res.status(400).json({ error: 'imageBase64 and prompt are required.' });
      return;
    }

    // Strip header prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    let imageUrl: string | null = null;
    let usedModel = 'gemini-nano-banana-2.1';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (primaryErr: any) {
      console.warn('gemini-nano-banana-2.1 edit fallback:', primaryErr.message);
      usedModel = 'gemini-3.1-flash-lite-image';
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      const parts = fallbackResponse.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      res.status(500).json({ error: 'No edited image returned.' });
      return;
    }

    res.json({ imageUrl, model: usedModel, prompt });
  } catch (error: any) {
    console.error('Image edit error:', error);
    res.status(500).json({ error: error.message || 'Failed to edit image.' });
  }
});

// Vite middleware or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`HypothesisLab server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
