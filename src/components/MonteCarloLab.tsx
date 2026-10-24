import React, { useState, useMemo } from 'react';
import { generateSampleMean, normalInverseCdf, calculatePValue } from '../utils/statistics';
import { MonteCarloSample } from '../types/stats';
import { Play, RotateCcw, Zap, Sparkles, CheckCircle2, AlertOctagon } from 'lucide-react';

export const MonteCarloLab: React.FC = () => {
  const [worldState, setWorldState] = useState<'null_true' | 'null_false'>('null_true');
  const [mu0, setMu0] = useState<number>(100);
  const [muTrueAlternative, setMuTrueAlternative] = useState<number>(105);
  const [sigma, setSigma] = useState<number>(15);
  const [n, setN] = useState<number>(36);
  const [alpha, setAlpha] = useState<number>(0.05);

  const [samples, setSamples] = useState<MonteCarloSample[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Theoretical standard error and critical value (right-tailed test)
  const se = useMemo(() => sigma / Math.sqrt(n), [sigma, n]);
  const zCrit = useMemo(() => normalInverseCdf(1 - alpha), [alpha]);
  const xCrit = useMemo(() => mu0 + zCrit * se, [mu0, zCrit, se]);

  // Active true mean based on world condition
  const activeTrueMean = worldState === 'null_true' ? mu0 : muTrueAlternative;

  // Run simulation batch
  const runSimulationBatch = (count: number) => {
    setIsRunning(true);
    const newBatch: MonteCarloSample[] = [];

    for (let i = 0; i < count; i++) {
      const sMean = generateSampleMean(activeTrueMean, sigma, n);
      const testStat = (sMean - mu0) / se;
      const pVal = calculatePValue(testStat, 'right_tailed', 'z_test');
      const rejected = sMean >= xCrit;

      newBatch.push({
        id: samples.length + i + 1,
        sampleMean: sMean,
        testStat,
        pValue: pVal,
        rejected,
      });
    }

    setSamples((prev) => [...prev, ...newBatch]);
    setIsRunning(false);
  };

  const clearHistory = () => {
    setSamples([]);
  };

  // Empirical stats
  const totalCount = samples.length;
  const rejectedCount = samples.filter((s) => s.rejected).length;
  const empiricalRejectionRate = totalCount > 0 ? rejectedCount / totalCount : 0;

  // Histogram bins
  const binCount = 30;
  const minVal = mu0 - 3.5 * se;
  const maxVal = Math.max(mu0 + 4 * se, muTrueAlternative + 3.5 * se);
  const binWidth = (maxVal - minVal) / binCount;

  const bins = useMemo(() => {
    const counts = new Array(binCount).fill(0);
    const rejectedCounts = new Array(binCount).fill(0);

    samples.forEach((s) => {
      let bIdx = Math.floor((s.sampleMean - minVal) / binWidth);
      if (bIdx < 0) bIdx = 0;
      if (bIdx >= binCount) bIdx = binCount - 1;
      counts[bIdx]++;
      if (s.rejected) {
        rejectedCounts[bIdx]++;
      }
    });

    const maxCount = Math.max(...counts, 1);
    return counts.map((count, i) => ({
      xStart: minVal + i * binWidth,
      xEnd: minVal + (i + 1) * binWidth,
      count,
      rejectedCount: rejectedCounts[i],
      heightPercent: (count / maxCount) * 100,
    }));
  }, [samples, binCount, minVal, binWidth]);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-purple-50 text-purple-700 rounded-md">
                Empirical Proof
              </span>
              <span className="text-xs text-slate-500">Repeated Sampling Experiment</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Monte Carlo Hypothesis Testing Lab
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Witness the Law of Large Numbers in action. Draw hundreds of random independent samples to prove why α = 0.05 guarantees an empirical false alarm rate of exactly ~5% when H₀ is true!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runSimulationBatch(100)}
              disabled={isRunning}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              Simulate 100 Samples
            </button>
            <button
              onClick={() => runSimulationBatch(500)}
              disabled={isRunning}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              Simulate 500
            </button>
            {totalCount > 0 && (
              <button
                onClick={clearHistory}
                className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                title="Reset simulation data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* World Condition Toggle */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Set Objective Ground Truth of the Universe:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                setWorldState('null_true');
                clearHistory();
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                worldState === 'null_true'
                  ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">
                  World A: H₀ is Actually TRUE (μ = {mu0})
                </span>
                {worldState === 'null_true' && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                The treatment has <strong>no effect</strong>. Any rejection is a <em>Type I Error (False Alarm)</em>.
              </p>
            </button>

            <button
              onClick={() => {
                setWorldState('null_false');
                clearHistory();
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                worldState === 'null_false'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">
                  World B: H₀ is Actually FALSE (True μ = {muTrueAlternative})
                </span>
                {worldState === 'null_false' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                The treatment <strong>does work</strong>! Rejection is a true discovery (<em>Statistical Power</em>).
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Main Empirical Results Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Empirical Histogram Canvas */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl p-5 border border-slate-800 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Distribution of Sample Means ({totalCount} Simulations)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Critical Cutoff x_crit = {xCrit.toFixed(2)} (Values to the right reject H₀)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-500/80 inline-block"></span>
                <span className="text-slate-300">Retained H₀</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block"></span>
                <span className="text-rose-300 font-medium">Rejected H₀</span>
              </span>
            </div>
          </div>

          {/* Histogram Bars View */}
          {totalCount === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Play className="w-8 h-8 text-slate-600 animate-pulse" />
              <div className="text-sm font-medium">No samples collected yet</div>
              <div className="text-xs text-slate-600">
                Click &quot;Simulate 100 Samples&quot; above to draw samples and observe the empirical tally!
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-56 flex items-end gap-1 px-2 border-b border-slate-800 relative">
                {/* Critical cutoff vertical line */}
                <div
                  className="absolute top-0 bottom-0 border-r-2 border-dashed border-rose-500 pointer-events-none z-10"
                  style={{
                    left: `${Math.min(100, Math.max(0, ((xCrit - minVal) / (maxVal - minVal)) * 100))}%`,
                  }}
                >
                  <span className="absolute -top-2 left-1 text-[10px] font-mono text-rose-400 bg-rose-950/80 px-1 rounded border border-rose-800 whitespace-nowrap">
                    Rejection Boundary ({xCrit.toFixed(1)})
                  </span>
                </div>

                {bins.map((bin, i) => {
                  const isPastCrit = bin.xStart >= xCrit;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col justify-end h-full group relative"
                    >
                      {/* Tooltip */}
                      <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] text-white px-2 py-1 rounded shadow-lg border border-slate-700 pointer-events-none whitespace-nowrap z-20">
                        Range: {bin.xStart.toFixed(1)} - {bin.xEnd.toFixed(1)}
                        <br />
                        Count: {bin.count} ({bin.rejectedCount} rejected)
                      </div>

                      {/* Bar Fill */}
                      <div
                        style={{ height: `${bin.heightPercent}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isPastCrit ? 'bg-rose-500' : 'bg-indigo-500'
                        }`}
                      ></div>
                    </div>
                  );
                })}
              </div>

              {/* Axis labels */}
              <div className="flex justify-between text-[11px] font-mono text-slate-400 px-2">
                <span>{minVal.toFixed(1)}</span>
                <span>μ₀ = {mu0}</span>
                <span>{maxVal.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Explanation Footer */}
          <div className="mt-4 pt-3 border-t border-slate-900 text-xs text-slate-400 flex items-center justify-between">
            <span>
              Sample Size per experiment: <strong>n = {n}</strong>
            </span>
            <span>
              Specified Significance Threshold: <strong>α = {alpha}</strong>
            </span>
          </div>
        </div>

        {/* Right Col: Scorecard & Empirical Proof */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-3">
              Empirical Rejection Scorecard
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Total Samples Simulated</div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                  {totalCount}
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  worldState === 'null_true'
                    ? 'bg-rose-50/60 border-rose-200'
                    : 'bg-emerald-50/60 border-emerald-200'
                }`}
              >
                <div className="text-xs font-semibold text-slate-700">
                  {worldState === 'null_true' ? 'Empirical False Alarms (Type I)' : 'Empirical True Detections (Power)'}
                </div>
                <div className="text-2xl font-bold font-mono mt-0.5 text-slate-900">
                  {rejectedCount} <span className="text-sm font-normal text-slate-500">/ {totalCount}</span>
                </div>
                <div className="mt-1 text-sm font-bold font-mono text-indigo-700">
                  {(empiricalRejectionRate * 100).toFixed(1)}% Rejection Rate
                </div>
              </div>

              {/* Comparison with Theoretical expectation */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-slate-700 space-y-1.5">
                <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  What this demonstrates:
                </div>
                {worldState === 'null_true' ? (
                  <p className="leading-relaxed">
                    Under the true null hypothesis, you set α = <strong>{(alpha * 100).toFixed(0)}%</strong>. In your simulation of {totalCount} experiments, <strong>{(empiricalRejectionRate * 100).toFixed(1)}%</strong> falsely rejected the null! As you draw more samples (500+), the empirical rate hovers precisely around 5.0%.
                  </p>
                ) : (
                  <p className="leading-relaxed">
                    Under World B where a true effect of +{(muTrueAlternative - mu0)} exists, your empirical test discovered the effect in <strong>{(empiricalRejectionRate * 100).toFixed(1)}%</strong> of samples. That empirical discovery rate is your <em>Statistical Power</em>!
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 italic border-t border-slate-100 pt-3">
            Tip: Switch between World A and World B to verify how the same test statistic threshold behaves under null versus alternative conditions.
          </div>
        </div>
      </div>
    </div>
  );
};
