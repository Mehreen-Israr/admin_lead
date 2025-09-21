import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
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

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      
      // Handle both old and new API response formats
      const statsData = data.stats || data.data || {
        totalUsers: 0,
        totalContacts: 0,
        verifiedUsers: 0,
        recentUsers: 0,
        recentContacts: 0,
        verificationRate: 0
      };
      
      setStats(statsData);
      setError('');
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setError('Failed to load dashboard statistics.');
      // Set default values on error
      setStats({
        totalUsers: 0,
        totalContacts: 0,
        verifiedUsers: 0,
        recentUsers: 0,
        recentContacts: 0,
        verificationRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome to LeadMagnet Admin Panel</p>
        <button className="refresh-btn" onClick={loadDashboardStats}>
          🔄 Refresh Data
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
            <span className="stat-change positive">+{stats.recentUsers} this week</span>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">📧</div>
          <div className="stat-content">
            <h3>{stats.totalContacts}</h3>
            <p>Contact Submissions</p>
            <span className="stat-change positive">+{stats.recentContacts} this week</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.verifiedUsers}</h3>
            <p>Verified Users</p>
            <span className="stat-change neutral">{stats.verificationRate}% verified</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalUsers - stats.verifiedUsers}</h3>
            <p>Pending Verification</p>
            <span className="stat-change neutral">{100 - stats.verificationRate}% pending</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>📈 Quick Stats</h2>
            <p>Overview of your platform metrics</p>
          </div>
          
          <div className="quick-stats">
            <div className="quick-stat">
              <span className="stat-label">Active Users</span>
              <span className="stat-value">{stats.verifiedUsers}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-label">New This Week</span>
              <span className="stat-value">{stats.recentUsers}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-label">Contact Forms</span>
              <span className="stat-value">{stats.recentContacts}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-label">Verification Rate</span>
              <span className="stat-value">{stats.verificationRate}%</span>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>🚀 Quick Actions</h2>
            <p>Common administrative tasks</p>
          </div>
          
          <div className="quick-actions">
            <button className="action-btn primary" onClick={() => window.location.href = '/users'}>
              👥 Manage Users
            </button>
            <button className="action-btn secondary" onClick={() => window.location.href = '/contacts'}>
              📧 View Contacts
            </button>
            <button className="action-btn success" onClick={loadDashboardStats}>
              🔄 Refresh Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;