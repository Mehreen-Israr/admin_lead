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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setRefreshing(true);
      const data = await getDashboardStats();
      
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
      setRefreshing(false);
    }
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
              <span className="title-gradient">Dashboard Overview</span>
            </h1>
            <p className="dashboard-subtitle">Welcome back! Here's what's happening with your lead magnet.</p>
          </div>
          <div className="header-actions">
            <button 
              className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
              onClick={loadDashboardStats}
              disabled={refreshing}
            >
              <i className="fas fa-sync-alt"></i>
              <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
            <button className="export-btn">
              <i className="fas fa-download"></i>
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <i className="fas fa-exclamation-triangle"></i>
            <div className="error-text">
              <strong>Error:</strong> {error}
            </div>
            <button className="error-close" onClick={() => setError('')}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-section">
        <div className="section-header">
          <h2>Key Metrics</h2>
          <div className="time-filter">
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
          <div className="action-card">
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
            <button className="action-btn">
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
          
          <div className="action-card">
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
          <button className="view-all-btn">View All</button>
        </div>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon success">
              <i className="fas fa-user-check"></i>
            </div>
            <div className="activity-content">
              <div className="activity-title">New user registered</div>
              <div className="activity-description">john.doe@example.com joined the platform</div>
              <div className="activity-time">2 minutes ago</div>
            </div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon primary">
              <i className="fas fa-envelope"></i>
            </div>
            <div className="activity-content">
              <div className="activity-title">Contact form submitted</div>
              <div className="activity-description">New inquiry from potential customer</div>
              <div className="activity-time">15 minutes ago</div>
            </div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon warning">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="activity-content">
              <div className="activity-title">System maintenance</div>
              <div className="activity-description">Scheduled maintenance completed successfully</div>
              <div className="activity-time">1 hour ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;