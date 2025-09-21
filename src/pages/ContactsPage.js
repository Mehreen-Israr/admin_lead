import React, { useState, useEffect } from 'react';
import { fetchContacts } from '../services/api';
import './ContactsPage.css';

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

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

  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="contacts-page">
      <div className="page-header">
        <h1>Contact Form Submissions</h1>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{contacts.length}</span>
            <span className="stat-label">Total Contacts</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{contacts.filter(c => new Date(c.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length}</span>
            <span className="stat-label">This Week</span>
          </div>
        </div>
      </div>

      <div className="page-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search contacts by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="refresh-btn" onClick={loadContacts}>
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
                <button className="btn-reply">Reply</button>
                <button className="btn-archive">Archive</button>
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