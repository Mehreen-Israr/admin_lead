import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
            <path d="M20 20h60v60H20z" fill="#FFD700"/>
            <path d="M30 30h40v40H30z" fill="#1a1a1a"/>
            <path d="M40 40h20v20H40z" fill="#FFD700"/>
          </svg>
          <div className="logo-text">
            <span className="brand-name">LeadMagnet</span>
            <span className="admin-label">Admin Panel</span>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <Link 
          to="/" 
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          <div className="nav-icon">📊</div>
          <span>Dashboard</span>
        </Link>
        <Link 
          to="/users" 
          className={`nav-item ${location.pathname === '/users' ? 'active' : ''}`}
        >
          <div className="nav-icon">👥</div>
          <span>Users</span>
        </Link>
        <Link 
          to="/contacts" 
          className={`nav-item ${location.pathname === '/contacts' ? 'active' : ''}`}
        >
          <div className="nav-icon">📧</div>
          <span>Contacts</span>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;