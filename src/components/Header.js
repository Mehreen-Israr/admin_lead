import React, { useState, useEffect } from 'react';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/api';
import './Header.css';

const Header = ({ onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    onLogout();
  };

  // Fetch notifications on component mount
  useEffect(() => {
    loadNotifications();
    
    // Set up polling for real-time updates
    const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetchNotifications({ limit: 10 });
      setNotifications(response.data);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification._id);
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id 
              ? { ...n, isRead: true, readAt: new Date() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Left Section */}
        <div className="header-left">
          <div className="header-breadcrumb">
            <span className="breadcrumb-item">Dashboard</span>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">Overview</span>
          </div>
        </div>

        {/* Center Section */}
        <div className="header-center">
          <div className="search-container">
            <div className="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="search-input"
            />
            <div className="search-shortcut">⌘K</div>
          </div>
        </div>

        {/* Right Section */}
        <div className="header-right">
          {/* Quick Actions */}
          

          {/* Notifications */}
          <div className="header-action notification-container">
            <button 
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            
            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button className="mark-all-read" onClick={handleMarkAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="notifications-list">
                  {loading ? (
                    <div className="notification-item">
                      <div className="notification-content">
                        <div className="notification-title">Loading...</div>
                      </div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="notification-item">
                      <div className="notification-content">
                        <div className="notification-title">No notifications</div>
                        <div className="notification-time">You're all caught up!</div>
                      </div>
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div 
                        key={notification._id} 
                        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="notification-content">
                          <div className="notification-title">{notification.title}</div>
                          <div className="notification-message">{notification.message}</div>
                          <div className="notification-time">{formatTimeAgo(notification.createdAt)}</div>
                        </div>
                        {!notification.isRead && <div className="notification-dot"></div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="header-action user-menu-container">
            <button 
              className="user-menu-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                <div className="avatar-placeholder">A</div>
              </div>
              <div className="user-info">
                <span className="user-name">Admin User</span>
                <span className="user-role">Administrator</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </button>
            
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-item logout" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16,17 21,12 16,7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;