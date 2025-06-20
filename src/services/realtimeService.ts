class RealtimeService {
  private static instance: RealtimeService;
  private eventListeners: Map<string, Function[]> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: number = 0;

  private constructor() {
    this.startSyncMonitoring();
  }

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  private startSyncMonitoring(): void {
    // Monitor for changes every 500ms for real-time feel
    this.syncInterval = setInterval(() => {
      this.checkForUpdates();
    }, 500);

    // Listen for storage events from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key && e.newValue) {
        this.handleStorageChange(e.key, e.newValue);
      }
    });

    // Listen for focus events to sync when user returns
    window.addEventListener('focus', () => {
      this.forceSync();
    });
  }

  private checkForUpdates(): void {
    const currentTime = Date.now();
    
    // Check if settings have been updated
    const settingsData = localStorage.getItem('quiz_settings_sync');
    if (settingsData) {
      try {
        const { timestamp, data } = JSON.parse(settingsData);
        if (timestamp > this.lastSyncTime) {
          this.emit('settingsUpdated', data);
          this.lastSyncTime = timestamp;
        }
      } catch (error) {
        console.error('Error parsing settings sync data:', error);
      }
    }

    // Check for user management updates
    const userUpdatesData = localStorage.getItem('user_management_sync');
    if (userUpdatesData) {
      try {
        const { timestamp, data } = JSON.parse(userUpdatesData);
        if (timestamp > this.lastSyncTime) {
          this.emit('usersUpdated', data);
          this.lastSyncTime = Math.max(this.lastSyncTime, timestamp);
        }
      } catch (error) {
        console.error('Error parsing user sync data:', error);
      }
    }
  }

  private handleStorageChange(key: string, newValue: string): void {
    try {
      const data = JSON.parse(newValue);
      
      switch (key) {
        case 'quiz_settings_sync':
          this.emit('settingsUpdated', data.data);
          break;
        case 'user_management_sync':
          this.emit('usersUpdated', data.data);
          break;
        case 'quiz_questions_sync':
          this.emit('questionsUpdated', data.data);
          break;
        case 'system_notification':
          this.emit('systemNotification', data);
          break;
      }
    } catch (error) {
      console.error('Error handling storage change:', error);
    }
  }

  private forceSync(): void {
    this.lastSyncTime = 0;
    this.checkForUpdates();
  }

  // Event system
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
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Sync methods
  syncSettings(settings: any, updatedBy: string): void {
    const syncData = {
      timestamp: Date.now(),
      data: settings,
      updatedBy
    };
    
    localStorage.setItem('quiz_settings_sync', JSON.stringify(syncData));
    this.emit('settingsUpdated', settings);
  }

  syncUsers(users: any[], updatedBy: string): void {
    const syncData = {
      timestamp: Date.now(),
      data: users,
      updatedBy
    };
    
    localStorage.setItem('user_management_sync', JSON.stringify(syncData));
    this.emit('usersUpdated', users);
  }

  syncQuestions(questions: any[], updatedBy: string): void {
    const syncData = {
      timestamp: Date.now(),
      data: questions,
      updatedBy
    };
    
    localStorage.setItem('quiz_questions_sync', JSON.stringify(syncData));
    this.emit('questionsUpdated', questions);
  }

  sendNotification(type: 'info' | 'warning' | 'error' | 'success', message: string, details?: any): void {
    const notification = {
      id: this.generateId(),
      type,
      message,
      details,
      timestamp: Date.now()
    };
    
    localStorage.setItem('system_notification', JSON.stringify(notification));
    this.emit('systemNotification', notification);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    window.removeEventListener('storage', this.handleStorageChange);
    window.removeEventListener('focus', this.forceSync);
    this.eventListeners.clear();
  }
}

export const realtimeService = RealtimeService.getInstance();