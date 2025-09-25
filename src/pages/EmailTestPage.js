// Email Test Page - Professional Email Service Testing
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './EmailTestPage.css';

const EmailTestPage = () => {
  const [emailStatus, setEmailStatus] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEmailStatus();
  }, []);

  const checkEmailStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/email/test');
      setEmailStatus(response.data);
    } catch (error) {
      console.error('Error checking email status:', error);
      setEmailStatus({
        success: false,
        message: error.response?.data?.message || 'Failed to check email status',
        status: null
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await api.post('/admin/email/test', {
        to: testEmail || undefined
      });
      
      setTestResult({
        success: true,
        message: 'Test email sent successfully!',
        data: response.data
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Failed to send test email'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Email Service Test</h1>
        </div>
        <div className="loading">Checking email service status...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Email Service Test</h1>
        <p>Test and verify your email service configuration</p>
      </div>

      <div className="email-test-container">
        {/* Status Card */}
        <div className="status-card">
          <h2>Service Status</h2>
          <div className={`status-indicator ${emailStatus?.success ? 'success' : 'error'}`}>
            <div className="status-icon">
              {emailStatus?.success ? '✓' : '✗'}
            </div>
            <div className="status-content">
              <h3>{emailStatus?.success ? 'Email Service Active' : 'Email Service Inactive'}</h3>
              <p>{emailStatus?.message}</p>
            </div>
          </div>
          
          {emailStatus?.status && (
            <div className="status-details">
              <h4>Configuration Details:</h4>
              <ul>
                <li><strong>Service:</strong> {emailStatus.status.service || 'Not configured'}</li>
                <li><strong>User:</strong> {emailStatus.status.user || 'Not configured'}</li>
                <li><strong>From:</strong> {emailStatus.status.from || 'Not configured'}</li>
                <li><strong>Configured:</strong> {emailStatus.status.configured ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          )}
        </div>

        {/* Test Email Card */}
        <div className="test-card">
          <h2>Send Test Email</h2>
          <p>Send a test email to verify the service is working correctly.</p>
          
          <div className="test-form">
            <div className="form-group">
              <label htmlFor="testEmail">Test Email Address (optional)</label>
              <input
                type="email"
                id="testEmail"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Leave empty to send to configured email"
                className="form-input"
              />
              <small>If left empty, the test email will be sent to the configured email address.</small>
            </div>
            
            <button
              onClick={sendTestEmail}
              disabled={testing || !emailStatus?.success}
              className={`btn-primary ${testing ? 'loading' : ''}`}
            >
              {testing ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              <div className="result-icon">
                {testResult.success ? '✓' : '✗'}
              </div>
              <div className="result-content">
                <h4>{testResult.success ? 'Test Email Sent!' : 'Test Failed'}</h4>
                <p>{testResult.message}</p>
                {testResult.data && (
                  <div className="result-details">
                    <p><strong>Message ID:</strong> {testResult.data.messageId}</p>
                    <p><strong>Response:</strong> {testResult.data.response}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Configuration Help */}
        <div className="help-card">
          <h2>Email Configuration Help</h2>
          <div className="help-content">
            <h3>Required Environment Variables:</h3>
            <div className="env-vars">
              <div className="env-var">
                <code>EMAIL_USER</code>
                <span>Your email address (e.g., your-email@gmail.com)</span>
              </div>
              <div className="env-var">
                <code>EMAIL_PASS</code>
                <span>Your email password or app password</span>
              </div>
              <div className="env-var">
                <code>EMAIL_SERVICE</code>
                <span>Email service provider (gmail, outlook, custom)</span>
              </div>
            </div>
            
            <h3>For Gmail:</h3>
            <ol>
              <li>Enable 2-Factor Authentication on your Google Account</li>
              <li>Go to Google Account → Security → App passwords</li>
              <li>Generate a new app password for "Mail"</li>
              <li>Use the 16-character password (not your regular password)</li>
            </ol>
            
            <h3>For Other Services:</h3>
            <ul>
              <li><strong>Outlook:</strong> Use your regular password</li>
              <li><strong>Custom SMTP:</strong> Set EMAIL_SERVICE=custom and configure SMTP_HOST, SMTP_PORT, SMTP_SECURE</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTestPage;
