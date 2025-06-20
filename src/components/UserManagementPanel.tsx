import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldOff,
  Eye,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { ManagedUser, AdminUser, BlockingRule } from '../types/admin';
import { userManagementService } from '../services/userManagementService';
import { realtimeService } from '../services/realtimeService';
import { LoadingSpinner } from './LoadingSpinner';

interface UserManagementPanelProps {
  adminUser: AdminUser;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ adminUser }) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ManagedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadUsers();
    
    // Setup real-time updates
    const handleUsersUpdate = (updatedUsers: ManagedUser[]) => {
      setUsers(updatedUsers);
    };

    const handleNotification = (notification: any) => {
      if (notification.type && notification.message) {
        showNotification(notification.type, notification.message);
      }
    };

    realtimeService.addEventListener('usersUpdated', handleUsersUpdate);
    realtimeService.addEventListener('systemNotification', handleNotification);

    return () => {
      realtimeService.removeEventListener('usersUpdated', handleUsersUpdate);
      realtimeService.removeEventListener('systemNotification', handleNotification);
    };
  }, []);

  useEffect(() => {
    // Filter users based on search and status
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter]);

  const loadUsers = () => {
    try {
      const loadedUsers = userManagementService.getUsers();
      setUsers(loadedUsers);
    } catch (error) {
      showNotification('error', 'Failed to load users');
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateUser = async (userData: Partial<ManagedUser>) => {
    setIsLoading(true);
    try {
      await userManagementService.createUser(userData, adminUser.username);
      setShowAddForm(false);
      showNotification('success', 'User created successfully');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<ManagedUser>) => {
    setIsLoading(true);
    try {
      await userManagementService.updateUser(userId, updates, adminUser.username);
      setEditingUser(null);
      showNotification('success', 'User updated successfully');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, reason: string) => {
    try {
      userManagementService.blockUser(userId, reason, adminUser.username);
      showNotification('success', 'User blocked successfully');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      userManagementService.unblockUser(userId, adminUser.username);
      showNotification('success', 'User unblocked successfully');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to unblock user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      userManagementService.deleteUser(userId, adminUser.username);
      showNotification('success', 'User deleted successfully');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const exportUsers = () => {
    try {
      const data = JSON.stringify(users, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', 'Users exported successfully');
    } catch (error) {
      showNotification('error', 'Failed to export users');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatLastLogin = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const stats = userManagementService.getUserStats();

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          <p className="text-slate-600">Manage quiz participants with real-time synchronization</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={exportUsers}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Users</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Blocked</p>
              <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
            </div>
            <Shield className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Avg Score</p>
              <p className="text-2xl font-bold text-purple-600">{Math.round(stats.averageScore)}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Attempts</p>
              <p className="text-2xl font-bold text-orange-600">{stats.totalAttempts}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Quiz History
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-slate-500">@{user.username}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                    {user.blockingInfo && (
                      <div className="text-xs text-red-600 mt-1">
                        {user.blockingInfo.reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    <div>
                      <div>{user.quizHistory.length} attempts</div>
                      <div className="text-xs text-slate-500">
                        {user.quizHistory.filter(q => q.status === 'completed').length} completed
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatLastLogin(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-1 hover:bg-slate-100 rounded"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-1 hover:bg-slate-100 rounded"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.status === 'blocked' ? (
                        <button
                          onClick={() => handleUnblockUser(user.id)}
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          title="Unblock user"
                        >
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const reason = prompt('Enter blocking reason:');
                            if (reason) handleBlockUser(user.id, reason);
                          }}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="Block user"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Add/Edit User Modal would go here */}
      {/* User Details Modal would go here */}
    </div>
  );
};