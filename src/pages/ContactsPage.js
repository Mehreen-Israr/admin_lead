import React, { useState, useEffect } from 'react';
import { fetchContacts, archiveContact } from '../services/api';
import './ContactsPage.css';

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'

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

    </div>
  );
};

export default ContactsPage;