/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DistributionVisualizer } from './components/DistributionVisualizer';
import { MonteCarloLab } from './components/MonteCarloLab';
import { PracticeProblemSolver } from './components/PracticeProblemSolver';
import { GeminiChatbot } from './components/GeminiChatbot';
import { VisualStudio } from './components/VisualStudio';
import { ConceptGuide } from './components/ConceptGuide';
import {
  TrendingUp,
  Dna,
  BookOpen,
  Bot,
  Sparkles,
  Lightbulb,
  GraduationCap,
  FlaskConical,
  Layers,
} from 'lucide-react';

type TabType = 'distributions' | 'montecarlo' | 'practice' | 'chat' | 'visuals' | 'concepts';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('distributions');
  const [tutorContextPrompt, setTutorContextPrompt] = useState<string | null>(null);

  const handleAskTutor = (contextText: string) => {
    setTutorContextPrompt(contextText);
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* Top Header & Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white flex items-center justify-center shadow-md">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                    HypothesisLab
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Stats Master
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Null &amp; Alternative Hypothesis Testing Simulation &amp; Practice
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setActiveTab('distributions')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'distributions'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Distributions &amp; Power</span>
              </button>

              <button
                onClick={() => setActiveTab('montecarlo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'montecarlo'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Monte Carlo Lab</span>
              </button>

              <button
                onClick={() => setActiveTab('practice')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'practice'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>5-Step Practice</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'chat'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Dr. Hypo Chat</span>
              </button>

              <button
                onClick={() => setActiveTab('visuals')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'visuals'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Visuals Studio</span>
              </button>

              <button
                onClick={() => setActiveTab('concepts')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'concepts'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Concept Guide</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'distributions' && <DistributionVisualizer />}
        {activeTab === 'montecarlo' && <MonteCarloLab />}
        {activeTab === 'practice' && (
          <PracticeProblemSolver onAskTutorWithContext={handleAskTutor} />
        )}
        {activeTab === 'chat' && (
          <GeminiChatbot initialPromptContext={tutorContextPrompt} />
        )}
        {activeTab === 'visuals' && <VisualStudio />}
        {activeTab === 'concepts' && <ConceptGuide />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">HypothesisLab</span>
            <span>•</span>
            <span>Interactive Statistical Learning Environment</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Decision Rule: If p ≤ α, Reject H₀</span>
            <span>•</span>
            <span>Standard Error: SE = σ / √n</span>
            <span>•</span>
            <span>Z-Score: (x̄ - μ₀) / SE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
