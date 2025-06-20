import React, { useState } from 'react';
import { useSecureAuth } from './hooks/useSecureAuth';
import { useAdminAuth } from './hooks/useAdminAuth';
import { LoginForm } from './components/LoginForm';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { QuizInterface } from './components/QuizInterface';
import { SecurityAlert } from './components/SecurityAlert';
import { LoadingSpinner } from './components/LoadingSpinner';

type AppMode = 'user' | 'admin';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('user');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  // User authentication
  const { 
    user, 
    isLoading: userLoading, 
    login, 
    logout, 
    isAuthenticated,
    tabSwitchCount,
    maxTabSwitches,
    isLocked,
    lockoutInfo,
    resetLock,
    formatLockoutTime
  } = useSecureAuth();

  // Admin authentication
  const {
    adminUser,
    isLoading: adminLoading,
    adminLogin,
    adminLogout,
    isAdminAuthenticated
  } = useAdminAuth();

  const handleUserLogin = async (username: string) => {
    setIsLoggingIn(true);
    try {
      await login(username);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogin = async (username: string, password: string) => {
    setIsAdminLoggingIn(true);
    try {
      await adminLogin(username, password);
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  // Show loading spinner during initial load
  if (userLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  // Show security alert if account is locked
  if (isLocked) {
    return (
      <SecurityAlert
        isLocked={isLocked}
        tabSwitchCount={tabSwitchCount}
        maxTabSwitches={maxTabSwitches}
        onReset={resetLock}
        lockoutInfo={lockoutInfo}
        formatLockoutTime={formatLockoutTime}
      />
    );
  }

  // Admin mode
  if (appMode === 'admin') {
    if (!isAdminAuthenticated || !adminUser) {
      return (
        <div>
          <AdminLogin 
            onLogin={handleAdminLogin} 
            isLoading={isAdminLoggingIn} 
          />
          
          {/* Mode Switch */}
          <div className="fixed bottom-4 left-4">
            <button
              onClick={() => setAppMode('user')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              Switch to User Mode
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <AdminDashboard 
          adminUser={adminUser} 
          onLogout={() => {
            adminLogout();
            setAppMode('user');
          }} 
        />
      </div>
    );
  }

  // User mode
  if (!isAuthenticated || !user) {
    return (
      <div>
        <LoginForm 
          onLogin={handleUserLogin} 
          isLoading={isLoggingIn} 
        />
        
        {/* Mode Switch */}
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => setAppMode('admin')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
          >
            Admin Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <QuizInterface 
        user={user} 
        onLogout={logout}
        tabSwitchCount={tabSwitchCount}
        maxTabSwitches={maxTabSwitches}
      />
      
      {/* Mode Switch */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setAppMode('admin')}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
        >
          Admin Portal
        </button>
      </div>
    </div>
  );
}

export default App;