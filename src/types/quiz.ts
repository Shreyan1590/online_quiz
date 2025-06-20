export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, number>;
  timeRemaining: number;
  isCompleted: boolean;
  startTime: number;
  score: number;
}

export interface User {
  username: string;
  sessionId: string;
  loginTime: number;
}

export interface QuizResult {
  username: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  completedAt: number;
  answers: Record<string, number>;
}

export interface SecurityState {
  tabSwitchCount: number;
  focusLostCount: number;
  warnings: string[];
  isWindowFocused: boolean;
}