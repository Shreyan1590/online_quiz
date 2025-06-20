import { useState, useEffect } from 'react';
import { User } from '../types/quiz';

const AUTH_STORAGE_KEY = 'shreyan_quiz_auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedAuth) {
      try {
        const userData = JSON.parse(savedAuth);
        // Check if session is still valid (24 hours)
        if (Date.now() - userData.loginTime < 24 * 60 * 60 * 1000) {
          setUser(userData);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (error) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (username: string): Promise<User> => {
    return new Promise((resolve) => {
      const userData: User = {
        username: username.trim(),
        sessionId: generateSessionId(),
        loginTime: Date.now(),
      };
      
      setUser(userData);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      resolve(userData);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const generateSessionId = (): string => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };
};