import React, { useState } from 'react';
import './Header.css';

const Header = ({ onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    onLogout();
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
            <div className="search-icon">🔍</div>
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
          {/* Notifications */}
          <div className="header-action">
            <div className="notification-btn">
              <span className="notification-icon">🔔</span>
              <span className="notification-badge">3</span>
            </div>
          </div>

          {/* Settings */}
          <div className="header-action">
            <div className="settings-btn">
              <span className="settings-icon">⚙️</span>
            </div>
          </div>

          {/* User Menu */}
          <div className="user-menu-container">
            <div 
              className="user-menu" 
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                <span>A</span>
              </div>
              <div className="user-info">
                <div className="user-name">Admin User</div>
                <div className="user-role">Administrator</div>
              </div>
              <div className="dropdown-arrow">▼</div>
            </div>
            
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-item">
                  <span className="dropdown-icon">👤</span>
                  Profile Settings
                </div>
                <div className="dropdown-item">
                  <span className="dropdown-icon">🎨</span>
                  Appearance
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  Logout
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