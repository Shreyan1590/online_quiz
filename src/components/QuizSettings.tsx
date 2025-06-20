import React, { useState } from 'react';
import { Settings, Clock, Hash, Save, RotateCcw } from 'lucide-react';
import { AdminUser } from '../types/admin';
import { LoadingSpinner } from './LoadingSpinner';

interface QuizSettingsProps {
  adminUser: AdminUser;
}

interface QuizConfig {
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
}

export const QuizSettings: React.FC<QuizSettingsProps> = ({ adminUser }) => {
  const [config, setConfig] = useState<QuizConfig>({
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
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Save to localStorage for demo
    localStorage.setItem('quiz_config', JSON.stringify(config));
    
    setIsLoading(false);
    setIsSaved(true);
    
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    setConfig({
      timeLimit: 300,
      questionsPerQuiz: 5,
      passingScore: 60,
      allowRetakes: true,
      shuffleQuestions: true,
      shuffleAnswers: false,
      showExplanations: true,
      showScoreImmediately: true,
      maxTabSwitches: 3,
      sessionTimeout: 30,
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Quiz Settings</h2>
        <p className="text-slate-600">Configure quiz parameters and behavior</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Settings */}
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
                  max="3600"
                  value={config.timeLimit}
                  onChange={(e) => setConfig({ ...config, timeLimit: parseInt(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <span className="text-sm text-slate-500 min-w-0">
                  ({formatTime(config.timeLimit)})
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
                max="20"
                value={config.questionsPerQuiz}
                onChange={(e) => setConfig({ ...config, questionsPerQuiz: parseInt(e.target.value) })}
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
                value={config.passingScore}
                onChange={(e) => setConfig({ ...config, passingScore: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-red-600" />
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
                value={config.maxTabSwitches}
                onChange={(e) => setConfig({ ...config, maxTabSwitches: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                User will be logged out after this many tab switches
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={config.sessionTimeout}
                onChange={(e) => setConfig({ ...config, sessionTimeout: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Quiz Behavior */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Hash className="w-5 h-5 mr-2 text-red-600" />
            Quiz Behavior
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.allowRetakes}
                onChange={(e) => setConfig({ ...config, allowRetakes: e.target.checked })}
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Allow quiz retakes</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.shuffleQuestions}
                onChange={(e) => setConfig({ ...config, shuffleQuestions: e.target.checked })}
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Shuffle questions</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.shuffleAnswers}
                onChange={(e) => setConfig({ ...config, shuffleAnswers: e.target.checked })}
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Shuffle answer options</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.showExplanations}
                onChange={(e) => setConfig({ ...config, showExplanations: e.target.checked })}
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Show explanations in results</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.showScoreImmediately}
                onChange={(e) => setConfig({ ...config, showScoreImmediately: e.target.checked })}
                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Show score immediately after completion</span>
            </label>
          </div>
        </div>

        {/* Current Configuration Summary */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Configuration Summary</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Quiz Duration:</span>
              <span className="font-medium">{formatTime(config.timeLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Questions:</span>
              <span className="font-medium">{config.questionsPerQuiz}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Passing Score:</span>
              <span className="font-medium">{config.passingScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Max Tab Switches:</span>
              <span className="font-medium">{config.maxTabSwitches}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Session Timeout:</span>
              <span className="font-medium">{config.sessionTimeout}m</span>
            </div>
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
          disabled={isLoading}
          className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
            isSaved 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          } disabled:bg-slate-300`}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" text="" />
          ) : isSaved ? (
            <>
              <span>✓ Saved</span>
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