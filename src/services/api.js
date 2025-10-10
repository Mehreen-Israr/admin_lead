const getApiBaseUrl = () => {
  // Check if we're in development and local backend is available
  if (process.env.NODE_ENV === 'development') {
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
  }
  // Production fallback
  return process.env.REACT_APP_BACKEND_URL || 'https://admin-lead-backend.onrender.com';
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('adminToken');
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper function to handle API responses and token expiration
const handleApiResponse = async (response) => {
  if (response.status === 401) {
    // Token expired or invalid - clear storage and redirect to login
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }
  
  return response.json();
};

// API service functions
export const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      headers: getAuthHeaders()
    });
    
    const result = await handleApiResponse(response);
    return result.data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const fetchContacts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/contacts`, {
      headers: getAuthHeaders()
    });
    
    const result = await handleApiResponse(response);
    return result.data || [];
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};

export const adminLogin = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('adminToken', data.token);
    return data;
  } catch (error) {
    console.error('Error during admin login:', error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      headers: getAuthHeaders()
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const fetchNotifications = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/api/admin/notifications?${queryParams}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/notifications/mark-all-read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Quick Actions API calls
export const createUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const exportData = async (type, format = 'csv') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/export/${type}?format=${format}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Export response error:', errorText);
      throw new Error(`Failed to export data: ${response.status} ${response.statusText}`);
    }

    // Get filename from response headers
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename="')[1].split('"')[0]
      : `export_${type}_${new Date().toISOString().split('T')[0]}.${format}`;

    // Handle different content types
    const contentType = response.headers.get('Content-Type');
    
    if (contentType && contentType.includes('application/json')) {
      // For JSON exports, create a JSON file
      const jsonData = await response.json();
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      // For Excel exports (like 'all'), create an Excel file
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      // For CSV exports
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

export const getSystemSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch system settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

export const updateSystemSettings = async (settings) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

export const getRecentActivity = async (limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/activity?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recent activity');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
};

// Packages API
export const fetchPackages = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/packages`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch packages');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
};

export const createPackage = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/packages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to create package');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating package:', error);
    throw error;
  }
};

export const updatePackage = async (id, payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/packages/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to update package');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating package:', error);
    throw error;
  }
};

export const deletePackage = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/packages/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to delete package');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting package:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Archive/Unarchive contact
export const archiveContact = async (contactId, isArchived) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/contacts/${contactId}/archive`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isArchived })
    });
    
    if (!response.ok) {
      throw new Error('Failed to archive contact');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error archiving contact:', error);
    throw error;
  }
};

export const sendReplyEmail = async (contactId, subject, message, adminEmail) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/contacts/${contactId}/reply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ subject, message, adminEmail })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send reply email');
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending reply email:', error);
    throw error;
  }
};

// ==================== BOOKING API FUNCTIONS ====================

export const getBookings = async (page = 1, limit = 20, status = '', search = '') => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const response = await fetch(`${API_BASE_URL}/api/admin/bookings?${params}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

export const getBookingById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${id}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch booking');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
};

export const updateBookingStatus = async (id, status, adminNotes = '', cancellationReason = '') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ status, adminNotes, cancellationReason })
    });

    if (!response.ok) {
      throw new Error('Failed to update booking status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

export const updateBooking = async (id, bookingData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      throw new Error('Failed to update booking');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};

export const deleteBooking = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete booking');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
};

export const getBookingStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/bookings-stats`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch booking statistics');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching booking statistics:', error);
    throw error;
  }
};