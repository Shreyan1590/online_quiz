import React from 'react';
import { Question } from '../types/quiz';
import { CheckCircle, Circle } from 'lucide-react';

interface QuizQuestionProps {
  question: Question;
  selectedAnswer?: number;
  onAnswerSelect: (answerIndex: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  questionNumber,
  totalQuestions,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-slide-up">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            question.difficulty === 'easy' 
              ? 'bg-green-100 text-green-700'
              : question.difficulty === 'medium'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </span>
        </div>
        
        <h2 className="text-xl font-semibold text-secondary-900 leading-relaxed">
          {question.question}
        </h2>
        
        <div className="mt-2 text-sm text-secondary-500">
          Category: {question.category}
        </div>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswerSelect(index)}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 hover:shadow-md group ${
              selectedAnswer === index
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-secondary-200 bg-white hover:border-primary-300 hover:bg-primary-25'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {selectedAnswer === index ? (
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                ) : (
                  <Circle className="w-5 h-5 text-secondary-400 group-hover:text-primary-400 transition-colors" />
                )}
              </div>
              <span className={`text-base ${
                selectedAnswer === index 
                  ? 'text-primary-800 font-medium' 
                  : 'text-secondary-700 group-hover:text-secondary-900'
              }`}>
                {option}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};