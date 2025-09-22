import React, { useState, useEffect } from 'react';
import { getDashboardStats, createUser, exportData, getSystemSettings, updateSystemSettings, getRecentActivity } from '../services/api';
import './DashboardPage.css';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalContacts: 0,
    verifiedUsers: 0,
    recentUsers: 0,
    recentContacts: 0,
    verificationRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [systemSettings, setSystemSettings] = useState({});
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsData, activityData] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(5)
      ]);
      
      const statsInfo = statsData.stats || statsData.data || {
        totalUsers: 0,
        totalContacts: 0,
        verifiedUsers: 0,
        recentUsers: 0,
        recentContacts: 0,
        verificationRate: 0
      };
      
      setStats(statsInfo);
      setRecentActivity(activityData.data || []);
      setError('');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data.');
      setStats({
        totalUsers: 0,
        totalContacts: 0,
        verifiedUsers: 0,
        recentUsers: 0,
        recentContacts: 0,
        verificationRate: 0
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(newUser);
      setShowUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      loadDashboardData(); // Refresh data
      alert('User created successfully!');
    } catch (error) {
      alert(`Error creating user: ${error.message}`);
    }
  };

  const handleExportData = async (type) => {
    try {
      await exportData(type);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully!`);
    } catch (error) {
      alert(`Error exporting data: ${error.message}`);
    }
  };

  const handleSystemSettings = async () => {
    try {
      const settingsData = await getSystemSettings();
      setSystemSettings(settingsData.data || {});
      setShowSettingsModal(true);
    } catch (error) {
      alert(`Error loading settings: ${error.message}`);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await updateSystemSettings(systemSettings);
      setShowSettingsModal(false);
      alert('Settings updated successfully!');
    } catch (error) {
      alert(`Error updating settings: ${error.message}`);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const StatCard = ({ icon, title, value, change, changeType, color, description }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-header">
        <div className="stat-icon">
          <i className={icon}></i>
        </div>
        <div className="stat-actions">
          <button className="stat-menu-btn">
            <i className="fas fa-ellipsis-h"></i>
          </button>
        </div>
      </div>
      <div className="stat-content">
        <div className="stat-value">{typeof value === 'string' ? value : value.toLocaleString()}</div>
        <div className="stat-title">{title}</div>
        <div className="stat-description">{description}</div>
        {change !== undefined && (
          <div className={`stat-change ${changeType}`}>
            <i className={`fas fa-arrow-${changeType === 'positive' ? 'up' : 'down'}`}></i>
            <span>{Math.abs(change)} this week</span>
          </div>
        )}
      </div>
      <div className="stat-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.min(100, (typeof value === 'number' ? value : parseInt(value)) / 100 * 100)}%` }}></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            <h3>Loading Dashboard</h3>
            <p>Fetching your latest data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="dashboard-title">
              <span className="title-gradient">Welcome back! Here's what's happening with your lead magnet.</span>
            </h1>
            <p className="dashboard-subtitle">
              Monitor your user engagement, track conversions, and manage your lead generation effectively.
            </p>
          </div>
          <div className="header-actions">
            <button 
              className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
              onClick={loadDashboardData}
              disabled={refreshing}
            >
              <i className="fas fa-sync-alt"></i>
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <button className="export-btn" onClick={() => handleExportData('all')}>
              <i className="fas fa-download"></i>
              Export
            </button>
          </div>
        </div>
        
        <div className="dashboard-filters">
          <div className="filter-group">
            <button className="filter-btn active">7 Days</button>
            <button className="filter-btn">30 Days</button>
            <button className="filter-btn">90 Days</button>
          </div>
        </div>
        
        <div className="stats-grid">
          <StatCard
            icon="fas fa-users"
            title="Total Users"
            value={stats.totalUsers}
            change={stats.recentUsers}
            changeType="positive"
            color="primary"
            description="Registered users in your system"
          />
          
          <StatCard
            icon="fas fa-envelope"
            title="Contact Submissions"
            value={stats.totalContacts}
            change={stats.recentContacts}
            changeType="positive"
            color="secondary"
            description="Total contact form submissions"
          />
          
          <StatCard
            icon="fas fa-check-circle"
            title="Verified Users"
            value={stats.verifiedUsers}
            change={Math.floor(stats.verifiedUsers * 0.1)}
            changeType="positive"
            color="success"
            description="Users with verified email addresses"
          />
          
          <StatCard
            icon="fas fa-chart-line"
            title="Verification Rate"
            value={`${Math.round(stats.verificationRate)}%`}
            change={5}
            changeType="positive"
            color="warning"
            description="Percentage of verified users"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-actions-grid">
          <div className="action-card" onClick={() => setShowUserModal(true)}>
            <div className="action-icon">
              <i className="fas fa-user-plus"></i>
            </div>
            <div className="action-content">
              <h3>Add New User</h3>
              <p>Manually add a new user to the system</p>
            </div>
            <button className="action-btn">
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
          
          <div className="action-card">
            <div className="action-icon">
              <i className="fas fa-file-export"></i>
            </div>
            <div className="action-content">
              <h3>Export Data</h3>
              <p>Download user and contact data</p>
            </div>
            <div className="export-options">
              <button className="export-option-btn" onClick={() => handleExportData('users')}>
                Users
              </button>
              <button className="export-option-btn" onClick={() => handleExportData('contacts')}>
                Contacts
              </button>
              <button className="export-option-btn" onClick={() => handleExportData('all')}>
                All
              </button>
            </div>
          </div>
          
          <div className="action-card" onClick={handleSystemSettings}>
            <div className="action-icon">
              <i className="fas fa-cog"></i>
            </div>
            <div className="action-content">
              <h3>System Settings</h3>
              <p>Configure system preferences</p>
            </div>
            <button className="action-btn">
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
          <button className="view-all-btn" onClick={loadDashboardData}>
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>
        <div className="activity-list">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.color}`}>
                  <i className={activity.icon}></i>
                </div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-description">{activity.description}</div>
                  <div className="activity-time">{formatTimeAgo(activity.timestamp)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <i className="fas fa-inbox"></i>
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddUser} className="modal-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* System Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>System Settings</h3>
              <button className="modal-close" onClick={() => setShowSettingsModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleUpdateSettings} className="modal-form">
              <div className="form-group">
                <label>System Name</label>
                <input
                  type="text"
                  value={systemSettings.systemName || ''}
                  onChange={(e) => setSystemSettings({...systemSettings, systemName: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={systemSettings.registrationEnabled || false}
                    onChange={(e) => setSystemSettings({...systemSettings, registrationEnabled: e.target.checked})}
                  />
                  Enable User Registration
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={systemSettings.emailNotifications || false}
                    onChange={(e) => setSystemSettings({...systemSettings, emailNotifications: e.target.checked})}
                  />
                  Enable Email Notifications
                </label>
              </div>
              <div className="form-group">
                <label>Max Users</label>
                <input
                  type="number"
                  value={systemSettings.maxUsers || 1000}
                  onChange={(e) => setSystemSettings({...systemSettings, maxUsers: parseInt(e.target.value)})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowSettingsModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;