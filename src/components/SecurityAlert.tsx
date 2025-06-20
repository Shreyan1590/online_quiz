import React, { useEffect, useState } from 'react';
import { AlertTriangle, Shield, RefreshCw, Clock, Lock } from 'lucide-react';

interface SecurityAlertProps {
  isLocked: boolean;
  tabSwitchCount: number;
  maxTabSwitches: number;
  onReset: () => void;
  lockoutInfo?: {
    remainingTime: number;
    reason: string;
  } | null;
  formatLockoutTime?: string;
}

export const SecurityAlert: React.FC<SecurityAlertProps> = ({
  isLocked,
  tabSwitchCount,
  maxTabSwitches,
  onReset,
  lockoutInfo,
  formatLockoutTime,
}) => {
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (lockoutInfo && lockoutInfo.remainingTime > 0) {
      const interval = setInterval(() => {
        const totalSeconds = Math.floor(lockoutInfo.remainingTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setCountdown(`${minutes}m ${seconds}s`);
        } else {
          setCountdown(`${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lockoutInfo]);

  if (isLocked && lockoutInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center animate-slide-up">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-red-900 mb-4">
              Account Locked
            </h1>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-semibold mb-1">Security Policy Violation</p>
                  <p className="mb-2">{lockoutInfo.reason}</p>
                  <p>Your account has been temporarily locked for security reasons.</p>
                </div>
              </div>
            </div>

            {lockoutInfo.remainingTime > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-orange-800">Lockout Expires In:</span>
                </div>
                <div className="text-2xl font-mono font-bold text-orange-900">
                  {formatLockoutTime || countdown}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="text-sm text-slate-600">
                <p className="mb-2">
                  <strong>What happened?</strong>
                </p>
                <ul className="text-left space-y-1">
                  <li>• Tab switching was detected during the quiz</li>
                  <li>• Maximum allowed switches: {maxTabSwitches}</li>
                  <li>• Your switches: {tabSwitchCount}</li>
                  <li>• Lockout duration: 3 hours</li>
                </ul>
              </div>

              <div className="text-sm text-slate-600">
                <p className="mb-2">
                  <strong>What can you do?</strong>
                </p>
                <ul className="text-left space-y-1">
                  <li>• Wait for the lockout period to expire</li>
                  <li>• Ensure you stay focused on the quiz tab</li>
                  <li>• Contact support if you believe this is an error</li>
                </ul>
              </div>
            </div>

            {lockoutInfo.remainingTime <= 0 && (
              <button
                onClick={onReset}
                className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors mt-6"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Try Again</span>
              </button>
            )}
            
            <p className="text-xs text-red-600 mt-4">
              This security measure helps maintain quiz integrity and prevents cheating.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Warning when approaching limit
  if (tabSwitchCount > 0) {
    const remaining = maxTabSwitches - tabSwitchCount;
    
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 animate-slide-up">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-orange-800">Security Warning</h3>
            <p className="text-sm text-orange-700 mt-1">
              You have switched tabs {tabSwitchCount} time{tabSwitchCount !== 1 ? 's' : ''}. 
              {remaining > 0 ? (
                <> You have {remaining} warning{remaining !== 1 ? 's' : ''} remaining before your account is locked for 3 hours.</>
              ) : (
                <> Your account will be locked on the next tab switch.</>
              )}
            </p>
            <div className="mt-2 text-xs text-orange-600">
              <p>• Stay focused on this tab to avoid lockout</p>
              <p>• Lockout duration: 3 hours from violation time</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};