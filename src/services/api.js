const getApiBaseUrl = () => {
  // Check if we're in development and local backend is available
  if (process.env.NODE_ENV === 'development') {
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
  }
  // Production fallback
  return process.env.REACT_APP_BACKEND_URL || 'https://admin-lead-backend.onrender.com';
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// API service functions
export const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const result = await response.json();
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
    
    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }
    
    const result = await response.json();
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
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};