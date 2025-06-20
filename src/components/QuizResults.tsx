import React from 'react';
import { Trophy, Clock, Target, BookOpen, RotateCcw, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { QuizResult, Question } from '../types/quiz';

interface QuizResultsProps {
  result: QuizResult;
  questions: Question[];
  onRetakeQuiz: () => void;
  onLogout: () => void;
  formatTime: (seconds: number) => string;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  result,
  questions,
  onRetakeQuiz,
  onLogout,
  formatTime,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="mx-auto w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Trophy className={`w-10 h-10 ${getScoreColor(result.score)}`} />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            Quiz Completed!
          </h1>
          <p className="text-secondary-600">
            Great job, {result.username}! Here are your results.
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(result.score)}`}>
                {result.score}%
              </div>
              <p className="text-secondary-600">Overall Score</p>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mt-2 ${getScoreBadgeColor(result.score)}`}>
                {result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>

            {/* Correct Answers */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {result.correctAnswers}
              </div>
              <p className="text-secondary-600">Correct Answers</p>
              <p className="text-sm text-secondary-500 mt-2">
                out of {result.totalQuestions}
              </p>
            </div>

            {/* Time Spent */}
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary-700 mb-2">
                {formatTime(result.timeSpent)}
              </div>
              <p className="text-secondary-600">Time Spent</p>
              <p className="text-sm text-secondary-500 mt-2">
                out of 5:00
              </p>
            </div>

            {/* Accuracy */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
              </div>
              <p className="text-secondary-600">Accuracy</p>
              <p className="text-sm text-secondary-500 mt-2">
                Questions answered correctly
              </p>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-secondary-900 mb-6 flex items-center">
            <BookOpen className="w-6 h-6 mr-3 text-primary-600" />
            Question Review
          </h2>
          
          <div className="space-y-6">
            {questions.map((question, index) => {
              const userAnswer = result.answers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;
              const wasAnswered = userAnswer !== undefined;

              return (
                <div key={question.id} className="border border-secondary-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-secondary-900 flex-1 mr-4">
                      {index + 1}. {question.question}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? 'Correct' : wasAnswered ? 'Incorrect' : 'Not Answered'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`p-3 rounded-lg border ${
                          optionIndex === question.correctAnswer
                            ? 'bg-green-50 border-green-300 text-green-800'
                            : optionIndex === userAnswer && !isCorrect
                            ? 'bg-red-50 border-red-300 text-red-800'
                            : 'bg-secondary-50 border-secondary-200 text-secondary-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <span>{option}</span>
                          {optionIndex === question.correctAnswer && (
                            <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                          )}
                          {optionIndex === userAnswer && !isCorrect && (
                            <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {question.explanation && (
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                      <h4 className="font-semibold text-primary-800 mb-2">Explanation:</h4>
                      <p className="text-primary-700">{question.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
          <button
            onClick={onRetakeQuiz}
            className="flex items-center justify-center space-x-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors group"
          >
            <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            <span>Retake Quiz</span>
          </button>
          
          <button
            onClick={onLogout}
            className="flex items-center justify-center space-x-2 px-8 py-3 bg-secondary-600 hover:bg-secondary-700 text-white font-semibold rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};