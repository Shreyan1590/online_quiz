import { ManagedUser, QuizAttempt, AttendanceRecord, SecurityViolation, BlockingRule } from '../types/admin';
import { realtimeService } from './realtimeService';

const USERS_STORAGE_KEY = 'quiz_managed_users';
const ATTENDANCE_STORAGE_KEY = 'quiz_attendance';
const BLOCKING_RULES_KEY = 'quiz_blocking_rules';

class UserManagementService {
  private static instance: UserManagementService;

  private constructor() {}

  static getInstance(): UserManagementService {
    if (!UserManagementService.instance) {
      UserManagementService.instance = new UserManagementService();
    }
    return UserManagementService.instance;
  }

  // User CRUD operations
  getUsers(): ManagedUser[] {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  saveUsers(users: ManagedUser[], updatedBy: string = 'system'): void {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      realtimeService.syncUsers(users, updatedBy);
    } catch (error) {
      console.error('Error saving users:', error);
      throw new Error('Failed to save users');
    }
  }

  createUser(userData: Partial<ManagedUser>, createdBy: string): ManagedUser {
    const users = this.getUsers();
    
    // Check for duplicate username
    if (users.some(u => u.username === userData.username)) {
      throw new Error('Username already exists');
    }

    const newUser: ManagedUser = {
      id: this.generateId(),
      username: userData.username || '',
      email: userData.email || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      status: 'active',
      createdAt: Date.now(),
      quizHistory: [],
      attendance: []
    };

    users.push(newUser);
    this.saveUsers(users, createdBy);
    
    return newUser;
  }

  updateUser(userId: string, updates: Partial<ManagedUser>, updatedBy: string): ManagedUser {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    this.saveUsers(users, updatedBy);
    
    return users[userIndex];
  }

  deleteUser(userId: string, deletedBy: string): void {
    const users = this.getUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    
    if (filteredUsers.length === users.length) {
      throw new Error('User not found');
    }

    this.saveUsers(filteredUsers, deletedBy);
  }

  getUserByUsername(username: string): ManagedUser | null {
    const users = this.getUsers();
    return users.find(u => u.username === username) || null;
  }

  // Blocking/Unblocking functionality
  blockUser(userId: string, reason: string, blockedBy: string, ruleId?: string): void {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex].status = 'blocked';
    users[userIndex].blockingInfo = {
      blockedAt: Date.now(),
      blockedBy,
      reason,
      ruleId
    };

    this.saveUsers(users, blockedBy);
    
    realtimeService.sendNotification('warning', `User ${users[userIndex].username} has been blocked`, {
      reason,
      blockedBy
    });
  }

  unblockUser(userId: string, unblockedBy: string): void {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex].status = 'active';
    delete users[userIndex].blockingInfo;

    this.saveUsers(users, unblockedBy);
    
    realtimeService.sendNotification('success', `User ${users[userIndex].username} has been unblocked`, {
      unblockedBy
    });
  }

  // Quiz attempt tracking
  startQuizAttempt(username: string): QuizAttempt {
    const user = this.getUserByUsername(username);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status === 'blocked') {
      throw new Error('User is blocked and cannot take quizzes');
    }

    const attempt: QuizAttempt = {
      id: this.generateId(),
      startTime: Date.now(),
      status: 'in_progress',
      questionsAnswered: 0,
      totalQuestions: 0,
      timeSpent: 0,
      violations: []
    };

    user.quizHistory.push(attempt);
    user.lastLogin = Date.now();
    
    this.updateUser(user.id, user, 'system');
    this.recordAttendance(username);
    
    return attempt;
  }

  updateQuizAttempt(username: string, attemptId: string, updates: Partial<QuizAttempt>): void {
    const user = this.getUserByUsername(username);
    if (!user) return;

    const attemptIndex = user.quizHistory.findIndex(a => a.id === attemptId);
    if (attemptIndex === -1) return;

    user.quizHistory[attemptIndex] = { ...user.quizHistory[attemptIndex], ...updates };
    this.updateUser(user.id, user, 'system');
  }

  completeQuizAttempt(username: string, attemptId: string, score: number, questionsAnswered: number, totalQuestions: number): void {
    const user = this.getUserByUsername(username);
    if (!user) return;

    const attemptIndex = user.quizHistory.findIndex(a => a.id === attemptId);
    if (attemptIndex === -1) return;

    const attempt = user.quizHistory[attemptIndex];
    attempt.endTime = Date.now();
    attempt.score = score;
    attempt.status = 'completed';
    attempt.questionsAnswered = questionsAnswered;
    attempt.totalQuestions = totalQuestions;
    attempt.timeSpent = attempt.endTime - attempt.startTime;

    this.updateUser(user.id, user, 'system');
    
    // Check blocking rules
    this.checkBlockingRules(user, attempt);
  }

  addSecurityViolation(username: string, attemptId: string, violation: Omit<SecurityViolation, 'id'>): void {
    const user = this.getUserByUsername(username);
    if (!user) return;

    const attemptIndex = user.quizHistory.findIndex(a => a.id === attemptId);
    if (attemptIndex === -1) return;

    const fullViolation: SecurityViolation = {
      id: this.generateId(),
      ...violation
    };

    user.quizHistory[attemptIndex].violations.push(fullViolation);
    this.updateUser(user.id, user, 'system');
  }

  // Attendance tracking
  recordAttendance(username: string): void {
    const user = this.getUserByUsername(username);
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const existingAttendance = user.attendance.find(a => {
      const attendanceDate = new Date(a.date);
      attendanceDate.setHours(0, 0, 0, 0);
      return attendanceDate.getTime() === todayTimestamp;
    });

    if (!existingAttendance) {
      const newAttendance: AttendanceRecord = {
        id: this.generateId(),
        date: todayTimestamp,
        loginTime: Date.now(),
        quizAttempts: [],
        status: 'present'
      };
      
      user.attendance.push(newAttendance);
      this.updateUser(user.id, user, 'system');
    }
  }

  // Blocking rules management
  getBlockingRules(): BlockingRule[] {
    try {
      const data = localStorage.getItem(BLOCKING_RULES_KEY);
      return data ? JSON.parse(data) : this.getDefaultBlockingRules();
    } catch (error) {
      console.error('Error loading blocking rules:', error);
      return this.getDefaultBlockingRules();
    }
  }

  saveBlockingRules(rules: BlockingRule[]): void {
    try {
      localStorage.setItem(BLOCKING_RULES_KEY, JSON.stringify(rules));
    } catch (error) {
      console.error('Error saving blocking rules:', error);
      throw new Error('Failed to save blocking rules');
    }
  }

  private getDefaultBlockingRules(): BlockingRule[] {
    return [
      {
        id: 'rule_1',
        name: 'Low Score Block',
        condition: 'score_below',
        value: 50,
        isActive: false,
        createdAt: Date.now()
      },
      {
        id: 'rule_2',
        name: 'Excessive Attempts',
        condition: 'attempts_exceeded',
        value: 3,
        isActive: false,
        createdAt: Date.now()
      }
    ];
  }

  private checkBlockingRules(user: ManagedUser, attempt: QuizAttempt): void {
    const rules = this.getBlockingRules().filter(r => r.isActive);
    
    for (const rule of rules) {
      let shouldBlock = false;
      let reason = '';

      switch (rule.condition) {
        case 'score_below':
          if (attempt.score !== undefined && attempt.score < (rule.value || 0)) {
            shouldBlock = true;
            reason = `Score ${attempt.score}% is below minimum ${rule.value}%`;
          }
          break;
          
        case 'attempts_exceeded':
          const completedAttempts = user.quizHistory.filter(a => a.status === 'completed').length;
          if (completedAttempts >= (rule.value || 0)) {
            shouldBlock = true;
            reason = `Exceeded maximum attempts (${rule.value})`;
          }
          break;
          
        case 'time_exceeded':
          if (attempt.timeSpent > (rule.value || 0) * 60 * 1000) {
            shouldBlock = true;
            reason = `Quiz time exceeded limit (${rule.value} minutes)`;
          }
          break;
      }

      if (shouldBlock) {
        this.blockUser(user.id, reason, 'system', rule.id);
        break;
      }
    }
  }

  // Statistics
  getUserStats(): {
    total: number;
    active: number;
    blocked: number;
    pending: number;
    averageScore: number;
    totalAttempts: number;
  } {
    const users = this.getUsers();
    const stats = {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      blocked: users.filter(u => u.status === 'blocked').length,
      pending: users.filter(u => u.status === 'pending').length,
      averageScore: 0,
      totalAttempts: 0
    };

    const allAttempts = users.flatMap(u => u.quizHistory.filter(a => a.status === 'completed' && a.score !== undefined));
    stats.totalAttempts = allAttempts.length;
    
    if (allAttempts.length > 0) {
      stats.averageScore = allAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / allAttempts.length;
    }

    return stats;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

export const userManagementService = UserManagementService.getInstance();