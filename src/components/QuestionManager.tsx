import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Upload, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  History,
  Database
} from 'lucide-react';
import { Question } from '../types/quiz';
import { AdminUser, QuestionFormData, BulkUploadResult } from '../types/admin';
import { dataService } from '../services/dataService';
import { QuestionForm } from './QuestionForm';
import { BulkUpload } from './BulkUpload';
import { LoadingSpinner } from './LoadingSpinner';

interface QuestionManagerProps {
  adminUser: AdminUser;
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({ adminUser }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    // Load questions from data service
    loadQuestions();
    
    // Listen for real-time updates
    const handleQuestionsUpdate = (updatedQuestions: Question[]) => {
      setQuestions(updatedQuestions);
    };
    
    dataService.addEventListener('questionsUpdated', handleQuestionsUpdate);
    
    return () => {
      dataService.removeEventListener('questionsUpdated', handleQuestionsUpdate);
    };
  }, []);

  useEffect(() => {
    // Filter questions based on search and filters
    let filtered = questions;

    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }

    setFilteredQuestions(filtered);
  }, [questions, searchTerm, selectedCategory, selectedDifficulty]);

  const loadQuestions = () => {
    try {
      const loadedQuestions = dataService.getQuestions();
      setQuestions(loadedQuestions);
    } catch (error) {
      showNotification('error', 'Failed to load questions');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddQuestion = async (questionData: QuestionFormData) => {
    setIsLoading(true);
    try {
      const validation = dataService.validateQuestionData(questionData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      await dataService.addQuestion(questionData, adminUser);
      setShowForm(false);
      showNotification('success', 'Question added successfully');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to add question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditQuestion = async (questionData: QuestionFormData) => {
    if (!editingQuestion) return;
    
    setIsLoading(true);
    try {
      const validation = dataService.validateQuestionData(questionData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      await dataService.updateQuestion(editingQuestion.id, questionData, adminUser);
      setEditingQuestion(null);
      showNotification('success', 'Question updated successfully');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to update question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      await dataService.deleteQuestion(questionId, adminUser);
      showNotification('success', 'Question deleted successfully');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to delete question');
    }
  };

  const handleBulkUpload = async (result: BulkUploadResult) => {
    setIsLoading(true);
    try {
      if (result.questions.length === 0) {
        throw new Error('No valid questions to import');
      }

      await dataService.bulkAddQuestions(result.questions, adminUser);
      setShowBulkUpload(false);
      showNotification('success', `Successfully imported ${result.questions.length} questions`);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to import questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    try {
      const exportData = dataService.exportData();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-data-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', 'Data exported successfully');
    } catch (error) {
      showNotification('error', 'Failed to export data');
    }
  };

  const categories = Array.from(new Set(questions.map(q => q.category)));
  const difficulties = ['easy', 'medium', 'hard'] as const;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showForm || editingQuestion) {
    return (
      <QuestionForm
        question={editingQuestion}
        onSubmit={editingQuestion ? handleEditQuestion : handleAddQuestion}
        onCancel={() => {
          setShowForm(false);
          setEditingQuestion(null);
        }}
        isLoading={isLoading}
      />
    );
  }

  if (showBulkUpload) {
    return (
      <BulkUpload
        onUpload={handleBulkUpload}
        onCancel={() => setShowBulkUpload(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg border animate-slide-up ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Question Management</h2>
          <p className="text-slate-600">Manage quiz questions with persistent storage and real-time sync</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Database className="w-4 h-4" />
            <span>Export Data</span>
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Upload</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Questions</p>
              <p className="text-2xl font-bold text-slate-900">{questions.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Categories</p>
              <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
            </div>
            <Filter className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Easy Questions</p>
              <p className="text-2xl font-bold text-slate-900">
                {questions.filter(q => q.difficulty === 'easy').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Hard Questions</p>
              <p className="text-2xl font-bold text-slate-900">
                {questions.filter(q => q.difficulty === 'hard').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Difficulties</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Questions ({filteredQuestions.length})
            </h3>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <History className="w-4 h-4" />
              <span>Real-time sync enabled</span>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-slate-200">
          {filteredQuestions.map((question) => (
            <div key={question.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                      {question.category}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-medium text-slate-900 mb-2 line-clamp-2">
                    {question.question}
                  </h4>
                  
                  <div className="text-xs text-slate-500">
                    {question.options.length} options • Correct: {question.options[question.correctAnswer]}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setEditingQuestion(question)}
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Edit question"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredQuestions.length === 0 && (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No questions found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};