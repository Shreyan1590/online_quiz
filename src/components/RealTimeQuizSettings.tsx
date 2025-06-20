import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Clock, Shield, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { QuizSettings, AdminUser } from '../types/admin';
import { settingsService } from '../services/settingsService';
import { realtimeService } from '../services/realtimeService';
import { LoadingSpinner } from './LoadingSpinner';

interface RealTimeQuizSettingsProps {
  adminUser: AdminUser;
}

export const RealTimeQuizSettings: React.FC<RealTimeQuizSettingsProps> = ({ adminUser }) => {
  const [settings, setSettings] = useState<QuizSettings>(settingsService.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    // Setup real-time sync
    const handleSettingsUpdate = (updatedSettings: QuizSettings) => {
      if (updatedSettings.updatedBy !== adminUser.username) {
        setSettings(updatedSettings);
        setHasUnsavedChanges(false);
        showNotification('info', `Settings updated by ${updatedSettings.updatedBy}`);
      }
    };

    realtimeService.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      realtimeService.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [adminUser.username]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSettingChange = (key: keyof QuizSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    setIsSaved(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedSettings = settingsService.updateSettings(settings, adminUser.username);
      setSettings(updatedSettings);
      setHasUnsavedChanges(false);
      setIsSaved(true);
      showNotification('success', 'Settings saved and synchronized across all instances');
      
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Are you sure you want to reset?')) {
      return;
    }
    
    try {
      const defaultSettings = settingsService.resetToDefaults(adminUser.username);
      setSettings(defaultSettings);
      setHasUnsavedChanges(false);
      showNotification('success', 'Settings reset to defaults');
    } catch (error) {
      showNotification('error', 'Failed to reset settings');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg border animate-slide-up ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : notification.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quiz Settings</h2>
          <p className="text-slate-600">Configure quiz parameters with real-time synchronization</p>
          {hasUnsavedChanges && (
            <p className="text-orange-600 text-sm mt-1">
              ⚠️ You have unsaved changes
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Real-time sync enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Quiz Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-red-600" />
            Basic Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Time Limit (seconds)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="60"
                  max="7200"
                  value={settings.timeLimit}
                  onChange={(e) => handleSettingChange('timeLimit', parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <span className="text-sm text-slate-500 min-w-0">
                  ({formatTime(settings.timeLimit)})
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Questions per Quiz
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.questionsPerQuiz}
                onChange={(e) => handleSettingChange('questionsPerQuiz', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Passing Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.passingScore}
                onChange={(e) => handleSettingChange('passingScore', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-red-600" />
            Security Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Tab Switches
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={settings.maxTabSwitches}
                onChange={(e) => handleSettingChange('maxTabSwitches', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                User will be locked out after this many tab switches
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Session Timeout (minutes)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <span className="text-sm text-slate-500 min-w-0">
                  ({formatDuration(settings.sessionTimeout)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Behavior */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-red-600" />
            Quiz Behavior
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.allowRetakes}
                onChange={(e) => handleSettingChange('allowRetakes', e.target.checked)}
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Allow quiz retakes</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.shuffleQuestions}
                onChange={(e) => handleSettingChange('shuffleQuestions', e.target.checked)}
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Shuffle questions</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.shuffleAnswers}
                onChange={(e) => handleSettingChange('shuffleAnswers', e.target.checked)}
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Shuffle answer options</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.showExplanations}
                onChange={(e) => handleSettingChange('showExplanations', e.target.checked)}
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Show explanations in results</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.showScoreImmediately}
                onChange={(e) => handleSettingChange('showScoreImmediately', e.target.checked)}
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Show score immediately after completion</span>
            </label>
          </div>
        </div>

        {/* User Management Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-red-600" />
            User Management
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoBlockAfterCompletion}
                onChange={(e) => handleSettingChange('autoBlockAfterCompletion', e.target.checked)}
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Auto-block users after quiz completion</span>
            </label>
            
            <div className="text-sm text-slate-600">
              <p className="mb-2"><strong>Active Blocking Rules:</strong></p>
              <ul className="space-y-1">
                {settings.blockingRules.filter(rule => rule.isActive).map(rule => (
                  <li key={rule.id} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>{rule.name}</span>
                  </li>
                ))}
                {settings.blockingRules.filter(rule => rule.isActive).length === 0 && (
                  <li className="text-slate-400">No active blocking rules</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Current Configuration Summary */}
        <div className="lg:col-span-2 bg-slate-50 rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Configuration Summary</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Quiz Duration:</span>
              <span className="font-medium">{formatTime(settings.timeLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Questions:</span>
              <span className="font-medium">{settings.questionsPerQuiz}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Passing Score:</span>
              <span className="font-medium">{settings.passingScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Max Tab Switches:</span>
              <span className="font-medium">{settings.maxTabSwitches}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Session Timeout:</span>
              <span className="font-medium">{formatDuration(settings.sessionTimeout)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Retakes:</span>
              <span className="font-medium">{settings.allowRetakes ? 'Allowed' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Auto-block:</span>
              <span className="font-medium">{settings.autoBlockAfterCompletion ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Last Updated:</span>
              <span className="font-medium">{new Date(settings.updatedAt).toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-slate-500">
            Last updated by: {settings.updatedBy} • Real-time sync: Active
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleReset}
          className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Defaults</span>
        </button>
        
        <button
          onClick={handleSave}
          disabled={isLoading || !hasUnsavedChanges}
          className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
            isSaved 
              ? 'bg-green-600 text-white' 
              : hasUnsavedChanges
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" text="" />
          ) : isSaved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Saved & Synced</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};