import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimerProps {
  timeRemaining: number;
  formatTime: (seconds: number) => string;
  isLowTime?: boolean;
}

export const Timer: React.FC<TimerProps> = ({ timeRemaining, formatTime, isLowTime }) => {
  const isVeryLowTime = timeRemaining <= 60;
  const isLowTimeWarning = timeRemaining <= 120;

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
      isVeryLowTime 
        ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' 
        : isLowTimeWarning
        ? 'bg-orange-50 border-orange-200 text-orange-700'
        : 'bg-primary-50 border-primary-200 text-primary-700'
    }`}>
      {isVeryLowTime ? (
        <AlertTriangle className="w-5 h-5 animate-bounce" />
      ) : (
        <Clock className="w-5 h-5" />
      )}
      <span className="font-mono text-lg font-semibold">
        {formatTime(timeRemaining)}
      </span>
    </div>
  );
};