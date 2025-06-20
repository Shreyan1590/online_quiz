import React, { useEffect } from 'react';
import { LogOut, Shield } from 'lucide-react';
import { User } from '../types/quiz';
import { useQuiz } from '../hooks/useQuiz';
import { useSecurity } from '../hooks/useSecurity';
import { QuizQuestion } from './QuizQuestion';
import { QuizNavigation } from './QuizNavigation';
import { QuizResults } from './QuizResults';
import { Timer } from './Timer';
import { ProgressBar } from './ProgressBar';
import { SecurityWarning } from './SecurityWarning';
import { SecurityAlert } from './SecurityAlert';
import { LoadingSpinner } from './LoadingSpinner';

interface QuizInterfaceProps {
  user: User;
  onLogout: () => void;
  tabSwitchCount: number;
  maxTabSwitches: number;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({ 
  user, 
  onLogout, 
  tabSwitchCount, 
  maxTabSwitches 
}) => {
  const {
    quizState,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    calculateScore,
    completeQuiz,
    resetQuiz,
    formatTime,
    isQuizActive,
    startTimer,
  } = useQuiz(user.username);

  const { securityState, resetSecurity } = useSecurity();

  // Start timer when quiz begins
  useEffect(() => {
    if (quizState.questions.length > 0 && !quizState.isCompleted && quizState.timeRemaining > 0) {
      startTimer();
    }
  }, [quizState.questions.length, quizState.isCompleted, quizState.timeRemaining, startTimer]);

  const handleRetakeQuiz = () => {
    resetQuiz();
    resetSecurity();
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
    answerQuestion(currentQuestion.id, answerIndex);
  };

  const handleNext = () => {
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
      nextQuestion();
    }
  };

  const handlePrevious = () => {
    if (quizState.currentQuestionIndex > 0) {
      previousQuestion();
    }
  };

  const handleComplete = () => {
    completeQuiz();
  };

  // Show loading if questions aren't loaded yet
  if (quizState.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading quiz questions..." />
      </div>
    );
  }

  // Show results if quiz is completed
  if (quizState.isCompleted) {
    const result = calculateScore();
    return (
      <QuizResults
        result={result}
        questions={quizState.questions}
        onRetakeQuiz={handleRetakeQuiz}
        onLogout={onLogout}
        formatTime={formatTime}
      />
    );
  }

  const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
  const selectedAnswer = quizState.answers[currentQuestion.id];
  const hasAnsweredCurrent = selectedAnswer !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Shreyan's Quiz</h1>
              <p className="text-secondary-600">Welcome, {user.username}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Timer 
                timeRemaining={quizState.timeRemaining}
                formatTime={formatTime}
              />
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 text-secondary-600 hover:text-secondary-800 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 animate-fade-in">
          <ProgressBar
            current={quizState.currentQuestionIndex + 1}
            total={quizState.questions.length}
          />
        </div>

        {/* Security Alert */}
        <SecurityAlert
          isLocked={false}
          tabSwitchCount={tabSwitchCount}
          maxTabSwitches={maxTabSwitches}
          onReset={() => {}}
        />

        {/* Security Warning */}
        <SecurityWarning securityState={securityState} />

        {/* Quiz Question */}
        <div className="mb-6">
          <QuizQuestion
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            onAnswerSelect={handleAnswerSelect}
            questionNumber={quizState.currentQuestionIndex + 1}
            totalQuestions={quizState.questions.length}
          />
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
          <QuizNavigation
            currentQuestion={quizState.currentQuestionIndex}
            totalQuestions={quizState.questions.length}
            canGoNext={quizState.currentQuestionIndex < quizState.questions.length - 1}
            canGoPrevious={quizState.currentQuestionIndex > 0}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onComplete={handleComplete}
            hasAnsweredCurrent={hasAnsweredCurrent}
          />
        </div>

        {/* Security Status */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-secondary-500">
            <Shield className="w-4 h-4" />
            <span>Quiz is being monitored for security</span>
          </div>
        </div>
      </div>
    </div>
  );
};