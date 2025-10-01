import React, { useEffect, useMemo, useState } from 'react';
import { fetchPackages, createPackage, updatePackage, deletePackage } from '../services/api';
import './ContactsPage.css';
import './SubscriptionsPage.css';

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
  // pricing object with new plan structure
  pricing: { 
    currency: 'USD', 
    amount: '', 
    discount: '', 
    popular: false, 
    trialDays: 0,
    // New pricing plans
    monthly: { amount: '', discount: '' },
    quarterly: { amount: '', discount: '10%', autoCalculated: true },
    yearly: { amount: '', discount: '20%', autoCalculated: true }
  },
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

  // Function to calculate quarterly and yearly prices based on monthly price
  const calculatePrices = (monthlyPrice) => {
    if (!monthlyPrice || monthlyPrice <= 0) return { quarterly: 0, yearly: 0 };
    
    const quarterlyBase = monthlyPrice * 3;
    const yearlyBase = monthlyPrice * 12;
    
    return {
      quarterly: Math.round(quarterlyBase * 0.9), // 10% discount
      yearly: Math.round(yearlyBase * 0.8) // 20% discount
    };
  };

  // Function to handle monthly price change and auto-calculate other prices
  const handleMonthlyPriceChange = (value) => {
    const monthlyPrice = parseFloat(value) || 0;
    const calculated = calculatePrices(monthlyPrice);
    
    setForm(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        monthly: { ...prev.pricing.monthly, amount: value },
        // Auto-update quarterly if it's set to auto-calculate
        quarterly: prev.pricing.quarterly.autoCalculated ? {
          ...prev.pricing.quarterly,
          amount: calculated.quarterly.toString()
        } : prev.pricing.quarterly,
        // Auto-update yearly if it's set to auto-calculate
        yearly: prev.pricing.yearly.autoCalculated ? {
          ...prev.pricing.yearly,
          amount: calculated.yearly.toString()
        } : prev.pricing.yearly
      }
    }));
  };

  // Function to toggle auto-calculation for quarterly/yearly
  const toggleAutoCalculation = (plan) => {
    setForm(prev => {
      const updatedPricing = { ...prev.pricing };
      const monthlyPrice = parseFloat(prev.pricing.monthly.amount) || 0;
      const calculated = calculatePrices(monthlyPrice);
      
      if (plan === 'quarterly') {
        updatedPricing.quarterly = {
          ...updatedPricing.quarterly,
          autoCalculated: !updatedPricing.quarterly.autoCalculated,
          amount: !updatedPricing.quarterly.autoCalculated ? calculated.quarterly.toString() : updatedPricing.quarterly.amount
        };
      } else if (plan === 'yearly') {
        updatedPricing.yearly = {
          ...updatedPricing.yearly,
          autoCalculated: !updatedPricing.yearly.autoCalculated,
          amount: !updatedPricing.yearly.autoCalculated ? calculated.yearly.toString() : updatedPricing.yearly.amount
        };
      }
      
      return { ...prev, pricing: updatedPricing };
    });
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
        trialDays: pkg.pricing?.trialDays ?? 0,
        // New pricing plans
        monthly: {
          amount: pkg.pricing?.monthly?.amount ?? (pkg.pricing?.amount ?? pkg.price ?? ''),
          discount: pkg.pricing?.monthly?.discount || ''
        },
        quarterly: {
          amount: pkg.pricing?.quarterly?.amount ?? '',
          discount: pkg.pricing?.quarterly?.discount || '10%',
          autoCalculated: pkg.pricing?.quarterly?.autoCalculated !== false
        },
        yearly: {
          amount: pkg.pricing?.yearly?.amount ?? '',
          discount: pkg.pricing?.yearly?.discount || '20%',
          autoCalculated: pkg.pricing?.yearly?.autoCalculated !== false
        }
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
    
    // Check pricing.amount since that's what the form uses
    const hasPrice = form.pricing.amount && form.pricing.amount !== '';
    console.log('Form price validation:', { 
      pricingAmount: form.pricing.amount, 
      hasPrice 
    });
    if (!hasPrice) {
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
        price: form.pricing.amount !== '' ? Number(form.pricing.amount) : (form.price !== '' ? Number(form.price) : 0),
        currency: form.pricing.currency || form.currency,
        pricing: {
          currency: form.pricing.currency,
          amount: form.pricing.monthly.amount !== '' ? Number(form.pricing.monthly.amount) : 0,
          discount: form.pricing.discount,
          popular: !!form.pricing.popular,
          trialDays: Number(form.pricing.trialDays || 0),
          // New pricing plans
          monthly: {
            amount: form.pricing.monthly.amount !== '' ? Number(form.pricing.monthly.amount) : 0,
            discount: form.pricing.monthly.discount || ''
          },
          quarterly: {
            amount: form.pricing.quarterly.amount !== '' ? Number(form.pricing.quarterly.amount) : 0,
            discount: form.pricing.quarterly.discount || '10%',
            autoCalculated: !!form.pricing.quarterly.autoCalculated
          },
          yearly: {
            amount: form.pricing.yearly.amount !== '' ? Number(form.pricing.yearly.amount) : 0,
            discount: form.pricing.yearly.discount || '20%',
            autoCalculated: !!form.pricing.yearly.autoCalculated
          }
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
                  <div className="contact-actions" style={{justifyContent:'space-between', alignItems:'flex-start', minHeight:'60px'}}>
                    <div style={{display:'flex',gap:'8px', flexWrap:'wrap'}}>
                      <button className="refresh-btn" onClick={() => startEdit(pkg)}>
                        <i className="fas fa-pen" /> Edit
                      </button>
                      <button 
                        className="refresh-btn" 
                        style={{
                          borderColor:'#dc2626', 
                          color:'#ffffff',
                          backgroundColor:'#dc2626',
                          minWidth:'80px',
                          display:'flex',
                          alignItems:'center',
                          justifyContent:'center',
                          fontWeight:'600'
                        }} 
                        onClick={() => onDelete(pkg._id)}
                      >
                        <i className="fas fa-trash" /> Delete
                      </button>
                    </div>
                    <div style={{opacity:0.85,fontSize:'0.85rem',color:'var(--text-tertiary)', marginTop:'8px'}}>
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
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{editingId ? 'Edit Package' : 'Create Package'}</h3>
            <form onSubmit={onSubmit}>
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
              {/* Pricing Plans Section */}
              <div className="pricing-section">
                <h4>Pricing Plans</h4>
                
                {/* Currency */}
                <div>
                  <label>Currency</label>
                  <input 
                    className="search-input" 
                    placeholder="Currency (e.g., USD)" 
                    value={form.pricing.currency} 
                    onChange={(e)=>setForm({...form,pricing:{...form.pricing,currency:e.target.value}})} 
                  />
                </div>

                {/* Monthly Plan */}
                <div className="pricing-plan">
                  <div className="plan-header">
                    <h5>Monthly Plan</h5>
                    <span className="plan-badge">Base Price</span>
                  </div>
                  <div className="form-row">
                    <input 
                      className="search-input" 
                      type="number" 
                      step="0.01" 
                      placeholder="Monthly Price" 
                      value={form.pricing.monthly.amount} 
                      onChange={(e) => handleMonthlyPriceChange(e.target.value)} 
                    />
                    <input 
                      className="search-input" 
                      placeholder="Discount (e.g., 10% OFF)" 
                      value={form.pricing.monthly.discount} 
                      onChange={(e)=>setForm({...form,pricing:{...form.pricing,monthly:{...form.pricing.monthly,discount:e.target.value}}})} 
                    />
                  </div>
                </div>

                {/* Quarterly Plan */}
                <div className="pricing-plan">
                  <div className="plan-header">
                    <h5>Quarterly Plan (3 months)</h5>
                    <div className="plan-controls">
                      <span className="plan-badge">10% OFF</span>
                      <div className="checkbox-group">
                        <input 
                          type="checkbox" 
                          checked={form.pricing.quarterly.autoCalculated} 
                          onChange={() => toggleAutoCalculation('quarterly')} 
                        />
                        <label>Auto-calculate</label>
                      </div>
                    </div>
                  </div>
                  <div className="form-row">
                    <input 
                      className="search-input" 
                      type="number" 
                      step="0.01" 
                      placeholder="Quarterly Price" 
                      value={form.pricing.quarterly.amount} 
                      onChange={(e)=>setForm({...form,pricing:{...form.pricing,quarterly:{...form.pricing.quarterly,amount:e.target.value,autoCalculated:false}}})} 
                      disabled={form.pricing.quarterly.autoCalculated}
                    />
                    <input 
                      className="search-input" 
                      placeholder="Discount" 
                      value={form.pricing.quarterly.discount} 
                      onChange={(e)=>setForm({...form,pricing:{...form.pricing,quarterly:{...form.pricing.quarterly,discount:e.target.value}}})} 
                    />
                  </div>
                </div>

                {/* Yearly Plan */}
                <div className="pricing-plan">
                  <div className="plan-header">
                    <h5>Yearly Plan (12 months)</h5>
                    <div className="plan-controls">
                      <span className="plan-badge">20% OFF</span>
                      <div className="checkbox-group">
                        <input 
                          type="checkbox" 
                          checked={form.pricing.yearly.autoCalculated} 
                          onChange={() => toggleAutoCalculation('yearly')} 
                        />
                        <label>Auto-calculate</label>
                      </div>
                    </div>
                  </div>
                  <div className="form-row">
                    <input 
                      className="search-input" 
                      type="number" 
                      step="0.01" 
                      placeholder="Yearly Price" 
                      value={form.pricing.yearly.amount} 
                      onChange={(e)=>setForm({...form,pricing:{...form.pricing,yearly:{...form.pricing.yearly,amount:e.target.value,autoCalculated:false}}})} 
                      disabled={form.pricing.yearly.autoCalculated}
                    />
                    <input 
                      className="search-input" 
                      placeholder="Discount" 
                      value={form.pricing.yearly.discount} 
                      onChange={(e)=>setForm({...form,pricing:{...form.pricing,yearly:{...form.pricing.yearly,discount:e.target.value}}})} 
                    />
                  </div>
                </div>

                {/* Additional Options */}
                <div className="form-row">
                  <div className="checkbox-group">
                    <input type="checkbox" checked={form.pricing.popular} onChange={(e)=>setForm({...form,pricing:{...form.pricing,popular:e.target.checked}})} />
                    <label>Popular Package</label>
                  </div>
                  <input className="search-input" type="number" placeholder="Trial Days" value={form.pricing.trialDays} onChange={(e)=>setForm({...form,pricing:{...form.pricing,trialDays:e.target.value}})} />
                </div>
              </div>
              <div>
                <label>Image URL (optional, fallback)</label>
                <input className="search-input" value={form.imageUrl} onChange={(e)=>setForm({...form,imageUrl:e.target.value})} />
              </div>
              <div className="checkbox-group">
                <input id="isActive" type="checkbox" checked={form.isActive} onChange={(e)=>setForm({...form,isActive:e.target.checked})} />
                <label htmlFor="isActive">Active</label>
              </div>
              <div>
                <label>Sort Order</label>
                <input className="search-input" type="number" value={form.sortOrder} onChange={(e)=>setForm({...form,sortOrder:e.target.value})} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={()=>setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;


