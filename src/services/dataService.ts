import { Question } from '../types/quiz';
import { AdminUser, QuestionFormData, ActivityLog } from '../types/admin';

const QUESTIONS_STORAGE_KEY = 'shreyan_quiz_questions';
const AUDIT_LOG_KEY = 'shreyan_quiz_audit_log';
const USER_SESSIONS_KEY = 'shreyan_quiz_user_sessions';
const LOCKOUT_DATA_KEY = 'shreyan_quiz_lockout_data';

export interface UserSession {
  username: string;
  sessionId: string;
  loginTime: number;
  lastActivity: number;
  loginAttempts: number;
  isLocked: boolean;
  lockoutStartTime?: number;
  lockoutReason?: string;
}

export interface LockoutData {
  username: string;
  lockoutStartTime: number;
  lockoutDuration: number; // in milliseconds
  reason: string;
  adminId?: string;
}

class DataService {
  private static instance: DataService;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.initializeStorage();
  }

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private initializeStorage(): void {
    // Initialize storage with default data if empty
    if (!localStorage.getItem(QUESTIONS_STORAGE_KEY)) {
      this.saveQuestions([]);
    }
    if (!localStorage.getItem(AUDIT_LOG_KEY)) {
      this.saveAuditLog([]);
    }
    if (!localStorage.getItem(USER_SESSIONS_KEY)) {
      this.saveUserSessions([]);
    }
    if (!localStorage.getItem(LOCKOUT_DATA_KEY)) {
      this.saveLockoutData([]);
    }
  }

  // Event system for real-time updates
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Questions Management
  getQuestions(): Question[] {
    try {
      const data = localStorage.getItem(QUESTIONS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading questions:', error);
      return [];
    }
  }

  saveQuestions(questions: Question[]): void {
    try {
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
      this.emit('questionsUpdated', questions);
    } catch (error) {
      console.error('Error saving questions:', error);
      throw new Error('Failed to save questions');
    }
  }

  addQuestion(questionData: QuestionFormData, adminUser: AdminUser): Question {
    const questions = this.getQuestions();
    const newQuestion: Question = {
      id: this.generateId(),
      question: questionData.question,
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation,
      difficulty: questionData.difficulty,
      category: questionData.category,
    };

    questions.push(newQuestion);
    this.saveQuestions(questions);
    
    this.logActivity({
      id: this.generateId(),
      action: 'Question Added',
      user: adminUser.username,
      timestamp: Date.now(),
      details: `Added question: "${questionData.question.substring(0, 50)}..."`
    });

    return newQuestion;
  }

  updateQuestion(questionId: string, questionData: QuestionFormData, adminUser: AdminUser): Question {
    const questions = this.getQuestions();
    const index = questions.findIndex(q => q.id === questionId);
    
    if (index === -1) {
      throw new Error('Question not found');
    }

    const updatedQuestion: Question = {
      ...questions[index],
      question: questionData.question,
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation,
      difficulty: questionData.difficulty,
      category: questionData.category,
    };

    questions[index] = updatedQuestion;
    this.saveQuestions(questions);
    
    this.logActivity({
      id: this.generateId(),
      action: 'Question Updated',
      user: adminUser.username,
      timestamp: Date.now(),
      details: `Updated question: "${questionData.question.substring(0, 50)}..."`
    });

    return updatedQuestion;
  }

  deleteQuestion(questionId: string, adminUser: AdminUser): void {
    const questions = this.getQuestions();
    const questionIndex = questions.findIndex(q => q.id === questionId);
    
    if (questionIndex === -1) {
      throw new Error('Question not found');
    }

    const deletedQuestion = questions[questionIndex];
    questions.splice(questionIndex, 1);
    this.saveQuestions(questions);
    
    this.logActivity({
      id: this.generateId(),
      action: 'Question Deleted',
      user: adminUser.username,
      timestamp: Date.now(),
      details: `Deleted question: "${deletedQuestion.question.substring(0, 50)}..."`
    });
  }

  bulkAddQuestions(questionsData: QuestionFormData[], adminUser: AdminUser): Question[] {
    const questions = this.getQuestions();
    const newQuestions: Question[] = questionsData.map(data => ({
      id: this.generateId(),
      question: data.question,
      options: data.options,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      difficulty: data.difficulty,
      category: data.category,
    }));

    questions.push(...newQuestions);
    this.saveQuestions(questions);
    
    this.logActivity({
      id: this.generateId(),
      action: 'Bulk Questions Added',
      user: adminUser.username,
      timestamp: Date.now(),
      details: `Added ${newQuestions.length} questions via bulk upload`
    });

    return newQuestions;
  }

  // User Session Management
  getUserSessions(): UserSession[] {
    try {
      const data = localStorage.getItem(USER_SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading user sessions:', error);
      return [];
    }
  }

  saveUserSessions(sessions: UserSession[]): void {
    try {
      localStorage.setItem(USER_SESSIONS_KEY, JSON.stringify(sessions));
      this.emit('userSessionsUpdated', sessions);
    } catch (error) {
      console.error('Error saving user sessions:', error);
      throw new Error('Failed to save user sessions');
    }
  }

  createUserSession(username: string): UserSession {
    const sessions = this.getUserSessions();
    const existingSessionIndex = sessions.findIndex(s => s.username === username);
    
    const newSession: UserSession = {
      username,
      sessionId: this.generateSessionId(),
      loginTime: Date.now(),
      lastActivity: Date.now(),
      loginAttempts: 0,
      isLocked: false,
    };

    if (existingSessionIndex > -1) {
      sessions[existingSessionIndex] = newSession;
    } else {
      sessions.push(newSession);
    }

    this.saveUserSessions(sessions);
    return newSession;
  }

  updateUserSession(username: string, updates: Partial<UserSession>): void {
    const sessions = this.getUserSessions();
    const sessionIndex = sessions.findIndex(s => s.username === username);
    
    if (sessionIndex > -1) {
      sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
      this.saveUserSessions(sessions);
    }
  }

  getUserSession(username: string): UserSession | null {
    const sessions = this.getUserSessions();
    return sessions.find(s => s.username === username) || null;
  }

  // Lockout Management
  getLockoutData(): LockoutData[] {
    try {
      const data = localStorage.getItem(LOCKOUT_DATA_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading lockout data:', error);
      return [];
    }
  }

  saveLockoutData(lockouts: LockoutData[]): void {
    try {
      localStorage.setItem(LOCKOUT_DATA_KEY, JSON.stringify(lockouts));
      this.emit('lockoutDataUpdated', lockouts);
    } catch (error) {
      console.error('Error saving lockout data:', error);
      throw new Error('Failed to save lockout data');
    }
  }

  createLockout(username: string, reason: string, adminId?: string): LockoutData {
    const lockouts = this.getLockoutData();
    const lockoutDuration = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    
    const newLockout: LockoutData = {
      username,
      lockoutStartTime: Date.now(),
      lockoutDuration,
      reason,
      adminId,
    };

    // Remove existing lockout for this user
    const filteredLockouts = lockouts.filter(l => l.username !== username);
    filteredLockouts.push(newLockout);
    
    this.saveLockoutData(filteredLockouts);
    
    // Update user session
    this.updateUserSession(username, {
      isLocked: true,
      lockoutStartTime: newLockout.lockoutStartTime,
      lockoutReason: reason,
    });

    this.logActivity({
      id: this.generateId(),
      action: 'User Locked',
      user: adminId || 'System',
      timestamp: Date.now(),
      details: `User ${username} locked for: ${reason}`
    });

    return newLockout;
  }

  isUserLocked(username: string): { isLocked: boolean; remainingTime?: number; reason?: string } {
    const lockouts = this.getLockoutData();
    const userLockout = lockouts.find(l => l.username === username);
    
    if (!userLockout) {
      return { isLocked: false };
    }

    const now = Date.now();
    const lockoutEndTime = userLockout.lockoutStartTime + userLockout.lockoutDuration;
    
    if (now >= lockoutEndTime) {
      // Lockout expired, remove it
      this.removeLockout(username);
      return { isLocked: false };
    }

    return {
      isLocked: true,
      remainingTime: lockoutEndTime - now,
      reason: userLockout.reason,
    };
  }

  removeLockout(username: string): void {
    const lockouts = this.getLockoutData();
    const filteredLockouts = lockouts.filter(l => l.username !== username);
    this.saveLockoutData(filteredLockouts);
    
    // Update user session
    this.updateUserSession(username, {
      isLocked: false,
      lockoutStartTime: undefined,
      lockoutReason: undefined,
    });
  }

  // Audit Log Management
  getAuditLog(): ActivityLog[] {
    try {
      const data = localStorage.getItem(AUDIT_LOG_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading audit log:', error);
      return [];
    }
  }

  saveAuditLog(logs: ActivityLog[]): void {
    try {
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
      this.emit('auditLogUpdated', logs);
    } catch (error) {
      console.error('Error saving audit log:', error);
      throw new Error('Failed to save audit log');
    }
  }

  logActivity(activity: ActivityLog): void {
    const logs = this.getAuditLog();
    logs.unshift(activity); // Add to beginning for chronological order
    
    // Keep only last 1000 entries
    if (logs.length > 1000) {
      logs.splice(1000);
    }
    
    this.saveAuditLog(logs);
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Data validation
  validateQuestionData(data: QuestionFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.question?.trim()) {
      errors.push('Question text is required');
    }

    if (!Array.isArray(data.options) || data.options.length < 2) {
      errors.push('At least 2 options are required');
    }

    if (data.correctAnswer < 0 || data.correctAnswer >= data.options.length) {
      errors.push('Invalid correct answer index');
    }

    if (!data.category?.trim()) {
      errors.push('Category is required');
    }

    if (!['easy', 'medium', 'hard'].includes(data.difficulty)) {
      errors.push('Invalid difficulty level');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Data export/import for backup
  exportData(): string {
    const data = {
      questions: this.getQuestions(),
      auditLog: this.getAuditLog(),
      userSessions: this.getUserSessions(),
      lockoutData: this.getLockoutData(),
      exportTime: Date.now(),
    };
    
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string, adminUser: AdminUser): void {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.questions) {
        this.saveQuestions(data.questions);
      }
      
      this.logActivity({
        id: this.generateId(),
        action: 'Data Imported',
        user: adminUser.username,
        timestamp: Date.now(),
        details: `Imported data from backup created at ${new Date(data.exportTime).toLocaleString()}`
      });
    } catch (error) {
      throw new Error('Invalid data format');
    }
  }
}

export const dataService = DataService.getInstance();