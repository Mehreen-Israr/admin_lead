import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ onNavigate }) => {
  const location = useLocation();

  const handleNavClick = () => {
    // Close sidebar on mobile when navigating
    if (onNavigate) {
      onNavigate();
    }
  };

  const navigationItems = [
    {
      path: '/',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
      label: 'Dashboard',
      badge: null
    },
    {
      path: '/users',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      label: 'Users',
      badge: 'New'
    },
    {
      path: '/contacts',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      label: 'Contacts',
      badge: null
    },
    {
      path: '/subscriptions',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="14" rx="2"/>
          <path d="M7 8h10M7 12h6"/>
        </svg>
      ),
      label: 'Subscriptions',
      badge: null
    }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24"/>
                  <stop offset="100%" stopColor="#f59e0b"/>
                </linearGradient>
              </defs>
              <rect x="10" y="10" width="80" height="80" rx="16" fill="url(#logoGradient)"/>
              <rect x="25" y="25" width="50" height="50" rx="8" fill="#0f0f23"/>
              <rect x="35" y="35" width="30" height="30" rx="4" fill="url(#logoGradient)"/>
            </svg>
          </div>
          <div className="logo-text">
            <span className="brand-name">LeadMagnet</span>
            <span className="admin-label">Admin Panel</span>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Main Navigation</div>
          {navigationItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <div className="nav-icon">{item.icon}</div>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
              <div className="nav-indicator"></div>
            </Link>
          ))}
        </div>
        
      
      </nav>
      
      
    </div>
  );
};

export default Sidebar;