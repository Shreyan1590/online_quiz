import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Database,
  Shield
} from 'lucide-react';
import { AdminUser } from '../types/admin';
import { QuestionManager } from './QuestionManager';
import { AdminStats } from './AdminStats';
import { UserManagementPanel } from './UserManagementPanel';
import { RealTimeQuizSettings } from './RealTimeQuizSettings';
import { SystemBackupManager } from './SystemBackupManager';

interface AdminDashboardProps {
  adminUser: AdminUser;
  onLogout: () => void;
}

type ActiveTab = 'dashboard' | 'questions' | 'users' | 'settings' | 'backup';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'questions' as const, label: 'Questions', icon: FileText },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
    { id: 'backup' as const, label: 'Backup', icon: Database },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminStats />;
      case 'questions':
        return <QuestionManager adminUser={adminUser} />;
      case 'users':
        return <UserManagementPanel adminUser={adminUser} />;
      case 'settings':
        return <RealTimeQuizSettings adminUser={adminUser} />;
      case 'backup':
        return <SystemBackupManager adminUser={adminUser} />;
      default:
        return <AdminStats />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-red-600" />
                <h1 className="text-xl font-bold text-slate-900">Quiz Admin Portal</h1>
              </div>
              <div className="hidden sm:block">
                <span className="text-sm text-slate-500">
                  Welcome, {adminUser.username}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <div className={`w-2 h-2 rounded-full ${
                  adminUser.role === 'super_admin' ? 'bg-purple-500' : 'bg-blue-500'
                }`} />
                <span className="capitalize">{adminUser.role.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Real-time sync active</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              
              {/* System Status */}
              <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-semibold text-green-800 mb-2">System Status</h4>
                <div className="space-y-1 text-xs text-green-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Real-time sync: Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Data integrity: OK</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Security monitoring: Active</span>
                  </div>
                </div>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};