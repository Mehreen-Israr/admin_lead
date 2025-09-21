import React from 'react';
import './Header.css';

const Header = ({ onLogout }) => {
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    onLogout();
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title">
          <h2>Admin Dashboard</h2>
        </div>
        <div className="header-actions">
          <div className="admin-info">
            <span>Welcome, Admin</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;