import { useState, useEffect, useCallback } from 'react';
import { User } from '../types/quiz';
import { dataService } from '../services/dataService';

const AUTH_STORAGE_KEY = 'shreyan_quiz_auth';
const TAB_SWITCH_KEY = 'shreyan_quiz_tab_switches';
const MAX_TAB_SWITCHES = 3;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const useSecureAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{
    remainingTime: number;
    reason: string;
  } | null>(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setTabSwitchCount(0);
    setIsLocked(false);
    setLockoutInfo(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(TAB_SWITCH_KEY);
    localStorage.removeItem('shreyan_quiz_state');
  }, []);

  const lockAccount = useCallback((reason: string) => {
    if (user) {
      dataService.createLockout(user.username, reason);
      const lockoutStatus = dataService.isUserLocked(user.username);
      
      if (lockoutStatus.isLocked) {
        setIsLocked(true);
        setLockoutInfo({
          remainingTime: lockoutStatus.remainingTime || 0,
          reason: lockoutStatus.reason || reason,
        });
      }
    }
    clearSession();
    console.warn('Account locked:', reason);
  }, [user, clearSession]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && user && !isLocked) {
      const currentCount = parseInt(sessionStorage.getItem(TAB_SWITCH_KEY) || '0') + 1;
      setTabSwitchCount(currentCount);
      sessionStorage.setItem(TAB_SWITCH_KEY, currentCount.toString());
      
      // Update user session with tab switch
      dataService.updateUserSession(user.username, {
        lastActivity: Date.now(),
      });
      
      if (currentCount >= MAX_TAB_SWITCHES) {
        lockAccount('Excessive tab switching detected');
      }
    }
  }, [user, isLocked, lockAccount]);

  const checkSessionValidity = useCallback(() => {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedAuth) {
      try {
        const userData = JSON.parse(savedAuth);
        const now = Date.now();
        
        // Check if session has expired
        if (now - userData.loginTime > SESSION_TIMEOUT) {
          clearSession();
          return false;
        }
        
        // Check if user is locked
        const lockoutStatus = dataService.isUserLocked(userData.username);
        if (lockoutStatus.isLocked) {
          setIsLocked(true);
          setLockoutInfo({
            remainingTime: lockoutStatus.remainingTime || 0,
            reason: lockoutStatus.reason || 'Account locked',
          });
          clearSession();
          return false;
        }
        
        // Update last activity
        userData.lastActivity = now;
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        dataService.updateUserSession(userData.username, {
          lastActivity: now,
        });
        
        return true;
      } catch (error) {
        clearSession();
        return false;
      }
    }
    return false;
  }, [clearSession]);

  const checkLockoutStatus = useCallback(() => {
    if (lockoutInfo && lockoutInfo.remainingTime > 0) {
      const newRemainingTime = lockoutInfo.remainingTime - 1000;
      
      if (newRemainingTime <= 0) {
        setIsLocked(false);
        setLockoutInfo(null);
      } else {
        setLockoutInfo(prev => prev ? { ...prev, remainingTime: newRemainingTime } : null);
      }
    }
  }, [lockoutInfo]);

  useEffect(() => {
    // Load saved authentication state
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    const savedTabSwitches = parseInt(sessionStorage.getItem(TAB_SWITCH_KEY) || '0');
    
    setTabSwitchCount(savedTabSwitches);
    
    if (savedTabSwitches >= MAX_TAB_SWITCHES) {
      lockAccount('Previous session exceeded tab switch limit');
      setIsLoading(false);
      return;
    }

    if (savedAuth && checkSessionValidity()) {
      try {
        const userData = JSON.parse(savedAuth);
        
        // Check lockout status
        const lockoutStatus = dataService.isUserLocked(userData.username);
        if (lockoutStatus.isLocked) {
          setIsLocked(true);
          setLockoutInfo({
            remainingTime: lockoutStatus.remainingTime || 0,
            reason: lockoutStatus.reason || 'Account locked',
          });
        } else {
          setUser(userData);
        }
      } catch (error) {
        clearSession();
      }
    }
    
    setIsLoading(false);
  }, [checkSessionValidity, clearSession, lockAccount]);

  useEffect(() => {
    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up session timeout check
    const sessionCheck = setInterval(() => {
      if (user && !checkSessionValidity()) {
        clearSession();
      }
    }, 60000); // Check every minute

    // Set up lockout countdown
    const lockoutCheck = setInterval(checkLockoutStatus, 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionCheck);
      clearInterval(lockoutCheck);
    };
  }, [user, handleVisibilityChange, checkSessionValidity, clearSession, checkLockoutStatus]);

  const login = async (username: string): Promise<User> => {
    // Check if user is locked
    const lockoutStatus = dataService.isUserLocked(username);
    if (lockoutStatus.isLocked) {
      setIsLocked(true);
      setLockoutInfo({
        remainingTime: lockoutStatus.remainingTime || 0,
        reason: lockoutStatus.reason || 'Account locked',
      });
      throw new Error(`Account is locked. Reason: ${lockoutStatus.reason}. Please try again later.`);
    }

    const userData: User = {
      username: username.trim(),
      sessionId: generateSessionId(),
      loginTime: Date.now(),
    };
    
    setUser(userData);
    setTabSwitchCount(0);
    setIsLocked(false);
    setLockoutInfo(null);
    
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    sessionStorage.setItem(TAB_SWITCH_KEY, '0');
    
    // Create user session in data service
    dataService.createUserSession(username);
    
    return userData;
  };

  const logout = useCallback(() => {
    if (user) {
      dataService.updateUserSession(user.username, {
        lastActivity: Date.now(),
      });
    }
    clearSession();
  }, [user, clearSession]);

  const generateSessionId = (): string => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  const resetLock = () => {
    setIsLocked(false);
    setLockoutInfo(null);
    setTabSwitchCount(0);
    sessionStorage.removeItem(TAB_SWITCH_KEY);
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user && !isLocked,
    tabSwitchCount,
    maxTabSwitches: MAX_TAB_SWITCHES,
    isLocked,
    lockoutInfo,
    resetLock,
    remainingSwitches: Math.max(0, MAX_TAB_SWITCHES - tabSwitchCount),
    formatLockoutTime: lockoutInfo ? formatTime(lockoutInfo.remainingTime) : '',
  };
};