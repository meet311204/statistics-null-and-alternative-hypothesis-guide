import React from 'react';
import {
  Scale,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  Sparkles,
} from 'lucide-react';

export const ConceptGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 rounded-md">
            Core Theory &amp; Fallacy Buster
          </span>
          <span className="text-xs text-slate-500">Conceptual Foundations</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Hypothesis Testing Conceptual Blueprint
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Clear, intuitive mental models for avoiding the most notorious pitfalls in classical statistical inference.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Courtroom Analogy Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                The Courtroom Analogy: Why We Never &quot;Accept&quot; H₀
              </h3>
              <p className="text-xs text-slate-500">Presumption of innocence until proven guilty</p>
            </div>
          </div>

          <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
            <p>
              In criminal justice, a defendant enters court with the <strong>presumption of innocence</strong>. The burden of proof lies entirely on the prosecution to present overwhelming evidence beyond reasonable doubt.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-indigo-700 shrink-0">Null Hypothesis (H₀):</span>
                <span>The defendant is innocent (No effect, status quo).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-indigo-700 shrink-0">Alternative (Hₐ):</span>
                <span>The defendant is guilty (Effect exists, claim to prove).</span>
              </div>
            </div>
            <p>
              If evidence is insufficient, the verdict is <strong>&quot;NOT GUILTY&quot;</strong>, never &quot;Proven Innocent&quot;. You didn&apos;t prove innocence; you merely lacked the evidence to convict. Similarly, in statistics, we say <strong>&quot;Fail to Reject H₀&quot;</strong>.
            </p>
          </div>
        </div>

        {/* P-Value Truth vs Myth */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                What a P-Value IS (and IS NOT)
              </h3>
              <p className="text-xs text-slate-500">Debunking the #1 misconception in science</p>
            </div>
          </div>

          <div className="text-xs space-y-3 leading-relaxed">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950 space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Accurate Mathematical Definition:
              </div>
              <p>
                The p-value is the probability of observing a sample statistic at least as extreme as the one calculated, <em>assuming that the null hypothesis (H₀) is true</em>.
              </p>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-rose-950 space-y-1">
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                Dangerous Fallacy:
              </div>
              <p>
                A p-value is <strong>NOT</strong> the probability that the null hypothesis is true! Nor is 1 - p the probability that your alternative hypothesis is true.
              </p>
            </div>
          </div>
        </div>

        {/* The 5-Step Workflow */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                The Universal 5-Step Hypothesis Testing Workflow
              </h3>
              <p className="text-xs text-slate-500">Standardized protocol across science &amp; engineering</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-indigo-700">1. State Hypotheses</div>
              <p className="text-[11px] text-slate-600">
                Identify parameter (μ or p). H₀ contains equality (=); Hₐ specifies direction (≠, &gt;, or &lt;).
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-indigo-700">2. Select Test &amp; α</div>
              <p className="text-[11px] text-slate-600">
                Choose Z-test (known σ) or T-test (unknown σ, df = n - 1). Set α (typically 0.05).
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-indigo-700">3. Compute Test Stat</div>
              <p className="text-[11px] text-slate-600">
                SE = s / √n. Test statistic = (x̄ - μ₀) / SE. Standardizes sample deviation.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-indigo-700">4. Find P-Value</div>
              <p className="text-[11px] text-slate-600">
                Calculate tail probability beyond the test statistic under the reference curve.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-indigo-700">5. Conclude</div>
              <p className="text-[11px] text-slate-600">
                If p ≤ α: Reject H₀. If p &gt; α: Fail to reject H₀. State real-world interpretation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
