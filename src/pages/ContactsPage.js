import React, { useState, useEffect } from 'react';
import { fetchContacts, archiveContact, sendReplyEmail } from '../services/api';
import './ContactsPage.css';

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const contactData = await fetchContacts();
      setContacts(contactData);
      setError('');
    } catch (error) {
      console.error('Error loading contacts:', error);
      setError('Failed to load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (contact) => {
    const subject = `Re: Your inquiry about ${contact.service || 'our services'}`;
    const body = `Hi ${contact.name},\n\nThank you for your interest in our services. I'm writing to follow up on your inquiry.\n\nBest regards,\n[Your Name]`;
    
    // Always show the modal first - this is more reliable
    setSelectedContact({
      ...contact,
      replySubject: subject,
      replyBody: body
    });
    setShowReplyModal(true);
  };

  // Utility function to open email client with better error handling
  const openEmailClient = (email, subject, body) => {
    try {
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      console.log('Attempting to open email client with link:', mailtoLink);
      
      // Method 1: Try creating and clicking a link (most reliable)
      const link = document.createElement('a');
      link.href = mailtoLink;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        try {
          link.click();
          console.log('Email client link clicked successfully');
          // Clean up after a short delay
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
          }, 100);
        } catch (clickError) {
          console.error('Error clicking mailto link:', clickError);
          // Method 2: Try window.open as fallback
          try {
            console.log('Trying window.open fallback...');
            window.open(mailtoLink, '_self');
          } catch (openError) {
            console.error('Error with window.open fallback:', openError);
            // Method 3: Try window.location as last resort
            try {
              console.log('Trying window.location fallback...');
              window.location.href = mailtoLink;
            } catch (locationError) {
              console.error('All mailto methods failed:', locationError);
              throw new Error('Unable to open email client. Please copy the email content and send manually.');
            }
          }
        }
      });
      
    } catch (error) {
      console.error('Error opening email client:', error);
      throw error;
    }
  };

  const handleArchive = async (contactId, isArchived) => {
    try {
      await archiveContact(contactId, isArchived);
      // Update local state
      setContacts(contacts.map(contact => 
        contact._id === contactId 
          ? { ...contact, isArchived } 
          : contact
      ));
      alert(isArchived ? 'Contact archived successfully!' : 'Contact unarchived successfully!');
    } catch (error) {
      console.error('Error archiving contact:', error);
      alert('Failed to archive contact. Please try again.');
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'active' ? !contact.isArchived : contact.isArchived;
    
    return matchesSearch && matchesTab;
  });

  return (
    <div className="contacts-page">
      <div className="page-header">
        <h1>Contact Form Submissions</h1>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{contacts.filter(c => !c.isArchived).length}</span>
            <span className="stat-label">Active Contacts</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{contacts.filter(c => c.isArchived).length}</span>
            <span className="stat-label">Archived</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{contacts.filter(c => new Date(c.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length}</span>
            <span className="stat-label">This Week</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <i className="fas fa-inbox"></i>
          Active Contacts ({contacts.filter(c => !c.isArchived).length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          <i className="fas fa-archive"></i>
          Archived ({contacts.filter(c => c.isArchived).length})
        </button>
      </div>

      <div className="page-controls">
        <div className="search-container">
          <div className="search-icon">
            <i className="fas fa-search"></i>
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Search contacts by name, email, or company..."
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
        <button className="refresh-btn" onClick={loadContacts}>
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
        <div className="loading">Loading contacts...</div>
      ) : (
        <div className="contacts-grid">
          {filteredContacts.map(contact => (
            <div key={contact._id} className="contact-card">
              <div className="contact-header">
                <div className="contact-avatar">
                  {contact.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="contact-basic-info">
                  <h3>{contact.name}</h3>
                  <span className="contact-date">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="contact-details">
                <div className="contact-info">
                  <div className="info-item">
                    <strong>Email:</strong> 
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </div>
                  <div className="info-item">
                    <strong>Phone:</strong> 
                    <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                  </div>
                  <div className="info-item">
                    <strong>Company:</strong> {contact.company}
                  </div>
                  <div className="info-item">
                    <strong>Service:</strong> {contact.service}
                  </div>
                </div>
                
                <div className="contact-message">
                  <strong>Message:</strong>
                  <p>{contact.message}</p>
                </div>
              </div>
              
              <div className="contact-actions">
                <button 
                  className="btn-reply" 
                  onClick={() => handleReply(contact)}
                  title="Reply via email"
                >
                  <i className="fas fa-reply"></i>
                  Reply
                </button>
                <button 
                  className={`btn-archive ${contact.isArchived ? 'archived' : ''}`}
                  onClick={() => handleArchive(contact._id, !contact.isArchived)}
                  title={contact.isArchived ? 'Unarchive contact' : 'Archive contact'}
                >
                  <i className={`fas ${contact.isArchived ? 'fa-undo' : 'fa-archive'}`}></i>
                  {contact.isArchived ? 'Unarchive' : 'Archive'}
                </button>
              </div>
            </div>
          ))}
          
          {filteredContacts.length === 0 && !loading && (
            <div className="no-data">
              {searchTerm ? 'No contacts found matching your search.' : 'No contacts found.'}
            </div>
          )}
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedContact && (
        <div className="modal-overlay" onClick={() => setShowReplyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reply to {selectedContact.name}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowReplyModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="email-details">
                <div className="email-field">
                  <label>To:</label>
                  <input 
                    type="email" 
                    value={selectedContact.email} 
                    readOnly 
                    className="email-input"
                  />
                </div>
                
                <div className="email-field">
                  <label>Subject:</label>
                  <input 
                    type="text" 
                    value={selectedContact.replySubject} 
                    readOnly 
                    className="email-input"
                  />
                </div>
                
                <div className="email-field">
                  <label>Message:</label>
                  <textarea 
                    value={selectedContact.replyBody} 
                    readOnly 
                    rows="8"
                    className="email-textarea"
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn-primary"
                  disabled={sendingEmail}
                  onClick={async () => {
                    try {
                      setSendingEmail(true);
                      const adminEmail = 'admin@leadmagnet.com'; // You can make this configurable
                      await sendReplyEmail(
                        selectedContact._id,
                        selectedContact.replySubject,
                        selectedContact.replyBody,
                        adminEmail
                      );
                      alert('Email sent successfully!');
                      setShowReplyModal(false);
                      // Refresh contacts to update status
                      loadContacts();
                    } catch (error) {
                      console.error('Error sending email:', error);
                      const errorMessage = error.message.includes('credentials') || error.message.includes('timeout') 
                        ? 'Email service not configured. Please use "Open Email Client" instead.'
                        : 'Failed to send email: ' + error.message;
                      alert(errorMessage);
                    } finally {
                      setSendingEmail(false);
                    }
                  }}
                >
                  <i className={`fas ${sendingEmail ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
                
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    try {
                      openEmailClient(
                        selectedContact.email,
                        selectedContact.replySubject,
                        selectedContact.replyBody
                      );
                      // Show success message after a short delay
                      setTimeout(() => {
                        alert('Email client should open shortly. If it doesn\'t open, please check your browser settings or use "Copy All" to copy the email content.');
                      }, 500);
                    } catch (error) {
                      console.error('Error opening email client:', error);
                      alert('Unable to open email client. Please copy the email content and send manually.');
                    }
                  }}
                >
                  <i className="fas fa-envelope"></i>
                  Open Email Client
                </button>
                
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedContact.email);
                    alert('Email address copied to clipboard!');
                  }}
                >
                  <i className="fas fa-copy"></i>
                  Copy Email
                </button>
                
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    try {
                      const emailContent = `To: ${selectedContact.email}\nSubject: ${selectedContact.replySubject}\n\n${selectedContact.replyBody}`;
                      navigator.clipboard.writeText(emailContent);
                      alert('Email content copied to clipboard! You can now paste it into any email client.');
                    } catch (error) {
                      console.error('Error copying to clipboard:', error);
                      // Fallback: show the content in a prompt for manual copying
                      const emailContent = `To: ${selectedContact.email}\nSubject: ${selectedContact.replySubject}\n\n${selectedContact.replyBody}`;
                      prompt('Copy this email content:', emailContent);
                    }
                  }}
                >
                  <i className="fas fa-clipboard"></i>
                  Copy All
                </button>
                
                <button 
                  className="btn-secondary"
                  onClick={() => setShowReplyModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsPage;