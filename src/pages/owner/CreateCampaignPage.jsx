import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Smartphone, Mail, MessageSquare, Search, Image as ImageIcon, Filter, Eye, EyeOff, Tag, X, RefreshCcw } from 'lucide-react';
import { api } from '../../api/client';
import { campaignCategories, predefinedTemplates } from '../../utils/campaignTemplates';
import PageLoader from '../../components/PageLoader';

export default function CreateCampaignPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1
  const [channel, setChannel] = useState(''); // WHATSAPP, EMAIL, SMS
  
  // Step 2
  const [category, setCategory] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateVariables, setTemplateVariables] = useState({});
  const [imageUrl, setImageUrl] = useState('');
  
  // Step 3
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [customersLoading, setCustomersLoading] = useState(false);

  // New States for Step 3 UI
  const [currentPage, setCurrentPage] = useState(1);
  const [viewSelectedOnly, setViewSelectedOnly] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const pageSize = 50;

  // Step 4
  const [campaignName, setCampaignName] = useState('');
  const [scheduleOption, setScheduleOption] = useState('now'); // 'now', 'schedule'
  const [scheduledFor, setScheduledFor] = useState('');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (step === 3 && customers.length === 0) {
      fetchCustomers();
    }
  }, [step]);

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const res = await api.get('/owner/customers');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCustomersLoading(false);
    }
  };

  const selectedTemplate = predefinedTemplates.find(t => t.id === templateId);

  const resolveContent = () => {
    if (!selectedTemplate) return '';
    let content = selectedTemplate.content;
    (selectedTemplate.variables || []).forEach(v => {
      content = content.replace(new RegExp(`\\[\\[${v}\\]\\]`, 'g'), templateVariables[v] || `[${v}]`);
    });
    return content;
  };

  const previewContent = () => {
    let content = resolveContent();
    content = content.replace(/\{\{customer_name\}\}/g, 'John Doe');
    content = content.replace(/\{\{business_name\}\}/g, 'Salon Nest');
    content = content.replace(/\{\{phone_number\}\}/g, '9876543210');
    content = content.replace(/\{\{store_link\}\}/g, 'zylu.co/salon');
    return content;
  };

  const handleNext = () => {
    if (step === 1 && !channel) return alert('Please select a channel');
    if (step === 2 && !templateId) return alert('Please select a template');
    if (step === 3 && selectedCustomerIds.size === 0) return alert('Please select at least one customer');
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const toggleCustomer = (id) => {
    const next = new Set(selectedCustomerIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCustomerIds(next);
  };

  const toggleAll = (filtered) => {
    if (selectedCustomerIds.size === filtered.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(filtered.map(c => c.id)));
    }
  };

  const submitTest = async () => {
    if (!testPhoneNumber) return alert('Enter phone number');
    setLoading(true);
    try {
      await api.post('/owner/campaigns/test', {
        channel,
        testNumber: testPhoneNumber,
        message: resolveContent(),
        imageUrl: imageUrl || null
      });
      setTestSent(true);
      setShowTestModal(false);
      alert('Test message sent!');
    } catch (err) {
      alert('Failed to send test message');
    } finally {
      setLoading(false);
    }
  };

  const submitCampaign = async () => {
    setLoading(true);
    try {
      await api.post('/owner/campaigns', {
        name: campaignName || `${selectedTemplate?.name || 'Campaign'} - ${new Date().toLocaleDateString()}`,
        type: channel,
        audienceFilter: 'SELECTED',
        audienceMeta: { selectedIds: Array.from(selectedCustomerIds) },
        message: resolveContent(),
        templateId,
        imageUrl: imageUrl || null,
        scheduledFor: scheduleOption === 'schedule' ? scheduledFor : null
      });
      navigate('/admin/campaigns');
    } catch (err) {
      alert('Failed to create campaign');
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (searchQuery && !c.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !c.phone?.includes(searchQuery)) return false;
    if (genderFilter && c.gender !== genderFilter) return false;
    return true;
  });

  const finalFilteredCustomers = viewSelectedOnly ? filteredCustomers.filter(c => selectedCustomerIds.has(c.id)) : filteredCustomers;
  const totalPages = Math.ceil(finalFilteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = finalFilteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const STEPS = ['Select Channel', 'Select Message', 'Select Customers', 'Confirm'];

  return (
    <div className="page-shell" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <style>{`
        .btn-primary-sm { padding: 8px 20px; border-radius: 8px; background: #111827; color: #fff; border: none; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .btn-primary-sm:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; }
        .btn-secondary-sm { padding: 8px 20px; border-radius: 8px; background: #fff; color: #475569; border: 1px solid #cbd5e1; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .btn-secondary-sm:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
      `}</style>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button 
          onClick={() => step > 1 ? handleBack() : navigate('/admin/campaigns')} 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer', 
            padding: 4, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#475569'
          }}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Create New Campaign</h1>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step > i + 1 ? '#10b981' : step === i + 1 ? '#4f46e5' : '#f1f5f9',
                color: step >= i + 1 ? '#fff' : '#64748b',
                fontWeight: 600, fontSize: '0.85rem'
              }}>
                {step > i + 1 ? <Check size={16} /> : (i + 1)}
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? '#0f172a' : '#64748b' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: '#e2e8f0', margin: '0 8px' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Select Delivery Channel</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Choose how you want to reach your customers.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { id: 'WHATSAPP', title: 'WhatsApp', desc: 'Send rich media messages directly to WhatsApp.', icon: Smartphone },
              { id: 'SMS', title: 'SMS', desc: 'Send standard text messages to mobile phones.', icon: MessageSquare },
              { id: 'EMAIL', title: 'Email', desc: 'Send promotional emails (Free).', icon: Mail }
            ].map(ch => (
              <div 
                key={ch.id}
                onClick={() => setChannel(ch.id)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 8, cursor: 'pointer',
                  border: channel === ch.id ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  background: channel === ch.id ? '#eef2ff' : '#fff'
                }}
              >
                <div style={{ padding: 12, borderRadius: 8, background: channel === ch.id ? '#4f46e5' : '#f1f5f9', color: channel === ch.id ? '#fff' : '#475569' }}>
                  <ch.icon size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{ch.title}</h3>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>{ch.desc}</p>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: channel === ch.id ? '6px solid #4f46e5' : '2px solid #cbd5e1' }} />
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
            <button className="btn-primary-sm" onClick={handleNext} disabled={!channel}>Next Step</button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px', background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 24 }}>Select Message</h2>
            
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.9rem' }}>Message Category</span>
              <select className="form-select" value={category} onChange={e => { setCategory(e.target.value); setTemplateId(''); }}>
                <option value="">Select Category...</option>
                {campaignCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            
            <label style={{ display: 'block', marginBottom: 24 }}>
              <span style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.9rem' }}>Message Template</span>
              <select className="form-select" value={templateId} onChange={e => setTemplateId(e.target.value)} disabled={!category}>
                <option value="">Select Template...</option>
                {predefinedTemplates.filter(t => t.category === category).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>

            {selectedTemplate && (
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 16 }}>Edit Variables</h3>
                {selectedTemplate.variables?.map(v => (
                  <div key={v} style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: 4 }}>{v.replace(/_/g, ' ').toUpperCase()}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder={`Enter ${v}`} 
                      value={templateVariables[v] || ''} 
                      onChange={e => setTemplateVariables(prev => ({ ...prev, [v]: e.target.value }))} 
                    />
                  </div>
                ))}
                {(!selectedTemplate.variables || selectedTemplate.variables.length === 0) && (
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>No editable variables in this template.</p>
                )}

                {selectedTemplate.supportsImage && channel === 'WHATSAPP' && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: 4 }}>Image URL (Optional)</label>
                    <input type="text" className="form-input" placeholder="https://..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ position: 'sticky', top: 24, background: '#f0f2f5', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', height: '100%' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone size={18} /> Live Preview
              </h3>
              <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {imageUrl && channel === 'WHATSAPP' && (
                  <div style={{ width: '100%', height: 120, background: `url(${imageUrl}) center/cover`, borderRadius: 8, marginBottom: 12, backgroundColor: '#e2e8f0' }} />
                )}
                {selectedTemplate ? previewContent() : <span style={{ color: '#94a3b8' }}>Select a template to see preview...</span>}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                <button className="btn-secondary-sm" onClick={handleBack}>Back</button>
                <button className="btn-primary-sm" onClick={handleNext} disabled={!templateId}>Next Step</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', position: 'relative' }}>
          
          {/* Top Bar matching image */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: '#f8fafc', padding: '8px 16px', borderRadius: 20, border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.85rem' }}>
              <input type="checkbox" checked={selectedCustomerIds.size === filteredCustomers.length && filteredCustomers.length > 0} onChange={() => toggleAll(filteredCustomers)} style={{ margin: 0 }} />
              Select All
            </label>
            
            <button 
              onClick={() => { setViewSelectedOnly(!viewSelectedOnly); setCurrentPage(1); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, border: '1px solid #e2e8f0', background: viewSelectedOnly ? '#f1f5f9' : '#fff', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}
            >
              {viewSelectedOnly ? <EyeOff size={16} /> : <Eye size={16} />}
              View Selected ({selectedCustomerIds.size})
            </button>
            
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, border: '1px solid #111827', background: '#111827', color: '#fff', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}
            >
              <Filter size={16} /> Filter
            </button>
            
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="text" placeholder="Search Customers" style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 20, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
            </div>
            
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}>
              <Tag size={16} /> Bulk Tagging
            </button>
          </div>

          {/* Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {customersLoading ? (
              <div style={{ padding: 48, textAlign: 'center' }}><PageLoader /></div>
            ) : paginatedCustomers.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 12 }}>No customers found.</div>
            ) : paginatedCustomers.map(c => (
              <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, background: selectedCustomerIds.has(c.id) ? '#f8fafc' : '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <input type="checkbox" checked={selectedCustomerIds.has(c.id)} onChange={() => toggleCustomer(c.id)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{c.name}</div>
                    <div style={{ color: '#475569', fontSize: '0.85rem' }}>{c.phone}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 32px', fontSize: '0.75rem', color: '#64748b' }}>
                  <div><div style={{ marginBottom: 4, fontWeight: 500 }}>Email</div><div style={{ color: '#1e293b', fontSize: '0.8rem' }}>{c.email || '--'}</div></div>
                  <div><div style={{ marginBottom: 4, fontWeight: 500 }}>Gender</div><div style={{ color: '#1e293b', fontSize: '0.8rem' }}>{c.gender || '--'}</div></div>
                  <div><div style={{ marginBottom: 4, fontWeight: 500 }}>Joined Date</div><div style={{ color: '#1e293b', fontSize: '0.8rem' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '--'}</div></div>
                  <div><div style={{ marginBottom: 4, fontWeight: 500 }}>Total Visits</div><div style={{ color: '#1e293b', fontSize: '0.8rem' }}>{c.totalVisits || 0}</div></div>
                  <div><div style={{ marginBottom: 4, fontWeight: 500 }}>Wallet Balance</div><div style={{ color: '#1e293b', fontSize: '0.8rem' }}>₹{c.walletBalance || '0.00'}</div></div>
                  <div><div style={{ marginBottom: 4, fontWeight: 500 }}>Total Sales value</div><div style={{ color: '#1e293b', fontSize: '0.8rem' }}>₹{c.totalRevenue || '0.00'}</div></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Bottom Bar matching image */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
            <button 
              onClick={handleBack}
              style={{ padding: '10px 24px', borderRadius: 24, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
            >
              Back
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.85rem', color: '#64748b' }}>
              <span>Showing {paginatedCustomers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, finalFilteredCustomers.length)} of {finalFilteredCustomers.length} customers</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ padding: '4px 12px', background: '#f1f5f9', borderRadius: 12 }}>{pageSize} per page</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: 6, border: 'none', background: 'transparent', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}><ChevronLeft size={16} /></button>
                <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111827', color: '#fff', borderRadius: 6, fontSize: '0.85rem' }}>{currentPage}</div>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: 6, border: 'none', background: 'transparent', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}><ChevronRight size={16} /></button>
              </div>
            </div>

            <button 
              onClick={handleNext} 
              disabled={selectedCustomerIds.size === 0}
              style={{ padding: '10px 24px', borderRadius: 24, border: 'none', background: selectedCustomerIds.size === 0 ? '#94a3b8' : '#111827', color: '#fff', cursor: selectedCustomerIds.size === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
            >
              Save and Next
            </button>
          </div>

          {/* Filter Modal Overlay */}
          {isFilterModalOpen && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.8)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 60 }}>
              <div style={{ width: 400, background: '#fff', borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Filters</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => { setGenderFilter(''); setSearchQuery(''); setIsFilterModalOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 12px', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <RefreshCcw size={12} /> Reset Filters
                    </button>
                    <button onClick={() => setIsFilterModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
                  </div>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>Gender</label>
                  <select className="form-select" style={{ width: '100%' }} value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                  <button onClick={() => setIsFilterModalOpen(false)} style={{ background: '#111827', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 24, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 24 }}>Review & Confirm</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8 }}>
              <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Channel</h3>
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{channel}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8 }}>
              <h3 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Recipients</h3>
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedCustomerIds.size} Customers</p>
            </div>
          </div>

          <label style={{ display: 'block', marginBottom: 24 }}>
            <span style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.9rem' }}>Campaign Name (Internal)</span>
            <input type="text" className="form-input" placeholder="e.g. Diwali Blast 2026" value={campaignName} onChange={e => setCampaignName(e.target.value)} />
          </label>

          <div style={{ marginBottom: 32 }}>
            <span style={{ display: 'block', marginBottom: 12, fontWeight: 500, fontSize: '0.9rem' }}>When to send?</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="radio" checked={scheduleOption === 'now'} onChange={() => setScheduleOption('now')} /> Send Immediately
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="radio" checked={scheduleOption === 'schedule'} onChange={() => setScheduleOption('schedule')} /> Schedule for later
              </label>
            </div>
            {scheduleOption === 'schedule' && (
              <input type="datetime-local" className="form-input" style={{ marginTop: 12, maxWidth: 250 }} value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} />
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
            <button className="btn-secondary-sm" onClick={handleBack} disabled={loading}>Back</button>
            <div style={{ flex: 1 }} />
            <button className="btn-secondary-sm" onClick={() => setShowTestModal(true)} disabled={loading}>Send Test Message</button>
            <button className="btn-primary-sm" onClick={() => {
              if (!testSent) setShowConfirmModal(true);
              else submitCampaign();
            }} disabled={loading}>
              {loading ? 'Processing...' : 'Confirm & Send'}
            </button>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Send Test Message</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 16 }}>Enter a phone number (or email) to receive a preview of this campaign.</p>
            <input type="text" className="form-input" placeholder="e.g. 9876543210" value={testPhoneNumber} onChange={e => setTestPhoneNumber(e.target.value)} style={{ marginBottom: 24 }} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-secondary-sm" onClick={() => setShowTestModal(false)} disabled={loading}>Cancel</button>
              <button className="btn-primary-sm" onClick={submitTest} disabled={loading}>{loading ? 'Sending...' : 'Send Test'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, color: '#b91c1c' }}>Send Without Testing?</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: 24 }}>You haven't sent a test message to verify the formatting. Are you sure you want to send this campaign to {selectedCustomerIds.size} customers?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-secondary-sm" onClick={() => setShowConfirmModal(false)} disabled={loading}>Cancel</button>
              <button className="btn-primary-sm" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={() => {
                setShowConfirmModal(false);
                submitCampaign();
              }} disabled={loading}>
                {loading ? 'Sending...' : 'Yes, Send Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
