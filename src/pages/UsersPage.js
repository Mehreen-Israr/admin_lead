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
        <div className="search-container">
          <div className="search-icon">
            <i className="fas fa-search"></i>
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <button className="refresh-btn" onClick={loadUsers}>
          <i className="fas fa-sync-alt"></i>
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
                        title="View User Details"
                      >
                        <i className={`fas ${loadingUser ? 'fa-spinner fa-spin' : 'fa-eye'}`}></i>
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDeleteUser(user._id, user.name)}
                        disabled={deletingUserId === user._id}
                        title="Delete User"
                      >
                        <i className={`fas ${deletingUserId === user._id ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
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
                    <h3>Subscription Information</h3>
                    <div className="subscription-info">
                      {selectedUser.subscription ? (
                        <div className="subscription-details">
                          <div className="subscription-header">
                            <div className="subscription-status">
                              <span className={`status-badge ${selectedUser.subscription.status}`}>
                                {selectedUser.subscription.status?.charAt(0).toUpperCase() + selectedUser.subscription.status?.slice(1)}
                              </span>
                            </div>
                            <div className="subscription-plan">
                              <strong>{selectedUser.subscription.plan?.charAt(0).toUpperCase() + selectedUser.subscription.plan?.slice(1)} Plan</strong>
                            </div>
                          </div>
                          
                          <div className="detail-grid">
                            <div className="detail-item">
                              <label>Package Name:</label>
                              <span>{selectedUser.subscription.packageName || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Plan:</label>
                              <span className="plan-badge">{selectedUser.subscription.plan || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Status:</label>
                              <span className={`status ${selectedUser.subscription.status}`}>
                                {selectedUser.subscription.status?.charAt(0).toUpperCase() + selectedUser.subscription.status?.slice(1)}
                              </span>
                            </div>
                            <div className="detail-item">
                              <label>Current Period Start:</label>
                              <span>{selectedUser.subscription.currentPeriodStart ? new Date(selectedUser.subscription.currentPeriodStart).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Current Period End:</label>
                              <span>{selectedUser.subscription.currentPeriodEnd ? new Date(selectedUser.subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            {selectedUser.subscription.trialStart && (
                              <div className="detail-item">
                                <label>Trial Start:</label>
                                <span>{new Date(selectedUser.subscription.trialStart).toLocaleDateString()}</span>
                              </div>
                            )}
                            {selectedUser.subscription.trialEnd && (
                              <div className="detail-item">
                                <label>Trial End:</label>
                                <span>{new Date(selectedUser.subscription.trialEnd).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="detail-item">
                              <label>Cancel at Period End:</label>
                              <span className={selectedUser.subscription.cancelAtPeriodEnd ? 'cancel-warning' : 'no-cancel'}>
                                {selectedUser.subscription.cancelAtPeriodEnd ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="detail-item">
                              <label>Stripe Customer ID:</label>
                              <span className="stripe-id">{selectedUser.subscription.stripeCustomerId || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Stripe Subscription ID:</label>
                              <span className="stripe-id">{selectedUser.subscription.stripeSubscriptionId || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Subscription Created:</label>
                              <span>{selectedUser.subscription.createdAt ? new Date(selectedUser.subscription.createdAt).toLocaleString() : 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Last Updated:</label>
                              <span>{selectedUser.subscription.updatedAt ? new Date(selectedUser.subscription.updatedAt).toLocaleString() : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="no-subscription">
                          <div className="no-subscription-icon">
                            <i className="fas fa-times-circle"></i>
                          </div>
                          <p className="no-subscription-text">No subscription found</p>
                          <p className="no-subscription-description">This user hasn't subscribed to any packages yet.</p>
                        </div>
                      )}
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