import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Smartphone, Mail, MessageSquare, Search, Image as ImageIcon } from 'lucide-react';
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
      setCustomers(res.data || []);
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

  const STEPS = ['Select Channel', 'Select Message', 'Select Customers', 'Confirm'];

  return (
    <div className="page-shell" style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="secondary-button" onClick={() => step > 1 ? handleBack() : navigate('/admin/campaigns')} style={{ padding: '8px', borderRadius: '50%' }}>
          <ChevronLeft size={20} />
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
            <button className="primary-button" onClick={handleNext} disabled={!channel}>Next Step</button>
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
                <button className="secondary-button" onClick={handleBack}>Back</button>
                <button className="primary-button" onClick={handleNext} disabled={!templateId}>Next Step</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 24 }}>Select Customers</h2>
          
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="text" className="form-input" placeholder="Search by name or phone..." style={{ paddingLeft: 36 }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: 150 }} value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <input type="checkbox" checked={selectedCustomerIds.size === filteredCustomers.length && filteredCustomers.length > 0} onChange={() => toggleAll(filteredCustomers)} />
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Phone</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Gender</th>
                </tr>
              </thead>
              <tbody>
                {customersLoading ? (
                  <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center' }}><PageLoader /></td></tr>
                ) : filteredCustomers.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}><input type="checkbox" checked={selectedCustomerIds.has(c.id)} onChange={() => toggleCustomer(c.id)} /></td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '12px 16px' }}>{c.phone}</td>
                    <td style={{ padding: '12px 16px' }}>{c.gender || '-'}</td>
                  </tr>
                ))}
                {!customersLoading && filteredCustomers.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
            <span style={{ fontSize: '0.9rem', color: '#475569' }}>Selected: <strong>{selectedCustomerIds.size}</strong> customers</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="secondary-button" onClick={handleBack}>Back</button>
              <button className="primary-button" onClick={handleNext} disabled={selectedCustomerIds.size === 0}>Next Step</button>
            </div>
          </div>
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
            <button className="secondary-button" onClick={handleBack} disabled={loading}>Back</button>
            <div style={{ flex: 1 }} />
            <button className="secondary-button" onClick={() => setShowTestModal(true)} disabled={loading}>Send Test Message</button>
            <button className="primary-button" onClick={() => {
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
              <button className="secondary-button" onClick={() => setShowTestModal(false)} disabled={loading}>Cancel</button>
              <button className="primary-button" onClick={submitTest} disabled={loading}>{loading ? 'Sending...' : 'Send Test'}</button>
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
              <button className="secondary-button" onClick={() => setShowConfirmModal(false)} disabled={loading}>Cancel</button>
              <button className="primary-button" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={() => {
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
