/**
 * Statistical computation utilities for Hypothesis Testing
 * Accurately calculates standard normal CDF, inverse CDF, t-distribution,
 * p-values, critical values, Cohen's d, and statistical power.
 */

// Error function approximation (Abramowitz and Stegun 7.1.26, max error: 1.5e-7)
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const a = Math.abs(x);

  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const t = 1.0 / (1.0 + p * a);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-a * a);

  return sign * y;
}

// Standard normal Probability Density Function (PDF)
export function normalPdf(x: number, mean = 0, stdDev = 1): number {
  const variance = stdDev * stdDev;
  return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-Math.pow(x - mean, 2) / (2 * variance));
}

// Standard normal Cumulative Distribution Function (CDF): P(Z <= z)
export function normalCdf(z: number, mean = 0, stdDev = 1): number {
  const standardZ = (z - mean) / stdDev;
  return 0.5 * (1 + erf(standardZ / Math.SQRT2));
}

// Inverse Standard Normal CDF (Quantile / Probit function using rational approximation)
export function normalInverseCdf(p: number): number {
  if (p <= 0 || p >= 1) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
  }

  // Coefficients in rational approximations
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0, -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0];

  const q = p - 0.5;
  let r: number;

  if (Math.abs(q) <= 0.42) {
    r = q * q;
    return (
      (q *
        (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5])) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1.0)
    );
  } else {
    r = p < 0.5 ? p : 1.0 - p;
    r = Math.log(-Math.log(r));
    let x =
      c[0] +
      r * (c[1] + r * (c[2] + r * (c[3] + r * (c[4] + r * c[5]))));
    x =
      x /
      (1.0 +
        r * (d[0] + r * (d[1] + r * (d[2] + r * d[3]))));
    return p < 0.5 ? -x : x;
  }
}

// Student's t critical value approximation using Hill's algorithm
export function tInverseCdf(p: number, df: number): number {
  if (df >= 120) {
    return normalInverseCdf(p);
  }
  const z = normalInverseCdf(p);
  // Cornish-Fisher expansion for Student-t
  const z2 = z * z;
  const z3 = z * z2;
  const z5 = z3 * z2;
  const z7 = z5 * z2;

  const t =
    z +
    (z3 + z) / (4 * df) +
    (5 * z5 + 16 * z3 + 3 * z) / (96 * df * df) +
    (3 * z7 + 19 * z5 + 17 * z3 - 15 * z) / (384 * Math.pow(df, 3));

  return t;
}

// Calculate critical value(s)
export function getCriticalValues(
  alpha: number,
  direction: 'two_tailed' | 'right_tailed' | 'left_tailed',
  testType: 'z_test' | 't_test' = 'z_test',
  df = 30
): { leftCritical: number | null; rightCritical: number | null } {
  const quantileFn = (prob: number) =>
    testType === 't_test' ? tInverseCdf(prob, df) : normalInverseCdf(prob);

  if (direction === 'two_tailed') {
    const crit = quantileFn(1 - alpha / 2);
    return { leftCritical: -crit, rightCritical: crit };
  } else if (direction === 'right_tailed') {
    return { leftCritical: null, rightCritical: quantileFn(1 - alpha) };
  } else {
    return { leftCritical: quantileFn(alpha), rightCritical: null };
  }
}

// Calculate p-value from test statistic
export function calculatePValue(
  testStat: number,
  direction: 'two_tailed' | 'right_tailed' | 'left_tailed',
  testType: 'z_test' | 't_test' = 'z_test',
  _df = 30
): number {
  const cdfFn = (val: number) => normalCdf(val);

  if (direction === 'two_tailed') {
    const absStat = Math.abs(testStat);
    return Math.min(1, 2 * (1 - cdfFn(absStat)));
  } else if (direction === 'right_tailed') {
    return Math.max(0, Math.min(1, 1 - cdfFn(testStat)));
  } else {
    return Math.max(0, Math.min(1, cdfFn(testStat)));
  }
}

// Calculate Statistical Power (1 - beta) and Type II error rate (beta)
export function calculatePower(
  mu0: number,
  muA: number,
  sigma: number,
  n: number,
  alpha: number,
  direction: 'two_tailed' | 'right_tailed' | 'left_tailed'
): { power: number; beta: number; cohenD: number; se: number } {
  const se = sigma / Math.sqrt(n);
  const cohenD = Math.abs(muA - mu0) / sigma;

  let power = 0;

  if (direction === 'right_tailed') {
    const zCrit = normalInverseCdf(1 - alpha);
    const xCrit = mu0 + zCrit * se;
    // Power is P(X_bar > xCrit | mu = muA)
    const zA = (xCrit - muA) / se;
    power = 1 - normalCdf(zA);
  } else if (direction === 'left_tailed') {
    const zCrit = normalInverseCdf(alpha);
    const xCrit = mu0 + zCrit * se;
    // Power is P(X_bar < xCrit | mu = muA)
    const zA = (xCrit - muA) / se;
    power = normalCdf(zA);
  } else {
    // Two-tailed
    const zCrit = normalInverseCdf(1 - alpha / 2);
    const xCritUpper = mu0 + zCrit * se;
    const xCritLower = mu0 - zCrit * se;

    const zUpper = (xCritUpper - muA) / se;
    const zLower = (xCritLower - muA) / se;

    power = 1 - normalCdf(zUpper) + normalCdf(zLower);
  }

  power = Math.max(0, Math.min(1, power));
  const beta = 1 - power;

  return { power, beta, cohenD, se };
}

// Box-Muller transform for generating standard normal random numbers
export function randomGaussian(mean = 0, stdDev = 1): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

// Generate sample mean
export function generateSampleMean(trueMean: number, sigma: number, n: number): number {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += randomGaussian(trueMean, sigma);
  }
  return sum / n;
}
