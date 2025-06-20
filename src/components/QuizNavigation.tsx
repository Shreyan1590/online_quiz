import React from 'react';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';

interface QuizNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  hasAnsweredCurrent: boolean;
}

export const QuizNavigation: React.FC<QuizNavigationProps> = ({
  currentQuestion,
  totalQuestions,
  canGoNext,
  canGoPrevious,
  onPrevious,
  onNext,
  onComplete,
  hasAnsweredCurrent,
}) => {
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  return (
    <div className="flex items-center justify-between mt-8">
      {/* Previous Button */}
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="flex items-center space-x-2 px-4 py-2 text-secondary-600 hover:text-secondary-800 disabled:text-secondary-400 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Previous</span>
      </button>

      {/* Question Dots */}
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalQuestions }).map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentQuestion
                ? 'bg-primary-500 scale-125'
                : index < currentQuestion
                ? 'bg-primary-300'
                : 'bg-secondary-300'
            }`}
            title={`Question ${index + 1}`}
          />
        ))}
      </div>

      {/* Next/Complete Button */}
      {isLastQuestion ? (
        <button
          onClick={onComplete}
          className="flex items-center space-x-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors group"
        >
          <Flag className="w-5 h-5" />
          <span>Complete Quiz</span>
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={!canGoNext || !hasAnsweredCurrent}
          className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:text-primary-800 disabled:text-secondary-400 disabled:cursor-not-allowed transition-colors group"
        >
          <span>Next</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
};