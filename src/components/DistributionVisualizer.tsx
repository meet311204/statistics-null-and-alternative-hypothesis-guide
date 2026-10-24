import React, { useState, useMemo } from 'react';
import {
  normalPdf,
  normalCdf,
  normalInverseCdf,
  calculatePValue,
  calculatePower,
} from '../utils/statistics';
import { TestDirection } from '../types/stats';
import {
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const DistributionVisualizer: React.FC = () => {
  // Configurable parameters
  const [mu0, setMu0] = useState<number>(100);
  const [muA, setMuA] = useState<number>(105);
  const [sigma, setSigma] = useState<number>(15);
  const [n, setN] = useState<number>(36);
  const [alpha, setAlpha] = useState<number>(0.05);
  const [direction, setDirection] = useState<TestDirection>('right_tailed');
  const [sampleMean, setSampleMean] = useState<number>(104.5);
  const [showPowerCurve, setShowPowerCurve] = useState<boolean>(true);

  // Derived calculations
  const se = useMemo(() => sigma / Math.sqrt(n), [sigma, n]);
  const testStat = useMemo(() => (sampleMean - mu0) / se, [sampleMean, mu0, se]);
  const pValue = useMemo(() => calculatePValue(testStat, direction, 'z_test'), [testStat, direction]);

  const powerMetrics = useMemo(
    () => calculatePower(mu0, muA, sigma, n, alpha, direction),
    [mu0, muA, sigma, n, alpha, direction]
  );

  // Critical values on standard score and raw x-bar scale
  const criticals = useMemo(() => {
    if (direction === 'two_tailed') {
      const zCrit = normalInverseCdf(1 - alpha / 2);
      return {
        zLeft: -zCrit,
        zRight: zCrit,
        xLeft: mu0 - zCrit * se,
        xRight: mu0 + zCrit * se,
      };
    } else if (direction === 'right_tailed') {
      const zCrit = normalInverseCdf(1 - alpha);
      return {
        zLeft: null,
        zRight: zCrit,
        xLeft: null,
        xRight: mu0 + zCrit * se,
      };
    } else {
      const zCrit = normalInverseCdf(alpha);
      return {
        zLeft: zCrit,
        zRight: null,
        xLeft: mu0 + zCrit * se,
        xRight: null,
      };
    }
  }, [alpha, direction, mu0, se]);

  const isRejected = pValue <= alpha;

  // Chart coordinate ranges
  const minX = Math.min(mu0 - 3.8 * se, muA - 3.8 * se);
  const maxX = Math.max(mu0 + 3.8 * se, muA + 3.8 * se);
  const chartWidth = 760;
  const chartHeight = 280;
  const paddingX = 40;
  const paddingY = 30;

  const scaleX = (x: number) => {
    return paddingX + ((x - minX) / (maxX - minX)) * (chartWidth - 2 * paddingX);
  };

  // Peak of PDF
  const maxPdf = Math.max(normalPdf(mu0, mu0, se), normalPdf(muA, muA, se));
  const scaleY = (y: number) => {
    return chartHeight - paddingY - (y / (maxPdf * 1.15)) * (chartHeight - 2 * paddingY);
  };

  // Generate SVG path points
  const pointsCount = 180;
  const step = (maxX - minX) / pointsCount;

  // H0 curve points
  const h0Points: [number, number][] = [];
  // Ha curve points
  const haPoints: [number, number][] = [];

  for (let i = 0; i <= pointsCount; i++) {
    const xVal = minX + i * step;
    h0Points.push([scaleX(xVal), scaleY(normalPdf(xVal, mu0, se))]);
    haPoints.push([scaleX(xVal), scaleY(normalPdf(xVal, muA, se))]);
  }

  const h0Path = `M ${h0Points.map((p) => `${p[0]},${p[1]}`).join(' L ')}`;
  const haPath = `M ${haPoints.map((p) => `${p[0]},${p[1]}`).join(' L ')}`;

  // Shaded Rejection Region Path (under H0)
  const rejectionPaths = useMemo(() => {
    const paths: string[] = [];
    const baselineY = chartHeight - paddingY;

    if (criticals.xRight !== null) {
      // Right tail
      const rightPts = h0Points.filter((p) => {
        const xVal = minX + ((p[0] - paddingX) / (chartWidth - 2 * paddingX)) * (maxX - minX);
        return xVal >= criticals.xRight!;
      });
      if (rightPts.length > 0) {
        const d = `M ${rightPts[0][0]},${baselineY} L ${rightPts.map((p) => `${p[0]},${p[1]}`).join(' L ')} L ${rightPts[rightPts.length - 1][0]},${baselineY} Z`;
        paths.push(d);
      }
    }

    if (criticals.xLeft !== null) {
      // Left tail
      const leftPts = h0Points.filter((p) => {
        const xVal = minX + ((p[0] - paddingX) / (chartWidth - 2 * paddingX)) * (maxX - minX);
        return xVal <= criticals.xLeft!;
      });
      if (leftPts.length > 0) {
        const d = `M ${leftPts[0][0]},${baselineY} L ${leftPts.map((p) => `${p[0]},${p[1]}`).join(' L ')} L ${leftPts[leftPts.length - 1][0]},${baselineY} Z`;
        paths.push(d);
      }
    }

    return paths;
  }, [h0Points, criticals, minX, maxX]);

  // Shaded Power Region (under Ha curve that falls in rejection region)
  const powerPath = useMemo(() => {
    if (!showPowerCurve) return null;
    const baselineY = chartHeight - paddingY;

    if (direction === 'right_tailed' && criticals.xRight !== null) {
      const pts = haPoints.filter((p) => {
        const xVal = minX + ((p[0] - paddingX) / (chartWidth - 2 * paddingX)) * (maxX - minX);
        return xVal >= criticals.xRight!;
      });
      if (pts.length > 0) {
        return `M ${pts[0][0]},${baselineY} L ${pts.map((p) => `${p[0]},${p[1]}`).join(' L ')} L ${pts[pts.length - 1][0]},${baselineY} Z`;
      }
    } else if (direction === 'left_tailed' && criticals.xLeft !== null) {
      const pts = haPoints.filter((p) => {
        const xVal = minX + ((p[0] - paddingX) / (chartWidth - 2 * paddingX)) * (maxX - minX);
        return xVal <= criticals.xLeft!;
      });
      if (pts.length > 0) {
        return `M ${pts[0][0]},${baselineY} L ${pts.map((p) => `${p[0]},${p[1]}`).join(' L ')} L ${pts[pts.length - 1][0]},${baselineY} Z`;
      }
    } else if (direction === 'two_tailed' && criticals.xLeft !== null && criticals.xRight !== null) {
      const rightPts = haPoints.filter((p) => {
        const xVal = minX + ((p[0] - paddingX) / (chartWidth - 2 * paddingX)) * (maxX - minX);
        return xVal >= criticals.xRight!;
      });
      if (rightPts.length > 0) {
        return `M ${rightPts[0][0]},${baselineY} L ${rightPts.map((p) => `${p[0]},${p[1]}`).join(' L ')} L ${rightPts[rightPts.length - 1][0]},${baselineY} Z`;
      }
    }
    return null;
  }, [showPowerCurve, direction, criticals, haPoints, minX, maxX]);

  const resetDefaults = () => {
    setMu0(100);
    setMuA(105);
    setSigma(15);
    setN(36);
    setAlpha(0.05);
    setDirection('right_tailed');
    setSampleMean(104.5);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Headline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-md">
                Interactive Lab
              </span>
              <span className="text-xs text-slate-500">Live Dual-Distribution Simulator</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Interactive Distribution &amp; Power Explorer
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Visualize how sample size, significance level (α), effect size, and observed sample mean interact to dictate the p-value, Type I &amp; II errors, and Statistical Power.
            </p>
          </div>

          {/* Real-time Verdict Badge */}
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border transition-all ${
              isRejected
                ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-sm'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
            }`}
          >
            {isRejected ? (
              <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            )}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider">
                {isRejected ? 'Decision: Reject H₀' : 'Decision: Fail to Reject H₀'}
              </div>
              <div className="text-sm font-medium">
                {isRejected
                  ? `p-value (${pValue.toFixed(4)}) ≤ α (${alpha})`
                  : `p-value (${pValue.toFixed(4)}) > α (${alpha})`}
              </div>
            </div>
          </div>
        </div>

        {/* The Live Interactive SVG Canvas */}
        <div className="mt-6 bg-slate-950 rounded-xl p-4 overflow-hidden relative border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-indigo-400 rounded-full inline-block"></span>
                <span className="text-slate-300 font-medium">H₀ Distribution (μ₀ = {mu0})</span>
              </div>
              {showPowerCurve && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-emerald-400 rounded-full inline-block border-dashed"></span>
                  <span className="text-slate-300 font-medium">True Hₐ Distribution (μₐ = {muA})</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500/50 inline-block border border-rose-400"></span>
                <span>Type I Rejection Zone (α)</span>
              </span>
              {showPowerCurve && (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 inline-block border border-emerald-400"></span>
                  <span>Power (1 - β: {(powerMetrics.power * 100).toFixed(1)}%)</span>
                </span>
              )}
            </div>
          </div>

          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid baseline */}
            <line
              x1={paddingX}
              y1={chartHeight - paddingY}
              x2={chartWidth - paddingX}
              y2={chartHeight - paddingY}
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Shaded Rejection Regions under H0 */}
            {rejectionPaths.map((d, idx) => (
              <path key={idx} d={d} fill="rgba(244, 63, 94, 0.35)" stroke="none" />
            ))}

            {/* Shaded Power Region under Ha */}
            {powerPath && (
              <path d={powerPath} fill="rgba(16, 185, 129, 0.28)" stroke="none" />
            )}

            {/* Ha Curve (Green) */}
            {showPowerCurve && (
              <path
                d={haPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
            )}

            {/* H0 Curve (Indigo) */}
            <path d={h0Path} fill="none" stroke="#6366f1" strokeWidth="2.5" />

            {/* Mean H0 Vertical Marker */}
            <line
              x1={scaleX(mu0)}
              y1={chartHeight - paddingY}
              x2={scaleX(mu0)}
              y2={scaleY(normalPdf(mu0, mu0, se))}
              stroke="#818cf8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <text
              x={scaleX(mu0)}
              y={chartHeight - paddingY + 16}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
              fontWeight="bold"
            >
              μ₀ = {mu0}
            </text>

            {/* Critical Value Lines */}
            {criticals.xRight !== null && (
              <g>
                <line
                  x1={scaleX(criticals.xRight)}
                  y1={paddingY}
                  x2={scaleX(criticals.xRight)}
                  y2={chartHeight - paddingY}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                />
                <text
                  x={scaleX(criticals.xRight) + 4}
                  y={paddingY + 14}
                  fill="#f43f5e"
                  fontSize="10"
                  fontWeight="bold"
                >
                  Crit = {criticals.xRight.toFixed(2)}
                </text>
              </g>
            )}

            {criticals.xLeft !== null && (
              <g>
                <line
                  x1={scaleX(criticals.xLeft)}
                  y1={paddingY}
                  x2={scaleX(criticals.xLeft)}
                  y2={chartHeight - paddingY}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                />
                <text
                  x={scaleX(criticals.xLeft) - 4}
                  y={paddingY + 14}
                  textAnchor="end"
                  fill="#f43f5e"
                  fontSize="10"
                  fontWeight="bold"
                >
                  Crit = {criticals.xLeft.toFixed(2)}
                </text>
              </g>
            )}

            {/* Observed Sample Mean Marker (x-bar) */}
            <g className="cursor-ew-resize">
              <line
                x1={scaleX(sampleMean)}
                y1={paddingY - 8}
                x2={scaleX(sampleMean)}
                y2={chartHeight - paddingY}
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
              <circle
                cx={scaleX(sampleMean)}
                cy={paddingY - 8}
                r="6"
                fill="#38bdf8"
                stroke="#0284c7"
                strokeWidth="2"
              />
              <text
                x={scaleX(sampleMean)}
                y={paddingY - 14}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="11"
                fontWeight="bold"
              >
                x̄ = {sampleMean.toFixed(2)}
              </text>
            </g>
          </svg>

          {/* Interactive Drag/Slider for Observed Sample Mean */}
          <div className="mt-3 bg-slate-900/90 rounded-lg p-3 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Sliders className="w-3.5 h-3.5" />
                Drag Sample Mean (x̄) to test decision boundary:
              </span>
              <span className="font-mono text-sky-300 font-semibold bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                x̄ = {sampleMean.toFixed(2)} | z = {testStat >= 0 ? `+${testStat.toFixed(2)}` : testStat.toFixed(2)} | p = {pValue.toFixed(4)}
              </span>
            </div>
            <input
              type="range"
              min={Number((mu0 - 3.5 * se).toFixed(1))}
              max={Number((mu0 + 3.5 * se).toFixed(1))}
              step={0.1}
              value={sampleMean}
              onChange={(e) => setSampleMean(parseFloat(e.target.value))}
              className="w-full accent-sky-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Control Panels & Metric Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Experiment Parameters
            </h3>
            <button
              onClick={resetDefaults}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Test Direction Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Alternative Hypothesis Direction (Hₐ)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setDirection('left_tailed')}
                className={`py-2 px-1 text-xs rounded-lg font-medium border text-center transition-all ${
                  direction === 'left_tailed'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Left (μ &lt; μ₀)
              </button>
              <button
                onClick={() => setDirection('two_tailed')}
                className={`py-2 px-1 text-xs rounded-lg font-medium border text-center transition-all ${
                  direction === 'two_tailed'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Two (μ ≠ μ₀)
              </button>
              <button
                onClick={() => setDirection('right_tailed')}
                className={`py-2 px-1 text-xs rounded-lg font-medium border text-center transition-all ${
                  direction === 'right_tailed'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Right (μ &gt; μ₀)
              </button>
            </div>
          </div>

          {/* Significance Level (Alpha) */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Significance Level (α - Type I Error)</span>
              <span className="text-indigo-600 font-mono">{alpha}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[0.01, 0.05, 0.1].map((val) => (
                <button
                  key={val}
                  onClick={() => setAlpha(val)}
                  className={`py-1.5 text-xs rounded-lg font-medium border text-center transition-all ${
                    alpha === val
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  α = {val}
                </button>
              ))}
            </div>
          </div>

          {/* Sample Size Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Sample Size (n)</span>
              <span className="text-indigo-600 font-mono font-bold">n = {n}</span>
            </div>
            <input
              type="range"
              min={4}
              max={150}
              step={1}
              value={n}
              onChange={(e) => setN(parseInt(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Standard Error (SE) = σ / √n = <strong className="text-slate-800">{se.toFixed(2)}</strong>
            </p>
          </div>

          {/* Population Sigma */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Population Std Dev (σ)</span>
              <span className="text-indigo-600 font-mono">σ = {sigma}</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={sigma}
              onChange={(e) => setSigma(parseInt(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* True Alternative Mean (Effect size) */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                True Mean in Reality (μₐ)
              </label>
              <button
                onClick={() => setShowPowerCurve(!showPowerCurve)}
                className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                  showPowerCurve
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {showPowerCurve ? 'Ha Curve On' : 'Ha Curve Off'}
              </button>
            </div>
            <input
              type="range"
              min={mu0 - 20}
              max={mu0 + 20}
              step={0.5}
              value={muA}
              onChange={(e) => setMuA(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>μₐ = {muA}</span>
              <span>Effect Size d = {powerMetrics.cohenD.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Statistical Metrics & Error Matrix Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Test Statistic (z)</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                {testStat >= 0 ? `+${testStat.toFixed(2)}` : testStat.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                (x̄ - μ₀) / SE
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">P-Value</div>
              <div
                className={`text-xl font-bold font-mono mt-0.5 ${
                  isRejected ? 'text-rose-600 font-black' : 'text-slate-800'
                }`}
              >
                {pValue < 0.0001 ? '< 0.0001' : pValue.toFixed(4)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isRejected ? 'p ≤ α (Significant)' : 'p > α (Not significant)'}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Statistical Power</div>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
                {(powerMetrics.power * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                1 - β (True Detection)
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Type II Error (β)</div>
              <div className="text-xl font-bold font-mono text-amber-600 mt-0.5">
                {(powerMetrics.beta * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                False Negative Rate
              </div>
            </div>
          </div>

          {/* Hypothesis Testing 2x2 Decision Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                The Four Possible Outcomes Matrix
              </h3>
              <span className="text-xs text-slate-400">Decision vs. Objective Reality</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="p-2.5 border border-slate-200">Reality \ Decision</th>
                    <th className="p-2.5 border border-slate-200 font-semibold text-rose-700">
                      Reject H₀ (Claim Effect)
                    </th>
                    <th className="p-2.5 border border-slate-200 font-semibold text-slate-700">
                      Fail to Reject H₀ (No Effect)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2.5 font-semibold bg-slate-50 border border-slate-200">
                      H₀ is Actually TRUE
                      <div className="text-[10px] font-normal text-slate-500">No real effect exists</div>
                    </td>
                    <td className="p-2.5 border border-slate-200 bg-rose-50/60 text-rose-900">
                      <div className="font-bold text-rose-700 flex items-center gap-1">
                        Type I Error (False Alarm)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Probability = α = <strong>{(alpha * 100).toFixed(0)}%</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 italic">
                        Courtroom analogy: Convicting an innocent person.
                      </div>
                    </td>
                    <td className="p-2.5 border border-slate-200 bg-emerald-50/60 text-emerald-900">
                      <div className="font-bold text-emerald-700">Correct Non-Rejection</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Confidence = 1 - α = <strong>{((1 - alpha) * 100).toFixed(0)}%</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 italic">
                        Courtroom analogy: Acquitting an innocent person.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold bg-slate-50 border border-slate-200">
                      H₀ is Actually FALSE
                      <div className="text-[10px] font-normal text-slate-500">Real effect exists (μₐ = {muA})</div>
                    </td>
                    <td className="p-2.5 border border-slate-200 bg-emerald-50/60 text-emerald-900">
                      <div className="font-bold text-emerald-700 flex items-center gap-1">
                        Statistical Power (1 - β)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Power = <strong>{(powerMetrics.power * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 italic">
                        Courtroom analogy: Successfully convicting the guilty party.
                      </div>
                    </td>
                    <td className="p-2.5 border border-slate-200 bg-amber-50/60 text-amber-900">
                      <div className="font-bold text-amber-700">Type II Error (Missed Effect)</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Rate = β = <strong>{(powerMetrics.beta * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 italic">
                        Courtroom analogy: Letting a guilty person walk free.
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Pedagogical Insights */}
          <div className="bg-indigo-50/60 rounded-2xl border border-indigo-100 p-4 text-xs text-indigo-950 space-y-2">
            <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Dynamic Statistical Intuition:
            </div>
            <p className="text-slate-700 leading-relaxed">
              Notice how moving sample size <strong>n</strong> from 10 to {n} shrinks the standard error from {(sigma / Math.sqrt(10)).toFixed(2)} to {se.toFixed(2)}. This makes the bell curve much tighter, pushing statistical power from ~{((1 - normalCdf((mu0 + 1.645 * (sigma / Math.sqrt(10)) - muA) / (sigma / Math.sqrt(10)))) * 100).toFixed(0)}% to <strong>{(powerMetrics.power * 100).toFixed(1)}%</strong> without increasing your Type I false alarm rate α ({alpha}).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
