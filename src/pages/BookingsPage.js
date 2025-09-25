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
  const [stats, setStats] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(null);

  // Status options
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rescheduled', label: 'Rescheduled' }
  ];

  // Status colors
  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      completed: '#10b981',
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

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString) => {
    return timeString;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusLabels = {
      pending: 'Pending',
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
            <div className="stat-value">{stats.pending || 0}</div>
            <div className="stat-label">Pending</div>
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
                        <div className="customer-name">{booking.customerName}</div>
                        <div className="customer-email">{booking.customerEmail}</div>
                      </div>
                    </td>
                    <td>
                      <div className="service-info">
                        <div className="service-type">{booking.serviceType}</div>
                        {booking.duration && (
                          <div className="service-duration">{booking.duration} min</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="datetime-info">
                        <div className="booking-date">{formatDate(booking.bookingDate)}</div>
                        <div className="booking-time">{formatTime(booking.bookingTime)}</div>
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(booking.status)}
                    </td>
                    <td>
                      <div className="price-info">
                        {booking.price > 0 ? (
                          <span className="price">
                            {booking.currency || 'USD'} {booking.price}
                          </span>
                        ) : (
                          <span className="no-price">Free</span>
                        )}
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
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowEditModal(true);
                          }}
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
                      <span>{selectedBooking.customerName}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{selectedBooking.customerEmail}</span>
                    </div>
                    {selectedBooking.customerPhone && (
                      <div className="detail-item">
                        <label>Phone:</label>
                        <span>{selectedBooking.customerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Booking Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Service:</label>
                      <span>{selectedBooking.serviceType}</span>
                    </div>
                    <div className="detail-item">
                      <label>Date:</label>
                      <span>{formatDate(selectedBooking.bookingDate)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Time:</label>
                      <span>{formatTime(selectedBooking.bookingTime)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Duration:</label>
                      <span>{selectedBooking.duration} minutes</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                    {selectedBooking.price > 0 && (
                      <div className="detail-item">
                        <label>Price:</label>
                        <span>{selectedBooking.currency || 'USD'} {selectedBooking.price}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedBooking.location && (
                  <div className="detail-section">
                    <h4>Location</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Location:</label>
                        <span>{selectedBooking.location}</span>
                      </div>
                      {selectedBooking.address && (
                        <div className="detail-item">
                          <label>Address:</label>
                          <span>{selectedBooking.address}</span>
                        </div>
                      )}
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
    </div>
  );
};

export default BookingsPage;
