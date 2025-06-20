import { useState, useEffect, useCallback } from 'react';
import { SecurityState } from '../types/quiz';

export const useSecurity = () => {
  const [securityState, setSecurityState] = useState<SecurityState>({
    tabSwitchCount: 0,
    focusLostCount: 0,
    warnings: [],
    isWindowFocused: true,
  });

  const addWarning = useCallback((warning: string) => {
    setSecurityState(prev => ({
      ...prev,
      warnings: [...prev.warnings, `${new Date().toLocaleTimeString()}: ${warning}`],
    }));
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setSecurityState(prev => ({
        ...prev,
        tabSwitchCount: prev.tabSwitchCount + 1,
      }));
      addWarning('Tab switched or window minimized');
    }
  }, [addWarning]);

  const handleWindowFocus = useCallback(() => {
    setSecurityState(prev => ({
      ...prev,
      isWindowFocused: true,
    }));
  }, []);

  const handleWindowBlur = useCallback(() => {
    setSecurityState(prev => ({
      ...prev,
      isWindowFocused: false,
      focusLostCount: prev.focusLostCount + 1,
    }));
    addWarning('Window lost focus');
  }, [addWarning]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S
    if (
      event.key === 'F12' ||
      (event.ctrlKey && event.shiftKey && event.key === 'I') ||
      (event.ctrlKey && event.key === 'u') ||
      (event.ctrlKey && event.key === 's')
    ) {
      event.preventDefault();
      addWarning('Attempted to use developer tools or save page');
    }
  }, [addWarning]);

  const handleRightClick = useCallback((event: MouseEvent) => {
    event.preventDefault();
    addWarning('Right-click attempted');
  }, [addWarning]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleRightClick);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleRightClick);
    };
  }, [handleVisibilityChange, handleWindowFocus, handleWindowBlur, handleKeyDown, handleRightClick]);

  const resetSecurity = useCallback(() => {
    setSecurityState({
      tabSwitchCount: 0,
      focusLostCount: 0,
      warnings: [],
      isWindowFocused: true,
    });
  }, []);

  return {
    securityState,
    resetSecurity,
  };
};