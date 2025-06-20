import { QuizSettings } from '../types/admin';
import { realtimeService } from './realtimeService';

const SETTINGS_STORAGE_KEY = 'quiz_settings';

class SettingsService {
  private static instance: SettingsService;
  private currentSettings: QuizSettings | null = null;

  private constructor() {
    this.loadSettings();
    this.setupRealtimeSync();
  }

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  private setupRealtimeSync(): void {
    realtimeService.addEventListener('settingsUpdated', (settings: QuizSettings) => {
      this.currentSettings = settings;
      this.saveToStorage(settings);
    });
  }

  private loadSettings(): QuizSettings {
    try {
      const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (data) {
        this.currentSettings = JSON.parse(data);
        return this.currentSettings;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    
    // Return default settings
    this.currentSettings = this.getDefaultSettings();
    this.saveToStorage(this.currentSettings);
    return this.currentSettings;
  }

  private saveToStorage(settings: QuizSettings): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to storage:', error);
    }
  }

  getSettings(): QuizSettings {
    if (!this.currentSettings) {
      return this.loadSettings();
    }
    return this.currentSettings;
  }

  updateSettings(updates: Partial<QuizSettings>, updatedBy: string): QuizSettings {
    const currentSettings = this.getSettings();
    const newSettings: QuizSettings = {
      ...currentSettings,
      ...updates,
      updatedAt: Date.now(),
      updatedBy
    };

    // Validate settings
    this.validateSettings(newSettings);

    this.currentSettings = newSettings;
    this.saveToStorage(newSettings);
    
    // Sync across all instances
    realtimeService.syncSettings(newSettings, updatedBy);
    
    return newSettings;
  }

  private validateSettings(settings: QuizSettings): void {
    const errors: string[] = [];

    if (settings.timeLimit < 60 || settings.timeLimit > 7200) {
      errors.push('Time limit must be between 1 minute and 2 hours');
    }

    if (settings.questionsPerQuiz < 1 || settings.questionsPerQuiz > 50) {
      errors.push('Questions per quiz must be between 1 and 50');
    }

    if (settings.passingScore < 0 || settings.passingScore > 100) {
      errors.push('Passing score must be between 0 and 100');
    }

    if (settings.maxTabSwitches < 0 || settings.maxTabSwitches > 10) {
      errors.push('Max tab switches must be between 0 and 10');
    }

    if (settings.sessionTimeout < 5 || settings.sessionTimeout > 480) {
      errors.push('Session timeout must be between 5 minutes and 8 hours');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
  }

  private getDefaultSettings(): QuizSettings {
    return {
      id: 'default',
      timeLimit: 300, // 5 minutes
      questionsPerQuiz: 5,
      passingScore: 60,
      allowRetakes: true,
      shuffleQuestions: true,
      shuffleAnswers: false,
      showExplanations: true,
      showScoreImmediately: true,
      maxTabSwitches: 3,
      sessionTimeout: 30, // minutes
      autoBlockAfterCompletion: false,
      blockingRules: [],
      updatedAt: Date.now(),
      updatedBy: 'system'
    };
  }

  resetToDefaults(updatedBy: string): QuizSettings {
    const defaultSettings = this.getDefaultSettings();
    defaultSettings.updatedBy = updatedBy;
    defaultSettings.updatedAt = Date.now();
    
    return this.updateSettings(defaultSettings, updatedBy);
  }

  // Get specific setting values
  getTimeLimit(): number {
    return this.getSettings().timeLimit;
  }

  getQuestionsPerQuiz(): number {
    return this.getSettings().questionsPerQuiz;
  }

  getMaxTabSwitches(): number {
    return this.getSettings().maxTabSwitches;
  }

  isRetakeAllowed(): boolean {
    return this.getSettings().allowRetakes;
  }

  shouldAutoBlockAfterCompletion(): boolean {
    return this.getSettings().autoBlockAfterCompletion;
  }

  // Export/Import functionality
  exportSettings(): string {
    const settings = this.getSettings();
    return JSON.stringify(settings, null, 2);
  }

  importSettings(settingsJson: string, importedBy: string): QuizSettings {
    try {
      const importedSettings = JSON.parse(settingsJson);
      
      // Validate imported settings
      this.validateSettings(importedSettings);
      
      // Update with import metadata
      importedSettings.updatedAt = Date.now();
      importedSettings.updatedBy = importedBy;
      
      return this.updateSettings(importedSettings, importedBy);
    } catch (error) {
      throw new Error('Invalid settings format: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

export const settingsService = SettingsService.getInstance();