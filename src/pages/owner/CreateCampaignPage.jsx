import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Smartphone, Mail, MessageSquare, Search, Image as ImageIcon, Filter, Eye, EyeOff, Tag, X, RefreshCcw, Save, Zap, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import CustomSelect from '../../components/CustomSelect';
import { campaignCategories, predefinedTemplates } from '../../utils/campaignTemplates';
import PageLoader from '../../components/PageLoader';

export default function CreateCampaignPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const draft = location.state?.draft || null;
  const draftMeta = draft?.audienceMeta?.draftState || {};

  const [draftId, setDraftId] = useState(draft?.id || null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1
  const [channel, setChannel] = useState(draft?.type || ''); 
  
  // Step 2
  const [category, setCategory] = useState(draftMeta.category || '');
  const [templateId, setTemplateId] = useState(draftMeta.templateId || '');
  const [templateVariables, setTemplateVariables] = useState(draftMeta.templateVariables || {});
  const [imageUrl, setImageUrl] = useState(draft?.bannerUrl || '');
  
  // Step 3
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState(new Set(draftMeta.selectedIds || []));
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [customersLoading, setCustomersLoading] = useState(false);

  // New States for Step 3 UI
  const [currentPage, setCurrentPage] = useState(1);
  const [viewSelectedOnly, setViewSelectedOnly] = useState(false);
  
  // Bulk Tagging
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [bulkTags, setBulkTags] = useState("");
  const [bulkTaggingBusy, setBulkTaggingBusy] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const pageSize = 50;

  // Step 4
  const [campaignName, setCampaignName] = useState(draft?.name && draft.name !== 'Untitled Draft' ? draft.name : '');
  const [scheduleOption, setScheduleOption] = useState(draft?.scheduledFor ? 'schedule' : 'now'); 
  const [scheduledFor, setScheduledFor] = useState(draft?.scheduledFor ? new Date(draft.scheduledFor).toISOString().slice(0, 16) : '');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [showTestSuggestions, setShowTestSuggestions] = useState(false);
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
    if (step === 2) {
      if (!templateId) return alert('Please select a template');
      const selectedTpl = predefinedTemplates.find(t => t.id === templateId);
      if (selectedTpl?.variables?.length > 0) {
        for (const v of selectedTpl.variables) {
          if (!templateVariables[v] || !templateVariables[v].trim()) {
            return alert(`Please fill the variable: ${v.replace(/_/g, ' ').toUpperCase()}`);
          }
        }
      }
    }
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
        id: draftId,
        name: campaignName || `${selectedTemplate?.name || 'Campaign'} - ${new Date().toLocaleDateString()}`,
        type: channel,
        audienceFilter: 'SELECTED',
        audienceMeta: { 
          selectedIds: Array.from(selectedCustomerIds),
          draftState: { category, templateId, templateVariables } 
        },
        message: resolveContent(),
        imageUrl: imageUrl || null,
        scheduledFor: scheduleOption === 'schedule' ? scheduledFor : null
      });
      navigate('/admin/campaigns');
    } catch (err) {
      alert('Failed to create campaign');
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    setLoading(true);
    try {
      const res = await api.post('/owner/campaigns', {
        id: draftId,
        isDraft: true,
        name: campaignName || (selectedTemplate?.name ? `${selectedTemplate.name} - Draft` : 'Untitled Draft'),
        type: channel,
        audienceFilter: 'SELECTED',
        audienceMeta: { 
          selectedIds: Array.from(selectedCustomerIds),
          draftState: { category, templateId, templateVariables } 
        },
        message: resolveContent(),
        imageUrl: imageUrl || null,
        scheduledFor: scheduleOption === 'schedule' ? scheduledFor : null
      });
      if (res.data?.id) setDraftId(res.data.id);
      alert('Draft saved successfully!');
    } catch (err) {
      alert('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkTagClick = () => {
    if (selectedCustomerIds.size === 0) { alert('Please select customers first'); return; }
    setShowBulkTagModal(true);
  };

  const submitBulkTags = async () => {
    if (!bulkTags.trim()) { alert('Please enter tags'); return; }
    setBulkTaggingBusy(true);
    try {
      const tags = bulkTags.split(',').map(t => t.trim()).filter(Boolean);
      await api.post('/owner/customers/bulk-tag', { customerIds: Array.from(selectedCustomerIds), tags });
      alert(`Tags applied to ${selectedCustomerIds.size} customers`);
      setShowBulkTagModal(false);
      setBulkTags("");
    } catch (err) {
      alert('Failed to apply tags');
    } finally {
      setBulkTaggingBusy(false);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => step > 1 ? handleBack() : navigate('/admin/campaigns')} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              padding: 4, 
              display: 'flex', 
              background: '#f1f5f9', 
              borderRadius: 8 
            }}
          >
            <ChevronLeft size={24} />
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{draftId ? 'Edit Draft Campaign' : 'Create New Campaign'}</h1>
        </div>
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
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '32px 32px 48px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>Select Delivery Channel</h2>
            <p style={{ color: '#64748b', marginBottom: 32, fontSize: '0.95rem' }}>Choose how you want to reach your customers.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              {[
                { id: 'WHATSAPP', title: 'WhatsApp', desc: 'Send rich media messages directly to WhatsApp.', icon: Smartphone },
                { id: 'SMS', title: 'SMS', desc: 'Send standard text messages to mobile phones.', icon: MessageSquare },
                { id: 'EMAIL', title: 'Email', desc: 'Send promotional emails (Free).', icon: Mail }
              ].map(ch => (
                <div 
                  key={ch.id}
                  onClick={() => setChannel(ch.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 12, cursor: 'pointer',
                    border: channel === ch.id ? '2px solid #0f172a' : '1px solid #e2e8f0',
                    background: channel === ch.id ? '#f8fafc' : '#fff',
                    transition: 'all 0.2s',
                    boxShadow: channel === ch.id ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <div style={{ padding: 12, borderRadius: 10, background: channel === ch.id ? '#0f172a' : '#f1f5f9', color: channel === ch.id ? '#fff' : '#475569' }}>
                    <ch.icon size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>{ch.title}</h3>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>{ch.desc}</p>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: channel === ch.id ? '6px solid #0f172a' : '2px solid #cbd5e1', background: '#fff' }} />
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ padding: '20px 32px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', background: '#f8fafc', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
            <button className="btn-primary-sm" onClick={handleNext} disabled={!channel}>Next Step</button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '32px 32px 48px', display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            {/* Left Side: Setup */}
            <div style={{ flex: '1 1 400px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>Select Message</h2>
              <p style={{ color: '#64748b', marginBottom: 32, fontSize: '0.95rem' }}>Choose a template and customize the content.</p>
              
              <div style={{ display: 'grid', gap: 24 }}>
                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>Message Category</span>
                  <CustomSelect value={category} onChange={e => { setCategory(e.target.value); setTemplateId(''); }} placeholder="Select Category...">
                    <option value="">Select Category...</option>
                    {campaignCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </CustomSelect>
                </label>
                
                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>Message Template</span>
                  <div style={{ opacity: !category ? 0.5 : 1, pointerEvents: !category ? 'none' : 'auto' }}>
                    <CustomSelect value={templateId} onChange={e => setTemplateId(e.target.value)} placeholder="Select Template..." disabled={!category}>
                      <option value="">Select Template...</option>
                      {predefinedTemplates.filter(t => t.category === category).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </CustomSelect>
                  </div>
                </label>

                {selectedTemplate && (
                  <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', marginTop: 8 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 20, color: '#0f172a' }}>Customize Variables</h3>
                    {selectedTemplate.variables?.length > 0 ? (
                      <div style={{ display: 'grid', gap: 16 }}>
                        {selectedTemplate.variables.map(v => (
                          <div key={v}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#475569', marginBottom: 6 }}>{v.replace(/_/g, ' ').toUpperCase()}</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder={`Enter ${v.replace(/_/g, ' ')}`} 
                              style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                              value={templateVariables[v] || ''} 
                              onChange={e => setTemplateVariables(prev => ({ ...prev, [v]: e.target.value }))} 
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, fontStyle: 'italic' }}>No variables needed for this template.</p>
                    )}

                    {selectedTemplate.supportsImage && channel === 'WHATSAPP' && (
                      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#475569', marginBottom: 6 }}>Hero Image URL (Optional)</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <ImageIcon size={20} color="#94a3b8" style={{ alignSelf: 'center' }} />
                          <input type="text" className="form-input" style={{ flex: 1, padding: '10px 14px', borderRadius: 6, border: '1px solid #cbd5e1' }} placeholder="https://example.com/image.jpg" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Side: Phone Mockup Preview */}
            <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ 
                width: 320, 
                height: 600, 
                background: '#f1f5f9', 
                borderRadius: 40, 
                border: '12px solid #0f172a', 
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
              }}>
                {/* Phone Notch */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 24, background: '#0f172a', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }} />
                
                {/* Header */}
                <div style={{ background: channel === 'WHATSAPP' ? '#075E54' : '#f8fafc', color: channel === 'WHATSAPP' ? '#fff' : '#0f172a', padding: '40px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, borderBottom: channel === 'WHATSAPP' ? 'none' : '1px solid #e2e8f0' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: channel === 'WHATSAPP' ? '#fff' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: channel === 'WHATSAPP' ? '#075E54' : '#475569' }}>
                    {channel === 'WHATSAPP' ? 'B' : channel === 'EMAIL' ? <Mail size={18} /> : <MessageSquare size={18} />}
                  </div>
                  <span>{channel === 'WHATSAPP' ? 'WhatsApp Preview' : channel === 'EMAIL' ? 'Email Preview' : 'SMS Preview'}</span>
                </div>

                {/* Chat Body */}
                <div style={{ padding: 16, height: 'calc(100% - 88px)', overflowY: 'auto', background: channel === 'WHATSAPP' ? '#efeae2' : '#f8fafc', backgroundImage: channel === 'WHATSAPP' ? 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' : 'none', backgroundSize: 'cover' }}>
                  
                  {!selectedTemplate ? (
                    <div style={{ background: channel === 'WHATSAPP' ? 'rgba(255,255,255,0.9)' : '#fff', padding: '16px', borderRadius: 16, textAlign: 'center', fontSize: '0.85rem', color: '#475569', marginTop: 40, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      Select a template to preview your message here.
                    </div>
                  ) : (
                    <div style={{ background: channel === 'WHATSAPP' ? '#dcf8c6' : channel === 'EMAIL' ? '#ffffff' : '#e2e8f0', padding: 12, borderRadius: 12, borderTopLeftRadius: channel === 'EMAIL' ? 12 : 0, boxShadow: '0 1px 2px rgba(0,0,0,0.1)', maxWidth: channel === 'EMAIL' ? '100%' : '92%', marginBottom: 16 }}>
                      {imageUrl && channel === 'WHATSAPP' && (
                        <div style={{ width: '100%', height: 140, background: `url(${imageUrl}) center/cover`, borderRadius: 8, marginBottom: 8, backgroundColor: '#cbd5e1' }} />
                      )}
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: '1.4', color: '#111827' }}>
                        {previewContent()}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.65rem', color: '#64748b', marginTop: 6 }}>10:42 AM</div>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
          
          {/* Bottom Action Bar */}
          <div style={{ padding: '20px 32px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
            <button className="btn-secondary-sm" onClick={handleBack}>Back</button>
            <button className="btn-primary-sm" onClick={handleNext} disabled={!templateId}>Next Step</button>
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
            
            <button type="button" onClick={handleBulkTagClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}>
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
                  <CustomSelect value={genderFilter} onChange={e => setGenderFilter(e.target.value)} placeholder="All Genders">
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </CustomSelect>
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
      {/* Bulk Tagging Modal */}
      {showBulkTagModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 400, maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Bulk Tagging</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#64748b' }}>
              Apply tags to {selectedCustomerIds.size} selected customer(s). Separate multiple tags with commas.
            </p>
            <input
              type="text"
              placeholder="e.g. VIP, Festival Offer, Summer 2026"
              value={bulkTags}
              onChange={e => setBulkTags(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 20 }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowBulkTagModal(false)} className="secondary-button" disabled={bulkTaggingBusy}>Cancel</button>
              <button type="button" onClick={submitBulkTags} className="primary-button" disabled={bulkTaggingBusy}>
                {bulkTaggingBusy ? "Applying..." : "Apply Tags"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
          <div style={{ background: '#fff', padding: 32, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 24, fontWeight: 600, color: '#0f172a' }}>Review & Confirm</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: '#e0e7ff', width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {channel === 'WHATSAPP' ? <MessageSquare size={24} color="#4f46e5" /> : channel === 'EMAIL' ? <Mail size={24} color="#4f46e5" /> : <Smartphone size={24} color="#4f46e5" />}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Channel</h3>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{channel}</p>
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: '#ecfdf5', width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Filter size={24} color="#059669" />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Recipients</h3>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{selectedCustomerIds.size} Customers</p>
                </div>
              </div>
            </div>
  
            <label style={{ display: 'block', marginBottom: 28 }}>
              <span style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>Campaign Name (Internal)</span>
              <input type="text" className="form-input" style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} placeholder="e.g. Diwali Blast 2026" value={campaignName} onChange={e => setCampaignName(e.target.value)} />
            </label>
  
            <div style={{ marginBottom: 36 }}>
              <span style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>When to send?</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div 
                  onClick={() => setScheduleOption('now')}
                  style={{ border: scheduleOption === 'now' ? '2px solid #3b82f6' : '2px solid #e2e8f0', borderRadius: 12, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: scheduleOption === 'now' ? '#eff6ff' : '#fff', transition: 'all 0.2s' }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: scheduleOption === 'now' ? '6px solid #3b82f6' : '6px solid #cbd5e1', background: '#fff' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>Send Immediately</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Campaign starts right away</div>
                  </div>
                </div>

                <div 
                  onClick={() => setScheduleOption('schedule')}
                  style={{ border: scheduleOption === 'schedule' ? '2px solid #3b82f6' : '2px solid #e2e8f0', borderRadius: 12, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: scheduleOption === 'schedule' ? '#eff6ff' : '#fff', transition: 'all 0.2s' }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: scheduleOption === 'schedule' ? '6px solid #3b82f6' : '6px solid #cbd5e1', background: '#fff' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>Schedule for later</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Pick a specific date & time</div>
                  </div>
                </div>
              </div>
              
              {scheduleOption === 'schedule' && (
                <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>Select Date & Time</label>
                  <input type="datetime-local" style={{ width: '100%', maxWidth: 300, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }} value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} />
                </div>
              )}
            </div>
  
            <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #e2e8f0', paddingTop: 24, alignItems: 'center' }}>
              <button onClick={handleBack} disabled={loading} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: 8, fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronLeft size={16} /> Back
              </button>
              
              <div style={{ flex: 1 }} />
              
              <button onClick={saveDraft} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: 8, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Draft'}
              </button>
              
              <button onClick={() => setShowTestModal(true)} disabled={loading} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: 8, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                Test Message
              </button>
              
              <button onClick={() => { if (!testSent) setShowConfirmModal(true); else submitCampaign(); }} disabled={loading} style={{ background: '#111827', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {loading ? 'Processing...' : 'Confirm & Send'} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      {/* Test Modal */}
      {showTestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowTestSuggestions(false)}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 20, width: '100%', maxWidth: 450, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>Send Test Message</h3>
              <button onClick={() => setShowTestModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={20} color="#64748b" /></button>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 24, lineHeight: '1.5' }}>Search for a customer by name, or manually enter a {channel === 'EMAIL' ? 'email address' : 'phone number'} to receive a preview.</p>
            
            <div style={{ position: 'relative', marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 8 }}>Recipient</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder={channel === 'EMAIL' ? "Search customer or enter email..." : "Search customer or enter number..."}
                  value={testPhoneNumber} 
                  onChange={e => { setTestPhoneNumber(e.target.value); setShowTestSuggestions(true); }}
                  onFocus={() => setShowTestSuggestions(true)}
                  style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>
              
              {showTestSuggestions && testPhoneNumber && customers.some(c => c.name?.toLowerCase().includes(testPhoneNumber.toLowerCase()) || c.phone?.includes(testPhoneNumber) || c.email?.toLowerCase().includes(testPhoneNumber.toLowerCase())) && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxHeight: 220, overflowY: 'auto', zIndex: 50 }}>
                  {customers.filter(c => c.name?.toLowerCase().includes(testPhoneNumber.toLowerCase()) || c.phone?.includes(testPhoneNumber) || c.email?.toLowerCase().includes(testPhoneNumber.toLowerCase())).map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setTestPhoneNumber(channel === 'EMAIL' ? c.email : c.phone);
                        setShowTestSuggestions(false);
                      }}
                      style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{channel === 'EMAIL' ? c.email : c.phone}</div>
                      </div>
                      <div style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Select</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-secondary-sm" style={{ padding: '10px 24px', fontSize: '0.9rem' }} onClick={() => setShowTestModal(false)} disabled={loading}>Cancel</button>
              <button className="btn-primary-sm" style={{ padding: '10px 24px', fontSize: '0.9rem' }} onClick={() => { setShowTestSuggestions(false); submitTest(); }} disabled={loading || !testPhoneNumber}>{loading ? 'Sending...' : 'Send Test'}</button>
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
