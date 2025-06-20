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
  timeLimit: number;
  questionsPerQuiz: number;
  passingScore: number;
  allowRetakes: boolean;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showExplanations: boolean;
  showScoreImmediately: boolean;
  maxTabSwitches: number;
  sessionTimeout: number;
  autoBlockAfterCompletion: boolean;
  blockingRules: BlockingRule[];
  updatedAt: number;
  updatedBy: string;
}

export interface BlockingRule {
  id: string;
  name: string;
  condition: 'score_below' | 'attempts_exceeded' | 'time_exceeded' | 'manual';
  value?: number;
  isActive: boolean;
  createdAt: number;
}

export interface ManagedUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'blocked' | 'pending';
  createdAt: number;
  lastLogin?: number;
  quizHistory: QuizAttempt[];
  blockingInfo?: {
    blockedAt: number;
    blockedBy: string;
    reason: string;
    ruleId?: string;
  };
  attendance: AttendanceRecord[];
}

export interface QuizAttempt {
  id: string;
  startTime: number;
  endTime?: number;
  score?: number;
  status: 'in_progress' | 'completed' | 'abandoned' | 'blocked';
  questionsAnswered: number;
  totalQuestions: number;
  timeSpent: number;
  violations: SecurityViolation[];
}

export interface AttendanceRecord {
  id: string;
  date: number;
  loginTime: number;
  logoutTime?: number;
  quizAttempts: string[];
  status: 'present' | 'absent' | 'partial';
}

export interface SecurityViolation {
  id: string;
  type: 'tab_switch' | 'focus_lost' | 'right_click' | 'dev_tools' | 'copy_paste';
  timestamp: number;
  details: string;
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
  activeUsers: number;
  blockedUsers: number;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: number;
  details: string;
  category: 'user_management' | 'quiz_settings' | 'questions' | 'security' | 'system';
}

export interface SystemBackup {
  id: string;
  createdAt: number;
  createdBy: string;
  type: 'manual' | 'automatic';
  size: number;
  data: {
    questions: any[];
    users: any[];
    settings: any;
    auditLog: any[];
  };
}