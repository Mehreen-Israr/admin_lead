import React, { useState, useEffect } from 'react';
import { fetchUsers, getUserById, deleteUser } from '../services/api';
import './UsersPage.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await fetchUsers();
      setUsers(userData);
      setError('');
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      setLoadingUser(true);
      const userDetails = await getUserById(userId);
      setSelectedUser(userDetails);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Failed to load user details. Please try again.');
    } finally {
      setLoadingUser(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingUserId(userId);
      await deleteUser(userId);
      
      // Remove user from local state
      setUsers(users.filter(user => user._id !== userId));
      
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Users Management</h1>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{users.length}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{users.filter(u => u.isActive).length}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="refresh-btn" onClick={loadUsers}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role ${user.role}`}>
                      {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-view" 
                        onClick={() => handleViewUser(user._id)}
                        disabled={loadingUser}
                      >
                        {loadingUser ? 'Loading...' : 'View'}
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDeleteUser(user._id, user.name)}
                        disabled={deletingUserId === user._id}
                      >
                        {deletingUserId === user._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && !loading && (
            <div className="no-data">
              {searchTerm ? 'No users found matching your search.' : 'No users found.'}
            </div>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {showViewModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="user-details">
                <div className="detail-section">
                  <h3>Basic Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedUser.name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="detail-item">
                      <label>Role:</label>
                      <span className={`role ${selectedUser.role}`}>
                        {selectedUser.role?.charAt(0).toUpperCase() + selectedUser.role?.slice(1)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={`status ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Account Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>User ID:</label>
                      <span>{selectedUser._id}</span>
                    </div>
                    <div className="detail-item">
                      <label>Created:</label>
                      <span>{new Date(selectedUser.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>Last Updated:</label>
                      <span>{new Date(selectedUser.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {selectedUser.role !== 'admin' && (
                  <div className="detail-section">
                    <h3>Packages & Services</h3>
                    <div className="packages-info">
                      <p className="coming-soon">Package information will be available in future updates</p>
                      <div className="package-placeholder">
                        <div className="package-item">
                          <label>Active Packages:</label>
                          <span className="placeholder">Coming Soon</span>
                        </div>
                        <div className="package-item">
                          <label>Subscription Status:</label>
                          <span className="placeholder">Coming Soon</span>
                        </div>
                        <div className="package-item">
                          <label>Package History:</label>
                          <span className="placeholder">Coming Soon</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-close" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;