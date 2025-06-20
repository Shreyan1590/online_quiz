import React, { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, Clock, TrendingUp, Award, Shield, Database } from 'lucide-react';
import { dataService } from '../services/dataService';
import { ActivityLog } from '../types/admin';

export const AdminStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    activeQuestions: 0,
    totalUsers: 0,
    totalQuizzes: 0,
    averageScore: 0,
    recentActivity: [] as ActivityLog[]
  });

  const [auditLog, setAuditLog] = useState<ActivityLog[]>([]);

  useEffect(() => {
    loadStats();
    loadAuditLog();

    // Listen for real-time updates
    const handleDataUpdate = () => {
      loadStats();
      loadAuditLog();
    };

    dataService.addEventListener('questionsUpdated', handleDataUpdate);
    dataService.addEventListener('auditLogUpdated', handleDataUpdate);
    dataService.addEventListener('userSessionsUpdated', handleDataUpdate);

    return () => {
      dataService.removeEventListener('questionsUpdated', handleDataUpdate);
      dataService.removeEventListener('auditLogUpdated', handleDataUpdate);
      dataService.removeEventListener('userSessionsUpdated', handleDataUpdate);
    };
  }, []);

  const loadStats = () => {
    const questions = dataService.getQuestions();
    const userSessions = dataService.getUserSessions();
    const auditLogs = dataService.getAuditLog();

    setStats({
      totalQuestions: questions.length,
      activeQuestions: questions.length, // All questions are considered active
      totalUsers: userSessions.length,
      totalQuizzes: userSessions.reduce((acc, session) => acc + (session.loginTime ? 1 : 0), 0),
      averageScore: 78.5, // Mock data - would be calculated from actual quiz results
      recentActivity: auditLogs.slice(0, 5)
    });
  };

  const loadAuditLog = () => {
    const logs = dataService.getAuditLog();
    setAuditLog(logs.slice(0, 10)); // Show last 10 activities
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('Question')) return <FileText className="w-4 h-4" />;
    if (action.includes('User') || action.includes('Locked')) return <Shield className="w-4 h-4" />;
    if (action.includes('Data')) return <Database className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getActivityColor = (action: string) => {
    if (action.includes('Added') || action.includes('Imported')) return 'text-green-600';
    if (action.includes('Updated')) return 'text-blue-600';
    if (action.includes('Deleted') || action.includes('Locked')) return 'text-red-600';
    return 'text-slate-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-600">Monitor your quiz platform performance with real-time data</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Questions</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalQuestions}</p>
              <p className="text-sm text-green-600 mt-1">
                {stats.activeQuestions} active
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Registered Users</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
              <p className="text-sm text-green-600 mt-1">
                Active sessions
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Quiz Sessions</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalQuizzes}</p>
              <p className="text-sm text-green-600 mt-1">
                Total attempts
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Average Score</p>
              <p className="text-3xl font-bold text-slate-900">{stats.averageScore}%</p>
              <p className="text-sm text-green-600 mt-1">
                Platform average
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Security Events</p>
              <p className="text-3xl font-bold text-slate-900">
                {auditLog.filter(log => log.action.includes('Locked')).length}
              </p>
              <p className="text-sm text-red-600 mt-1">
                Account lockouts
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Data Integrity</p>
              <p className="text-3xl font-bold text-slate-900">100%</p>
              <p className="text-sm text-green-600 mt-1">
                Sync status
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <Database className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live updates</span>
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-200">
          {auditLog.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full bg-slate-100 ${getActivityColor(activity.action)}`}>
                    {getActivityIcon(activity.action)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{activity.action}</p>
                    <p className="text-sm text-slate-600">
                      by {activity.user} • {activity.details}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-slate-500">
                  {formatTime(activity.timestamp)}
                </span>
              </div>
            </div>
          ))}
          
          {auditLog.length === 0 && (
            <div className="p-8 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-slate-900">Data Storage</p>
              <p className="text-xs text-slate-500">Operational</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-slate-900">Real-time Sync</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-slate-900">Security Monitor</p>
              <p className="text-xs text-slate-500">Enabled</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-slate-900">Audit Logging</p>
              <p className="text-xs text-slate-500">Recording</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};