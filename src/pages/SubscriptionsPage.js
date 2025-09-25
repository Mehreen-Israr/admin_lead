import React, { useEffect, useMemo, useState } from 'react';
import { fetchPackages, createPackage, updatePackage, deletePackage } from '../services/api';
import './ContactsPage.css';

const defaultForm = {
  name: '',
  platform: '',
  description: '',
  features: '',
  logo: '',
  // legacy UI fields (kept hidden but supported)
  benefits: '',
  price: '',
  currency: 'USD',
  imageUrl: '',
  // pricing object
  pricing: { currency: 'USD', amount: '', discount: '', popular: false, trialDays: 0 },
  isActive: true,
  sortOrder: 0
};

const SubscriptionsPage = () => {
  const [packagesList, setPackagesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await fetchPackages();
      setPackagesList(data);
      setError('');
    } catch (e) {
      console.error(e);
      setError('Failed to load packages.');
    } finally {
      setLoading(false);
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const startEdit = (pkg) => {
    setEditingId(pkg._id);
    setForm({
      name: pkg.name || '',
      platform: pkg.platform || '',
      description: pkg.description || '',
      features: Array.isArray(pkg.features) ? pkg.features.join(', ') : '',
      logo: pkg.logo || pkg.imageUrl || '',
      benefits: Array.isArray(pkg.benefits) ? pkg.benefits.join(', ') : '',
      price: pkg.price ?? (pkg.pricing?.amount ?? ''),
      currency: pkg.currency || pkg.pricing?.currency || 'USD',
      imageUrl: pkg.imageUrl || pkg.logo || '',
      pricing: {
        currency: pkg.pricing?.currency || 'USD',
        amount: pkg.pricing?.amount ?? (pkg.price ?? ''),
        discount: pkg.pricing?.discount || '',
        popular: pkg.pricing?.popular || false,
        trialDays: pkg.pricing?.trialDays ?? 0
      },
      isActive: pkg.isActive !== false,
      sortOrder: pkg.sortOrder ?? 0
    });
    setShowForm(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form.name.trim()) {
      alert('Package name is required');
      return;
    }
    
    if (!form.price || form.price === '') {
      alert('Price is required');
      return;
    }
    
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        platform: form.platform,
        description: form.description,
        features: form.features.split(',').map((b) => b.trim()).filter(Boolean),
        logo: form.logo,
        benefits: form.benefits.split(',').map((b) => b.trim()).filter(Boolean),
        imageUrl: form.imageUrl,
        // keep both structures to match backend compatibility
        price: form.price !== '' ? Number(form.price) : 0,
        currency: form.currency,
        pricing: {
          currency: form.pricing.currency,
          amount: form.pricing.amount !== '' ? Number(form.pricing.amount) : (form.price !== '' ? Number(form.price) : 0),
          discount: form.pricing.discount,
          popular: !!form.pricing.popular,
          trialDays: Number(form.pricing.trialDays || 0)
        },
        isActive: !!form.isActive,
        sortOrder: Number(form.sortOrder || 0)
      };
      if (editingId) {
        await updatePackage(editingId, payload);
      } else {
        await createPackage(payload);
      }
      setShowForm(false);
      await loadPackages();
    } catch (e) {
      console.error('Error saving package:', e);
      alert(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    try {
      await deletePackage(id);
      await loadPackages();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return packagesList.filter((p) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }, [packagesList, searchTerm]);

  return (
    <div className="contacts-page">
      <div className="contacts-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="contacts-title"><span className="title-gradient">Subscriptions</span> Packages</h1>
            <p className="contacts-subtitle">Manage all subscription packages fetched from the database.</p>
          </div>
          <div className="header-actions">
            <button className="refresh-btn" onClick={startCreate}>
              <i className="fas fa-plus" /> New Package
            </button>
            <button className="refresh-btn" onClick={loadPackages}>
              <i className="fas fa-rotate" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="contacts-controls">
        <div className="search-container">
          <i className="fas fa-magnifying-glass search-icon" />
          <input
            className="search-input"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="error-banner"><i className="fas fa-triangle-exclamation" /> {error}</div>
      )}

      {loading ? (
        <div className="contacts-loading">
          <div className="loading-container">
            <div className="loading-spinner" />
            <div className="loading-text">Loading packages...</div>
          </div>
        </div>
      ) : (
        <div className="contacts-content">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><i className="fas fa-box" /></div>
              <h3 className="empty-title">No packages found</h3>
              <p className="empty-description">Try adjusting your search or create a new package.</p>
              <button className="action-btn btn-primary" onClick={startCreate}>Create Package</button>
            </div>
          ) : (
            <div className="contacts-grid">
              {filtered.map((pkg) => (
                <div key={pkg._id} className="contact-card">
                  <div className="contact-header">
                    <div className="contact-avatar">
                      <i className="fas fa-box" />
                    </div>
                    <div className="contact-basic-info">
                      <div className="contact-name">{pkg.name}</div>
                      <div className="contact-date">{(pkg.pricing?.currency || pkg.currency || 'USD')} {Number((pkg.pricing?.amount ?? pkg.price ?? 0)).toFixed(2)}</div>
                    </div>
                    <div className="contact-status">
                      <span className={`status-badge ${pkg.isActive ? 'status-new' : ''}`}>{pkg.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div className="contact-details">
                    <div className="contact-info">
                      <div className="info-item">
                        <div className="info-icon"><i className="fas fa-align-left" /></div>
                        <div className="info-content">
                          <span className="info-label">Description</span>
                          <span className="info-value">{pkg.description || '-'}</span>
                        </div>
                      </div>
                      <div className="info-item">
                        <div className="info-icon"><i className="fas fa-tag" /></div>
                        <div className="info-content">
                          <span className="info-label">Platform</span>
                          <span className="info-value">{pkg.platform || '-'}</span>
                        </div>
                      </div>
                      <div className="info-item">
                        <div className="info-icon"><i className="fas fa-list-check" /></div>
                        <div className="info-content">
                          <span className="info-label">Features</span>
                          <span className="info-value">{(pkg.features || pkg.benefits || []).join(', ') || '-'}</span>
                        </div>
                      </div>
                      {(pkg.logo || pkg.imageUrl) && (
                        <div className="info-item">
                          <div className="info-icon"><i className="fas fa-image" /></div>
                          <div className="info-content">
                            <span className="info-label">Image</span>
                            <span className="info-value"><a className="email-link" href={pkg.logo || pkg.imageUrl} target="_blank" rel="noreferrer">View image</a></span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="contact-actions" style={{justifyContent:'space-between'}}>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button className="refresh-btn" onClick={() => startEdit(pkg)}>
                        <i className="fas fa-pen" /> Edit
                      </button>
                      <button className="refresh-btn" style={{borderColor:'rgba(239,68,68,0.35)', color:'#f87171'}} onClick={() => onDelete(pkg._id)}>
                        <i className="fas fa-trash" /> Delete
                      </button>
                    </div>
                    <div style={{opacity:0.85,fontSize:'0.85rem',color:'var(--text-tertiary)'}}>
                      <i className="fas fa-clock" /> Updated {new Date(pkg.updatedAt || pkg.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-start',justifyContent:'center',zIndex:1000,overflowY:'auto',padding:'32px 16px'}}>
          <div className="modal-card" style={{background:'var(--bg-card)',border:'1px solid var(--border-primary)',borderRadius:'12px',padding:'24px',width:'min(680px, 92vw)',maxHeight:'90vh',overflowY:'auto'}}>
            <h3 style={{marginTop:0}}>{editingId ? 'Edit Package' : 'Create Package'}</h3>
            <form onSubmit={onSubmit} style={{display:'grid',gap:'12px'}}>
              <div>
                <label>Name</label>
                <input className="search-input" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required />
              </div>
              <div>
                <label>Platform</label>
                <input className="search-input" value={form.platform} onChange={(e)=>setForm({...form,platform:e.target.value})} />
              </div>
              <div>
                <label>Description</label>
                <textarea className="search-input" rows={3} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} />
              </div>
              <div>
                <label>Features (comma separated)</label>
                <input className="search-input" value={form.features} onChange={(e)=>setForm({...form,features:e.target.value})} />
              </div>
              <div>
                <label>Logo URL</label>
                <input className="search-input" value={form.logo} onChange={(e)=>setForm({...form,logo:e.target.value})} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 120px',gap:'12px'}}>
                <input className="search-input" type="number" step="0.01" placeholder="Price" value={form.pricing.amount} onChange={(e)=>setForm({...form,pricing:{...form.pricing,amount:e.target.value}})} />
                <input className="search-input" placeholder="Currency" value={form.pricing.currency} onChange={(e)=>setForm({...form,pricing:{...form.pricing,currency:e.target.value}})} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
                <input className="search-input" placeholder="Discount (e.g. 40% OFF)" value={form.pricing.discount} onChange={(e)=>setForm({...form,pricing:{...form.pricing,discount:e.target.value}})} />
                <label style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <input type="checkbox" checked={form.pricing.popular} onChange={(e)=>setForm({...form,pricing:{...form.pricing,popular:e.target.checked}})} /> Popular
                </label>
                <input className="search-input" type="number" placeholder="Trial Days" value={form.pricing.trialDays} onChange={(e)=>setForm({...form,pricing:{...form.pricing,trialDays:e.target.value}})} />
              </div>
              <div>
                <label>Image URL (optional, fallback)</label>
                <input className="search-input" value={form.imageUrl} onChange={(e)=>setForm({...form,imageUrl:e.target.value})} />
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <input id="isActive" type="checkbox" checked={form.isActive} onChange={(e)=>setForm({...form,isActive:e.target.checked})} />
                <label htmlFor="isActive">Active</label>
              </div>
              <div>
                <label>Sort Order</label>
                <input className="search-input" type="number" value={form.sortOrder} onChange={(e)=>setForm({...form,sortOrder:e.target.value})} />
              </div>
              <div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'8px'}}>
                <button type="button" className="action-btn btn-tertiary" onClick={()=>setShowForm(false)}>Cancel</button>
                <button type="submit" className="action-btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;


