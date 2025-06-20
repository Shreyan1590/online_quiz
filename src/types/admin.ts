export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
  sessionId: string;
  loginTime: number;
  lastActivity: number;
}

export interface QuestionFormData {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  isActive: boolean;
  timeLimit?: number;
}

export interface QuizSettings {
  id: string;
  name: string;
  description: string;
  timeLimit: number;
  questionsCount: number;
  categories: string[];
  difficulties: ('easy' | 'medium' | 'hard')[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BulkUploadResult {
  success: number;
  failed: number;
  errors: string[];
  questions: QuestionFormData[];
}

export interface AdminStats {
  totalQuestions: number;
  activeQuestions: number;
  totalUsers: number;
  totalQuizzes: number;
  averageScore: number;
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: number;
  details: string;
}