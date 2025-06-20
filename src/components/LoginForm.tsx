import React, { useState } from 'react';
import { User, BookOpen, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoginFormProps {
  onLogin: (username: string) => Promise<void>;
  isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters long');
      return;
    }

    try {
      await onLogin(username.trim());
    } catch (err) {
      setError('Failed to login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">
              Shreyan's Quiz
            </h1>
            <p className="text-secondary-600">
              Enter your username to begin the interactive quiz
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-secondary-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Enter your username"
                  disabled={isLoading}
                  autoComplete="username"
                  maxLength={50}
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600 animate-fade-in">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 group"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" text="" />
              ) : (
                <>
                  <span>Start Quiz</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-secondary-200">
            <h3 className="text-sm font-semibold text-secondary-800 mb-3">Quiz Features:</h3>
            <ul className="space-y-2 text-sm text-secondary-600">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                <span>5-minute timed quiz</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                <span>Multiple choice questions</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                <span>Real-time progress tracking</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                <span>Detailed results and explanations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};