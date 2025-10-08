import React, { useState, useEffect } from 'react';
import { 
  getBookings, 
  getBookingById, 
  updateBookingStatus, 
  updateBooking, 
  deleteBooking,
  getBookingStats 
} from '../services/api';
import './BookingsPage.css';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [stats, setStats] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(null);

  // Status options
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rescheduled', label: 'Rescheduled' }
  ];

  // Status colors
  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#3b82f6',
      confirmed: '#10b981',
      completed: '#059669',
      cancelled: '#ef4444',
      rescheduled: '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  };

  // Load bookings
  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await getBookings(currentPage, 20, statusFilter, searchTerm);
      setBookings(response.data || []);
      setTotalPages(response.pages || 1);
      setTotalBookings(response.total || 0);
      setError('');
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Load booking statistics
  const loadStats = async () => {
    try {
      const response = await getBookingStats();
      setStats(response.data || {});
    } catch (error) {
      console.error('Error loading booking stats:', error);
    }
  };

  useEffect(() => {
    loadBookings();
    loadStats();
  }, [currentPage, statusFilter, searchTerm]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle status filter
  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadBookings();
    loadStats();
  };

  // Handle view booking details
  const handleViewDetails = async (bookingId) => {
    try {
      const response = await getBookingById(bookingId);
      setSelectedBooking(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading booking details:', error);
      alert('Failed to load booking details');
    }
  };

  // Handle update status
  const handleUpdateStatus = async (bookingId, newStatus, adminNotes = '', cancellationReason = '') => {
    try {
      setUpdatingStatus(true);
      await updateBookingStatus(bookingId, newStatus, adminNotes, cancellationReason);
      alert('Booking status updated successfully!');
      setShowStatusModal(false);
      loadBookings();
      loadStats();
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle delete booking
  const handleDeleteBooking = async (bookingId, customerName) => {
    if (!window.confirm(`Are you sure you want to delete the booking for ${customerName}?`)) {
      return;
    }

    try {
      setDeletingBooking(bookingId);
      await deleteBooking(bookingId);
      alert('Booking deleted successfully!');
      loadBookings();
      loadStats();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    } finally {
      setDeletingBooking(null);
    }
  };

  // Handle edit booking
  const handleEditBooking = (booking) => {
    setEditForm({
      _id: booking._id,
      meetingTitle: booking.meetingTitle || '',
      meetingType: booking.meetingType || '',
      duration: booking.duration || 30,
      timezone: booking.timezone || '',
      attendee: {
        name: booking.attendee?.name || '',
        email: booking.attendee?.email || ''
      },
      scheduledTime: booking.scheduledTime ? new Date(booking.scheduledTime).toISOString().slice(0, 16) : '',
      status: booking.status || 'scheduled',
      adminNotes: booking.adminNotes || '',
      followUpSent: booking.followUpSent || false,
      reminderSent: booking.reminderSent || false,
      cancellationReason: booking.cancellationReason || ''
    });
    setShowEditModal(true);
  };

  // Handle save edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    try {
      setSavingEdit(true);
      
      // Prepare update data
      const updateData = {
        meetingTitle: editForm.meetingTitle,
        meetingType: editForm.meetingType,
        duration: parseInt(editForm.duration),
        timezone: editForm.timezone,
        attendee: {
          name: editForm.attendee.name,
          email: editForm.attendee.email
        },
        scheduledTime: new Date(editForm.scheduledTime),
        status: editForm.status,
        adminNotes: editForm.adminNotes,
        followUpSent: editForm.followUpSent,
        reminderSent: editForm.reminderSent,
        cancellationReason: editForm.cancellationReason
      };

      await updateBooking(editForm._id, updateData);
      alert('Booking updated successfully!');
      setShowEditModal(false);
      loadBookings();
      loadStats();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    } finally {
      setSavingEdit(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return 'Invalid Time';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusLabels = {
      scheduled: 'Scheduled',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rescheduled: 'Rescheduled'
    };

    return (
      <span 
        className="status-badge"
        style={{ backgroundColor: getStatusColor(status) }}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="bookings-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Bookings Management</h1>
            <p className="page-subtitle">Manage and track all customer bookings</p>
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={loading}
            >
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendly Upgrade Message */}
      <div className="upgrade-notice">
        <div className="notice-content">
          <i className="fas fa-info-circle notice-icon"></i>
          <span className="notice-text">New bookings will be displayed from backend after upgrading Calendly to standard</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.scheduled || 0}</div>
            <div className="stat-label">Scheduled</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.confirmed || 0}</div>
            <div className="stat-label">Confirmed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-check-double"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-container">
          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
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
          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="filter-select"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bookings-section">
        <div className="section-header">
          <h2 className="section-title">All Bookings ({totalBookings})</h2>
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-calendar-times"></i>
            </div>
            <h3>No bookings found</h3>
            <p>No bookings match your current filters.</p>
          </div>
        ) : (
          <div className="bookings-table-container">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">{booking.attendee?.name || 'N/A'}</div>
                        <div className="customer-email">{booking.attendee?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="service-info">
                        <div className="service-type">{booking.meetingTitle || booking.meetingType || 'N/A'}</div>
                        {booking.duration && (
                          <div className="service-duration">{booking.duration} min</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="datetime-info">
                        <div className="booking-date">{formatDate(booking.scheduledTime)}</div>
                        <div className="booking-time">{formatTime(booking.scheduledTime)}</div>
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(booking.status)}
                    </td>
                    <td>
                      <div className="price-info">
                        <span className="no-price">Free</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-view"
                          onClick={() => handleViewDetails(booking._id)}
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className="btn-edit"
                          onClick={() => handleEditBooking(booking)}
                          title="Edit Booking"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteBooking(booking._id, booking.customerName)}
                          disabled={deletingBooking === booking._id}
                          title="Delete Booking"
                        >
                          <i className={`fas ${deletingBooking === booking._id ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
              Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Booking Details</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="booking-details">
                <div className="detail-section">
                  <h4>Customer Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedBooking.attendee?.name || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{selectedBooking.attendee?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Meeting Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Meeting Type:</label>
                      <span>{selectedBooking.meetingType || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Meeting Title:</label>
                      <span>{selectedBooking.meetingTitle || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Date:</label>
                      <span>{formatDate(selectedBooking.scheduledTime)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Time:</label>
                      <span>{formatTime(selectedBooking.scheduledTime)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Duration:</label>
                      <span>{selectedBooking.duration} minutes</span>
                    </div>
                    <div className="detail-item">
                      <label>Timezone:</label>
                      <span>{selectedBooking.timezone || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                  </div>
                </div>

                {selectedBooking.meetingUrl && (
                  <div className="detail-section">
                    <h4>Calendly Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Meeting URL:</label>
                        <a href={selectedBooking.meetingUrl} target="_blank" rel="noopener noreferrer" className="meeting-link">
                          Join Meeting
                        </a>
                      </div>
                      {selectedBooking.rescheduleUrl && (
                        <div className="detail-item">
                          <label>Reschedule URL:</label>
                          <a href={selectedBooking.rescheduleUrl} target="_blank" rel="noopener noreferrer" className="meeting-link">
                            Reschedule
                          </a>
                        </div>
                      )}
                      {selectedBooking.cancelUrl && (
                        <div className="detail-item">
                          <label>Cancel URL:</label>
                          <a href={selectedBooking.cancelUrl} target="_blank" rel="noopener noreferrer" className="meeting-link">
                            Cancel
                          </a>
                        </div>
                      )}
                      <div className="detail-item">
                        <label>Lead Source:</label>
                        <span>{selectedBooking.leadSource || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Follow-up Sent:</label>
                        <span>{selectedBooking.followUpSent ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Reminder Sent:</label>
                        <span>{selectedBooking.reminderSent ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBooking.notes && (
                  <div className="detail-section">
                    <h4>Notes</h4>
                    <p className="booking-notes">{selectedBooking.notes}</p>
                  </div>
                )}

                {selectedBooking.specialRequirements && (
                  <div className="detail-section">
                    <h4>Special Requirements</h4>
                    <p className="special-requirements">{selectedBooking.specialRequirements}</p>
                  </div>
                )}

                {selectedBooking.adminNotes && (
                  <div className="detail-section">
                    <h4>Admin Notes</h4>
                    <p className="admin-notes">{selectedBooking.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  setShowDetailsModal(false);
                  setShowStatusModal(true);
                }}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Booking</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-sections">
                {/* Meeting Information */}
                <div className="form-section">
                  <h4>Meeting Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Meeting Title</label>
                      <input
                        type="text"
                        value={editForm.meetingTitle || ''}
                        onChange={(e) => setEditForm({...editForm, meetingTitle: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Meeting Type</label>
                      <input
                        type="text"
                        value={editForm.meetingType || ''}
                        onChange={(e) => setEditForm({...editForm, meetingType: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Duration (minutes)</label>
                      <input
                        type="number"
                        value={editForm.duration || 30}
                        onChange={(e) => setEditForm({...editForm, duration: e.target.value})}
                        min="1"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Timezone</label>
                      <input
                        type="text"
                        value={editForm.timezone || ''}
                        onChange={(e) => setEditForm({...editForm, timezone: e.target.value})}
                        placeholder="e.g., Asia/Karachi"
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="form-section">
                  <h4>Customer Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Customer Name</label>
                      <input
                        type="text"
                        value={editForm.attendee?.name || ''}
                        onChange={(e) => setEditForm({
                          ...editForm, 
                          attendee: {...editForm.attendee, name: e.target.value}
                        })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Customer Email</label>
                      <input
                        type="email"
                        value={editForm.attendee?.email || ''}
                        onChange={(e) => setEditForm({
                          ...editForm, 
                          attendee: {...editForm.attendee, email: e.target.value}
                        })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Scheduling */}
                <div className="form-section">
                  <h4>Scheduling</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Date & Time</label>
                      <input
                        type="datetime-local"
                        value={editForm.scheduledTime || ''}
                        onChange={(e) => setEditForm({...editForm, scheduledTime: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={editForm.status || 'scheduled'}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rescheduled">Rescheduled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Admin Management */}
                <div className="form-section">
                  <h4>Admin Management</h4>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Admin Notes</label>
                      <textarea
                        value={editForm.adminNotes || ''}
                        onChange={(e) => setEditForm({...editForm, adminNotes: e.target.value})}
                        rows="3"
                        placeholder="Internal notes about this booking..."
                      />
                    </div>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editForm.followUpSent || false}
                          onChange={(e) => setEditForm({...editForm, followUpSent: e.target.checked})}
                        />
                        <span>Follow-up Sent</span>
                      </label>
                    </div>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editForm.reminderSent || false}
                          onChange={(e) => setEditForm({...editForm, reminderSent: e.target.checked})}
                        />
                        <span>Reminder Sent</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Cancellation Reason (if cancelled) */}
                {editForm.status === 'cancelled' && (
                  <div className="form-section">
                    <h4>Cancellation Details</h4>
                    <div className="form-group full-width">
                      <label>Cancellation Reason</label>
                      <textarea
                        value={editForm.cancellationReason || ''}
                        onChange={(e) => setEditForm({...editForm, cancellationReason: e.target.value})}
                        rows="2"
                        placeholder="Reason for cancellation..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
