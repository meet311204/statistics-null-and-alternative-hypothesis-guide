import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CURATED_PRACTICE_PROBLEMS } from '../data/practiceProblems';
import { PracticeProblem } from '../types/stats';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  Award,
  ChevronRight,
  Info,
  Loader2,
  Calculator,
  MessageSquare,
} from 'lucide-react';

interface Props {
  onAskTutorWithContext?: (contextText: string) => void;
}

export const PracticeProblemSolver: React.FC<Props> = ({ onAskTutorWithContext }) => {
  const [problems, setProblems] = useState<PracticeProblem[]>(CURATED_PRACTICE_PROBLEMS);
  const [selectedProblemId, setSelectedProblemId] = useState<string>(CURATED_PRACTICE_PROBLEMS[0].id);

  // Active problem
  const problem = problems.find((p) => p.id === selectedProblemId) || problems[0];

  // User responses state for the 5 steps
  const [step1Selected, setStep1Selected] = useState<string | null>(null);
  const [step2Selected, setStep2Selected] = useState<string | null>(null);
  const [step3Input, setStep3Input] = useState<string>('');
  const [step4Input, setStep4Input] = useState<string>('');
  const [step5Selected, setStep5Selected] = useState<string | null>(null);

  // Status for each step
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepStatus, setStepStatus] = useState<{ [key: number]: 'idle' | 'correct' | 'incorrect' }>({
    1: 'idle',
    2: 'idle',
    3: 'idle',
    4: 'idle',
    5: 'idle',
  });
  const [showHintForStep, setShowHintForStep] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // AI Scenario Generator modal/loading state
  const [isGeneratingAiScenario, setIsGeneratingAiScenario] = useState<boolean>(false);
  const [aiDomain, setAiDomain] = useState<string>('Biotechnology & Genetics');
  const [aiDifficulty, setAiDifficulty] = useState<string>('intermediate');

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleResetProblem = () => {
    setStep1Selected(null);
    setStep2Selected(null);
    setStep3Input('');
    setStep4Input('');
    setStep5Selected(null);
    setCurrentStep(1);
    setStepStatus({ 1: 'idle', 2: 'idle', 3: 'idle', 4: 'idle', 5: 'idle' });
    setShowHintForStep(null);
    setIsCompleted(false);
  };

  const handleSelectProblem = (id: string) => {
    setSelectedProblemId(id);
    handleResetProblem();
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const opt = problem.questionPrompts.step1.options.find((o) => o.id === step1Selected);
    if (opt?.isCorrect) {
      setStepStatus((prev) => ({ ...prev, 1: 'correct' }));
      setCurrentStep(2);
    } else {
      setStepStatus((prev) => ({ ...prev, 1: 'incorrect' }));
    }
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const opt = problem.questionPrompts.step2.options.find((o) => o.id === step2Selected);
    if (opt?.isCorrect) {
      setStepStatus((prev) => ({ ...prev, 2: 'correct' }));
      setCurrentStep(3);
    } else {
      setStepStatus((prev) => ({ ...prev, 2: 'incorrect' }));
    }
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const val = parseFloat(step3Input.trim());
    if (isNaN(val)) {
      setStepStatus((prev) => ({ ...prev, 3: 'incorrect' }));
      return;
    }
    const diff = Math.abs(val - problem.questionPrompts.step3.correctValue);
    if (diff <= problem.questionPrompts.step3.tolerance) {
      setStepStatus((prev) => ({ ...prev, 3: 'correct' }));
      setCurrentStep(4);
    } else {
      setStepStatus((prev) => ({ ...prev, 3: 'incorrect' }));
    }
  };

  // Step 4 Validation
  const validateStep4 = () => {
    const val = parseFloat(step4Input.trim());
    if (isNaN(val)) {
      setStepStatus((prev) => ({ ...prev, 4: 'incorrect' }));
      return;
    }
    const diff = Math.abs(val - problem.questionPrompts.step4.correctValue);
    if (diff <= problem.questionPrompts.step4.tolerance) {
      setStepStatus((prev) => ({ ...prev, 4: 'correct' }));
      setCurrentStep(5);
    } else {
      setStepStatus((prev) => ({ ...prev, 4: 'incorrect' }));
    }
  };

  // Step 5 Validation
  const validateStep5 = () => {
    const opt = problem.questionPrompts.step5.options.find((o) => o.id === step5Selected);
    if (opt?.isCorrect) {
      setStepStatus((prev) => ({ ...prev, 5: 'correct' }));
      setIsCompleted(true);
      triggerConfetti();
    } else {
      setStepStatus((prev) => ({ ...prev, 5: 'incorrect' }));
    }
  };

  // AI Scenario Generator
  const generateCustomScenario = async () => {
    try {
      setIsGeneratingAiScenario(true);
      const res = await fetch('/api/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: aiDomain,
          difficulty: aiDifficulty,
          testType: 'z_test',
        }),
      });

      const data = await res.json();
      if (data.scenario && data.scenario.title) {
        const sc = data.scenario;
        const newProb: PracticeProblem = {
          id: `ai-gen-${Date.now()}`,
          title: sc.title,
          domain: sc.domain || aiDomain,
          iconName: 'Sparkles',
          difficulty: 'Intermediate',
          scenario: sc.scenario,
          parameterSymbol: sc.parameterSymbol || 'μ',
          parameterName: sc.parameterDescription || 'Mean Value',
          unit: 'units',
          mu0: sc.mu0,
          direction: sc.direction || 'two_tailed',
          directionLabel: sc.directionDescription || 'Two-tailed test',
          h0Formula: sc.h0Text || `H₀: μ = ${sc.mu0}`,
          haFormula: sc.haText || `Hₐ: μ ≠ ${sc.mu0}`,
          testType: sc.testType || 'z_test',
          alpha: sc.alpha || 0.05,
          n: sc.n || 50,
          df: sc.df,
          sampleMean: sc.sampleMean,
          stdDev: sc.stdDev,
          stdError: sc.stdError || sc.stdDev / Math.sqrt(sc.n || 50),
          testStatistic: sc.testStatistic,
          criticalValues: {
            left: sc.direction === 'right_tailed' ? null : -1.96,
            right: sc.direction === 'left_tailed' ? null : 1.96,
          },
          pValue: sc.pValue,
          correctDecision: sc.decision || 'reject',
          realWorldInterpretation: sc.plainEnglishConclusion || 'Analysis complete.',
          commonPitfall: sc.commonPitfall || 'Carefully distinguish between sample and population means.',
          questionPrompts: {
            step1: {
              question: 'Select the proper Null and Alternative hypotheses for this scenario:',
              options: [
                { id: 'a', label: `${sc.h0Text} vs ${sc.haText}`, isCorrect: true },
                { id: 'b', label: `H₀: x̄ = ${sc.sampleMean} vs Hₐ: x̄ ≠ ${sc.sampleMean}`, isCorrect: false },
                { id: 'c', label: `H₀: μ > ${sc.mu0} vs Hₐ: μ ≤ ${sc.mu0}`, isCorrect: false },
              ],
            },
            step2: {
              question: `Identify the appropriate test and significance level:`,
              options: [
                { id: 'a', label: `${sc.testType === 'z_test' ? 'Z-test' : 'T-test'} at α = ${sc.alpha}`, isCorrect: true },
                { id: 'b', label: 'Chi-square test of independence', isCorrect: false },
              ],
            },
            step3: {
              question: `Compute the test statistic value (round to 2 decimal places):`,
              correctValue: Number(sc.testStatistic.toFixed(2)),
              tolerance: 0.1,
              unit: 'statistic',
            },
            step4: {
              question: `Enter the calculated p-value (to 3 or 4 decimal places):`,
              correctValue: Number(sc.pValue.toFixed(4)),
              tolerance: 0.02,
            },
            step5: {
              question: `What is the decision at α = ${sc.alpha}?`,
              options: [
                {
                  id: 'a',
                  label:
                    sc.decision === 'reject'
                      ? `Reject H₀ (p-value ≤ ${sc.alpha})`
                      : `Fail to reject H₀ (p-value > ${sc.alpha})`,
                  isCorrect: true,
                },
                {
                  id: 'b',
                  label:
                    sc.decision === 'reject'
                      ? `Fail to reject H₀`
                      : `Reject H₀`,
                  isCorrect: false,
                },
              ],
            },
          },
        };

        setProblems((prev) => [newProb, ...prev]);
        setSelectedProblemId(newProb.id);
        handleResetProblem();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAiScenario(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Problem Selection & AI Generator Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 rounded-md">
                Mastery Pathway
              </span>
              <span className="text-xs text-slate-500">5-Step Standardized Statistical Method</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Guided Hypothesis Testing Practice
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Solve realistic statistical problems step-by-step. Receive instant feedback, hints, and error diagnostics at every phase of hypothesis testing.
            </p>
          </div>

          {/* AI Generator Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={generateCustomScenario}
              disabled={isGeneratingAiScenario}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingAiScenario ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGeneratingAiScenario ? 'Generating Scenario...' : 'AI Generate Scenario'}
            </button>
          </div>
        </div>

        {/* Problem Selector Pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            Scenarios:
          </span>
          {problems.map((p) => {
            const isSelected = p.id === selectedProblemId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectProblem(p.id)}
                className={`px-3 py-1.5 text-xs rounded-xl font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Details & Given Data Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                {problem.domain}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700">
                Difficulty: {problem.difficulty}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{problem.title}</h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {problem.scenario}
            </p>
          </div>

          {/* Given Statistical Parameters Table */}
          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 text-xs space-y-2 shrink-0 md:w-64">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1.5 flex items-center justify-between">
              <span>Given Parameters</span>
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Null Benchmark (μ₀):</span>
              <span className="font-mono font-bold text-indigo-300">
                {problem.mu0} {problem.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sample Mean (x̄):</span>
              <span className="font-mono font-bold text-sky-300">
                {problem.sampleMean} {problem.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">
                {problem.testType === 'z_test' ? 'Pop Std Dev (σ):' : 'Sample Std Dev (s):'}
              </span>
              <span className="font-mono">{problem.stdDev} {problem.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sample Size (n):</span>
              <span className="font-mono font-bold">{problem.n}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Significance Level (α):</span>
              <span className="font-mono text-amber-300 font-bold">{problem.alpha}</span>
            </div>
          </div>
        </div>

        {/* Step Progress Tracker Bar */}
        <div className="mt-8 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Step-by-Step Progress ({currentStep} of 5)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetProblem}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Start Over
              </button>
              {onAskTutorWithContext && (
                <button
                  onClick={() =>
                    onAskTutorWithContext(
                      `I'm solving problem: "${problem.title}". Scenario: ${problem.scenario}. Current step is Step ${currentStep}. Can you explain the intuition for this step?`
                    )
                  }
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Ask Dr. Hypo
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((s) => {
              const status = stepStatus[s];
              const isCurrent = currentStep === s;
              return (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    status === 'correct'
                      ? 'bg-emerald-500'
                      : status === 'incorrect'
                      ? 'bg-rose-500'
                      : isCurrent
                      ? 'bg-indigo-600 animate-pulse'
                      : 'bg-slate-200'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive 5-Step Questions Container */}
      <div className="space-y-4">
        {/* STEP 1: State Hypotheses */}
        <div
          className={`bg-white rounded-2xl border p-5 transition-all shadow-sm ${
            currentStep === 1
              ? 'border-indigo-400 ring-2 ring-indigo-50'
              : stepStatus[1] === 'correct'
              ? 'border-emerald-200 bg-emerald-50/20'
              : 'border-slate-200 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">
                1
              </span>
              Step 1: State the Null (H₀) &amp; Alternative (Hₐ) Hypotheses
            </h4>
            {stepStatus[1] === 'correct' && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Correct
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 mb-3">
            {problem.questionPrompts.step1.question}
          </p>

          <div className="space-y-2">
            {problem.questionPrompts.step1.options.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  step1Selected === opt.id
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="step1-opt"
                  checked={step1Selected === opt.id}
                  onChange={() => setStep1Selected(opt.id)}
                  disabled={stepStatus[1] === 'correct'}
                  className="accent-indigo-600"
                />
                <span className="font-mono text-slate-800">{opt.label}</span>
              </label>
            ))}
          </div>

          {currentStep === 1 && stepStatus[1] !== 'correct' && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={validateStep1}
                disabled={!step1Selected}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Check Answer
              </button>
              <button
                onClick={() => setShowHintForStep(showHintForStep === 1 ? null : 1)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Hint
              </button>
            </div>
          )}

          {showHintForStep === 1 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <strong>Hint:</strong> Hypotheses are always formulated regarding the population parameter (μ), never about sample statistics (x̄). Check whether the claim aims for reduction (&lt;), increase (&gt;), or any difference (≠).
            </div>
          )}

          {stepStatus[1] === 'incorrect' && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
              Not quite. Remember that H₀ contains equality and tests the population mean μ₀.
            </div>
          )}
        </div>

        {/* STEP 2: Choose Test & Alpha */}
        {currentStep >= 2 && (
          <div
            className={`bg-white rounded-2xl border p-5 transition-all shadow-sm ${
              currentStep === 2
                ? 'border-indigo-400 ring-2 ring-indigo-50'
                : stepStatus[2] === 'correct'
                ? 'border-emerald-200 bg-emerald-50/20'
                : 'border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                Step 2: Identify Statistical Test &amp; Critical Threshold
              </h4>
              {stepStatus[2] === 'correct' && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mb-3">
              {problem.questionPrompts.step2.question}
            </p>

            <div className="space-y-2">
              {problem.questionPrompts.step2.options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    step2Selected === opt.id
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="step2-opt"
                    checked={step2Selected === opt.id}
                    onChange={() => setStep2Selected(opt.id)}
                    disabled={stepStatus[2] === 'correct'}
                    className="accent-indigo-600"
                  />
                  <span className="text-slate-800">{opt.label}</span>
                </label>
              ))}
            </div>

            {currentStep === 2 && stepStatus[2] !== 'correct' && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={validateStep2}
                  disabled={!step2Selected}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Check Answer
                </button>
                <button
                  onClick={() => setShowHintForStep(showHintForStep === 2 ? null : 2)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Hint
                </button>
              </div>
            )}

            {showHintForStep === 2 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>Hint:</strong> If population σ is known, use a Z-test. If σ is unknown and estimated by sample s, use Student&apos;s t-test with df = n - 1.
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Compute Test Statistic */}
        {currentStep >= 3 && (
          <div
            className={`bg-white rounded-2xl border p-5 transition-all shadow-sm ${
              currentStep === 3
                ? 'border-indigo-400 ring-2 ring-indigo-50'
                : stepStatus[3] === 'correct'
                ? 'border-emerald-200 bg-emerald-50/20'
                : 'border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">
                  3
                </span>
                Step 3: Calculate the Standard Error and Test Statistic
              </h4>
              {stepStatus[3] === 'correct' && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correct (stat = {problem.testStatistic.toFixed(2)})
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mb-3">
              {problem.questionPrompts.step3.question}
            </p>

            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.01"
                placeholder="e.g. -1.90"
                value={step3Input}
                onChange={(e) => setStep3Input(e.target.value)}
                disabled={stepStatus[3] === 'correct'}
                className="w-48 px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono focus:outline-indigo-600"
              />
              <span className="text-xs text-slate-500 font-mono">
                Formula: (x̄ - μ₀) / (s or σ / √n)
              </span>
            </div>

            {currentStep === 3 && stepStatus[3] !== 'correct' && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={validateStep3}
                  disabled={!step3Input.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Verify Calculation
                </button>
                <button
                  onClick={() => setShowHintForStep(showHintForStep === 3 ? null : 3)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Show Math Walkthrough
                </button>
              </div>
            )}

            {showHintForStep === 3 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-mono space-y-1">
                <div>1. Standard Error = {problem.stdDev} / √{problem.n} = {problem.stdError.toFixed(2)}</div>
                <div>2. Difference = {problem.sampleMean} - {problem.mu0} = {(problem.sampleMean - problem.mu0).toFixed(2)}</div>
                <div>3. Statistic = Difference / SE ≈ {problem.testStatistic.toFixed(2)}</div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Compute P-Value */}
        {currentStep >= 4 && (
          <div
            className={`bg-white rounded-2xl border p-5 transition-all shadow-sm ${
              currentStep === 4
                ? 'border-indigo-400 ring-2 ring-indigo-50'
                : stepStatus[4] === 'correct'
                ? 'border-emerald-200 bg-emerald-50/20'
                : 'border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">
                  4
                </span>
                Step 4: Determine the P-Value
              </h4>
              {stepStatus[4] === 'correct' && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correct (p = {problem.pValue.toFixed(4)})
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mb-3">
              {problem.questionPrompts.step4.question}
            </p>

            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.0001"
                placeholder="e.g. 0.0287"
                value={step4Input}
                onChange={(e) => setStep4Input(e.target.value)}
                disabled={stepStatus[4] === 'correct'}
                className="w-48 px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono focus:outline-indigo-600"
              />
              <span className="text-xs text-slate-500">
                (Probability under H₀ curve in tail)
              </span>
            </div>

            {currentStep === 4 && stepStatus[4] !== 'correct' && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={validateStep4}
                  disabled={!step4Input.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Verify P-Value
                </button>
                <button
                  onClick={() => setShowHintForStep(showHintForStep === 4 ? null : 4)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Hint
                </button>
              </div>
            )}

            {showHintForStep === 4 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>Hint:</strong> The p-value for test statistic {problem.testStatistic.toFixed(2)} is approximately {problem.pValue.toFixed(4)}.
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Statistical Decision & Plain English Interpretation */}
        {currentStep >= 5 && (
          <div
            className={`bg-white rounded-2xl border p-5 transition-all shadow-sm ${
              currentStep === 5 && !isCompleted
                ? 'border-indigo-400 ring-2 ring-indigo-50'
                : isCompleted
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">
                  5
                </span>
                Step 5: Statistical Decision &amp; Real-World Conclusion
              </h4>
              {isCompleted && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Award className="w-3.5 h-3.5" /> Problem Solved!
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mb-3">
              {problem.questionPrompts.step5.question}
            </p>

            <div className="space-y-2">
              {problem.questionPrompts.step5.options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    step5Selected === opt.id
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="step5-opt"
                    checked={step5Selected === opt.id}
                    onChange={() => setStep5Selected(opt.id)}
                    disabled={isCompleted}
                    className="accent-indigo-600"
                  />
                  <span className="text-slate-800">{opt.label}</span>
                </label>
              ))}
            </div>

            {!isCompleted && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={validateStep5}
                  disabled={!step5Selected}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Submit Final Decision
                </button>
              </div>
            )}

            {isCompleted && (
              <div className="mt-5 p-4 rounded-xl bg-emerald-100/70 border border-emerald-300 text-xs text-emerald-950 space-y-2 animate-fadeIn">
                <div className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-700" />
                  Full Real-World Context &amp; Resolution:
                </div>
                <p className="leading-relaxed">
                  {problem.realWorldInterpretation}
                </p>
                <div className="pt-2 border-t border-emerald-200 text-emerald-800">
                  <strong>Watch Out For Common Pitfall:</strong> {problem.commonPitfall}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
