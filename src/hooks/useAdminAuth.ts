import { useState, useEffect, useCallback } from 'react';
import { AdminUser } from '../types/admin';

const ADMIN_STORAGE_KEY = 'shreyan_quiz_admin_auth';
const ADMIN_SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

// Mock admin credentials - in production, this would be handled by a secure backend
const ADMIN_CREDENTIALS = {
  'admin': { password: 'admin123', role: 'admin' as const },
  'superadmin': { password: 'super123', role: 'super_admin' as const }
};

export const useAdminAuth = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAdminSession = useCallback(() => {
    setAdminUser(null);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  }, []);

  const checkAdminSessionValidity = useCallback(() => {
    const savedAuth = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (savedAuth) {
      try {
        const userData = JSON.parse(savedAuth);
        const now = Date.now();
        
        // Check if session has expired
        if (now - userData.loginTime > ADMIN_SESSION_TIMEOUT) {
          clearAdminSession();
          return false;
        }
        
        // Update last activity
        userData.lastActivity = now;
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(userData));
        return true;
      } catch (error) {
        clearAdminSession();
        return false;
      }
    }
    return false;
  }, [clearAdminSession]);

  useEffect(() => {
    const savedAuth = localStorage.getItem(ADMIN_STORAGE_KEY);
    
    if (savedAuth && checkAdminSessionValidity()) {
      try {
        const userData = JSON.parse(savedAuth);
        setAdminUser(userData);
      } catch (error) {
        clearAdminSession();
      }
    }
    
    setIsLoading(false);
  }, [checkAdminSessionValidity, clearAdminSession]);

  useEffect(() => {
    // Set up session timeout check
    const sessionCheck = setInterval(() => {
      if (adminUser && !checkAdminSessionValidity()) {
        clearAdminSession();
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(sessionCheck);
    };
  }, [adminUser, checkAdminSessionValidity, clearAdminSession]);

  const adminLogin = async (username: string, password: string): Promise<AdminUser> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const credentials = ADMIN_CREDENTIALS[username as keyof typeof ADMIN_CREDENTIALS];
    
    if (!credentials || credentials.password !== password) {
      throw new Error('Invalid credentials');
    }

    const userData: AdminUser = {
      id: generateId(),
      username: username.trim(),
      email: `${username}@quiz.admin`,
      role: credentials.role,
      sessionId: generateSessionId(),
      loginTime: Date.now(),
      lastActivity: Date.now(),
    };
    
    setAdminUser(userData);
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(userData));
    
    return userData;
  };

  const adminLogout = useCallback(() => {
    clearAdminSession();
  }, [clearAdminSession]);

  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  const generateSessionId = (): string => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  const hasPermission = (requiredRole: 'admin' | 'super_admin'): boolean => {
    if (!adminUser) return false;
    if (requiredRole === 'admin') return true;
    return adminUser.role === 'super_admin';
  };

  return {
    adminUser,
    isLoading,
    adminLogin,
    adminLogout,
    isAdminAuthenticated: !!adminUser,
    hasPermission,
  };
};