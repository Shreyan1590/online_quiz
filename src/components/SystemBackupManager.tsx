import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Clock, 
  Shield, 
  AlertCircle,
  CheckCircle,
  FileText,
  HardDrive
} from 'lucide-react';
import { AdminUser, SystemBackup } from '../types/admin';
import { dataService } from '../services/dataService';
import { LoadingSpinner } from './LoadingSpinner';

interface SystemBackupManagerProps {
  adminUser: AdminUser;
}

export const SystemBackupManager: React.FC<SystemBackupManagerProps> = ({ adminUser }) => {
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = () => {
    try {
      const savedBackups = localStorage.getItem('system_backups');
      if (savedBackups) {
        setBackups(JSON.parse(savedBackups));
      }
    } catch (error) {
      showNotification('error', 'Failed to load backup history');
    }
  };

  const saveBackups = (backupList: SystemBackup[]) => {
    try {
      localStorage.setItem('system_backups', JSON.stringify(backupList));
      setBackups(backupList);
    } catch (error) {
      showNotification('error', 'Failed to save backup history');
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const createBackup = async (type: 'manual' | 'automatic' = 'manual') => {
    setIsCreatingBackup(true);
    try {
      // Get all system data
      const questions = dataService.getQuestions();
      const auditLog = dataService.getAuditLog();
      const userSessions = dataService.getUserSessions();
      const lockoutData = dataService.getLockoutData();

      const backupData = {
        questions,
        auditLog,
        userSessions,
        lockoutData,
        settings: JSON.parse(localStorage.getItem('quiz_settings') || '{}'),
        managedUsers: JSON.parse(localStorage.getItem('quiz_managed_users') || '[]'),
        timestamp: Date.now(),
        version: '1.0'
      };

      const backup: SystemBackup = {
        id: generateId(),
        createdAt: Date.now(),
        createdBy: adminUser.username,
        type,
        size: JSON.stringify(backupData).length,
        data: backupData
      };

      const updatedBackups = [backup, ...backups].slice(0, 10); // Keep only last 10 backups
      saveBackups(updatedBackups);

      // Also create downloadable backup
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-system-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log the backup creation
      dataService.logActivity({
        id: generateId(),
        action: 'System Backup Created',
        user: adminUser.username,
        timestamp: Date.now(),
        details: `${type} backup created with ${formatFileSize(backup.size)} of data`
      });

      showNotification('success', `${type} backup created successfully`);
    } catch (error) {
      showNotification('error', 'Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreFromBackup = async (backup: SystemBackup) => {
    if (!confirm('Are you sure you want to restore from this backup? This will overwrite all current data.')) {
      return;
    }

    setIsRestoring(true);
    try {
      const { data } = backup;

      // Restore all data
      if (data.questions) {
        dataService.saveQuestions(data.questions);
      }
      if (data.auditLog) {
        dataService.saveAuditLog(data.auditLog);
      }
      if (data.userSessions) {
        dataService.saveUserSessions(data.userSessions);
      }
      if (data.lockoutData) {
        dataService.saveLockoutData(data.lockoutData);
      }
      if (data.settings) {
        localStorage.setItem('quiz_settings', JSON.stringify(data.settings));
      }
      if (data.managedUsers) {
        localStorage.setItem('quiz_managed_users', JSON.stringify(data.managedUsers));
      }

      // Log the restoration
      dataService.logActivity({
        id: generateId(),
        action: 'System Restored from Backup',
        user: adminUser.username,
        timestamp: Date.now(),
        details: `System restored from backup created on ${new Date(backup.createdAt).toLocaleString()}`
      });

      showNotification('success', 'System restored from backup successfully');
      
      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      showNotification('error', 'Failed to restore from backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const deleteBackup = (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return;
    }

    const updatedBackups = backups.filter(b => b.id !== backupId);
    saveBackups(updatedBackups);
    showNotification('success', 'Backup deleted successfully');
  };

  const importBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const backupData = JSON.parse(text);

        // Validate backup data structure
        if (!backupData.questions || !Array.isArray(backupData.questions)) {
          throw new Error('Invalid backup format');
        }

        const backup: SystemBackup = {
          id: generateId(),
          createdAt: Date.now(),
          createdBy: adminUser.username,
          type: 'manual',
          size: text.length,
          data: backupData
        };

        const updatedBackups = [backup, ...backups].slice(0, 10);
        saveBackups(updatedBackups);

        showNotification('success', 'Backup imported successfully');
      } catch (error) {
        showNotification('error', 'Failed to import backup: Invalid file format');
      }
    };
    input.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  };

  const getSystemStats = () => {
    const questions = dataService.getQuestions();
    const auditLog = dataService.getAuditLog();
    const userSessions = dataService.getUserSessions();
    
    return {
      questions: questions.length,
      auditEntries: auditLog.length,
      userSessions: userSessions.length,
      totalSize: formatFileSize(
        JSON.stringify({ questions, auditLog, userSessions }).length
      )
    };
  };

  const stats = getSystemStats();

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg border animate-slide-up ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : notification.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Backup & Recovery</h2>
          <p className="text-slate-600">Manage system backups and data recovery</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={importBackup}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import Backup</span>
          </button>
          <button
            onClick={() => createBackup('manual')}
            disabled={isCreatingBackup}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
          >
            {isCreatingBackup ? (
              <LoadingSpinner size="sm" text="" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            <span>Create Backup</span>
          </button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Questions</p>
              <p className="text-2xl font-bold text-slate-900">{stats.questions}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Audit Entries</p>
              <p className="text-2xl font-bold text-slate-900">{stats.auditEntries}</p>
            </div>
            <Shield className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">User Sessions</p>
              <p className="text-2xl font-bold text-slate-900">{stats.userSessions}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Data Size</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalSize}</p>
            </div>
            <HardDrive className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Backup History</h3>
          <p className="text-sm text-slate-600">Recent system backups and restore points</p>
        </div>
        
        <div className="divide-y divide-slate-200">
          {backups.map((backup) => (
            <div key={backup.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Database className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {backup.type === 'manual' ? 'Manual Backup' : 'Automatic Backup'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      backup.type === 'manual' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {backup.type}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>Created: {formatDate(backup.createdAt)} by {backup.createdBy}</p>
                    <p>Size: {formatFileSize(backup.size)}</p>
                    <p>
                      Contains: {backup.data.questions?.length || 0} questions, 
                      {backup.data.auditLog?.length || 0} audit entries
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => restoreFromBackup(backup)}
                    disabled={isRestoring}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    {isRestoring ? (
                      <LoadingSpinner size="sm" text="" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>Restore</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `backup-${backup.id}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  
                  <button
                    onClick={() => deleteBackup(backup.id)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {backups.length === 0 && (
            <div className="p-8 text-center">
              <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No backups found</p>
              <p className="text-sm text-slate-400 mt-1">Create your first backup to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};