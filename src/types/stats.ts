export type TestDirection = 'two_tailed' | 'right_tailed' | 'left_tailed';
export type TestType = 'z_test' | 't_test';

export interface PracticeStep {
  stepNumber: number;
  title: string;
  instruction: string;
  hint: string;
  explanation: string;
}

export interface PracticeProblem {
  id: string;
  title: string;
  domain: string;
  iconName: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  scenario: string;
  parameterSymbol: string; // e.g. 'μ' or 'p'
  parameterName: string; // e.g. 'Mean Systolic Blood Pressure'
  unit: string; // e.g. 'mmHg'
  mu0: number;
  direction: TestDirection;
  directionLabel: string;
  h0Formula: string;
  haFormula: string;
  testType: TestType;
  alpha: number;
  n: number;
  df?: number;
  sampleMean: number;
  stdDev: number; // population sigma or sample s
  stdError: number;
  testStatistic: number;
  criticalValues: {
    left: number | null;
    right: number | null;
  };
  pValue: number;
  correctDecision: 'reject' | 'fail_to_reject';
  realWorldInterpretation: string;
  commonPitfall: string;
  questionPrompts: {
    step1: {
      question: string;
      options: { id: string; label: string; isCorrect: boolean }[];
    };
    step2: {
      question: string;
      options: { id: string; label: string; isCorrect: boolean }[];
    };
    step3: {
      question: string;
      correctValue: number;
      tolerance: number;
      unit: string;
    };
    step4: {
      question: string;
      correctValue: number;
      tolerance: number;
    };
    step5: {
      question: string;
      options: { id: string; label: string; isCorrect: boolean }[];
    };
  };
}

export interface SimulationParams {
  mu0: number;
  muA: number;
  sigma: number;
  n: number;
  alpha: number;
  direction: TestDirection;
  testType: TestType;
  sampleMean: number;
}

export interface MonteCarloSample {
  id: number;
  sampleMean: number;
  testStat: number;
  pValue: number;
  rejected: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface GeneratedImageItem {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: string;
  model: string;
}
