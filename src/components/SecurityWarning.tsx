import React from 'react';
import { Shield, AlertTriangle, X } from 'lucide-react';
import { SecurityState } from '../types/quiz';

interface SecurityWarningProps {
  securityState: SecurityState;
  onDismiss?: () => void;
}

export const SecurityWarning: React.FC<SecurityWarningProps> = ({ 
  securityState, 
  onDismiss 
}) => {
  const hasViolations = securityState.tabSwitchCount > 0 || securityState.focusLostCount > 0;

  if (!hasViolations) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-orange-800">Security Notice</h3>
            <div className="mt-1 text-sm text-orange-700">
              <p>Tab switches: {securityState.tabSwitchCount}</p>
              <p>Focus lost: {securityState.focusLostCount}</p>
              {!securityState.isWindowFocused && (
                <p className="font-medium">⚠️ Please focus on the quiz window</p>
              )}
            </div>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-orange-400 hover:text-orange-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};