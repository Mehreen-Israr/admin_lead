import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import './styles/globals.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ContactsPage from './pages/ContactsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import Login from './pages/Login';

// Create a separate component for the main app content
function AppContent() {
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => {
    setSidebarOpen(false);
    document.body.classList.remove('sidebar-open');
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Login />;
  }

  return (
    <div className="admin-app">
      <Sidebar onNavigate={closeSidebar} />
      <div className="main-content">
        <Header onLogout={logout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="content-area">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;