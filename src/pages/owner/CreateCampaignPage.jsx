import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Smartphone, Mail, MessageSquare, Search, Image as ImageIcon, Filter, Eye, EyeOff, Tag, X, RefreshCcw, Save, Zap, AlertCircle, UploadCloud, Loader2 } from 'lucide-react';
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setUploadError('');

    // Instant local preview for fast UI feedback in WhatsApp mockup
    const localUrl = URL.createObjectURL(file);
    setImageUrl(localUrl);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.url) {
        setImageUrl(res.data.url);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setUploadError('');
  };
  
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

  const [credits, setCredits] = useState({ whatsappCredits: 0, smsCredits: 0 });
  const [creditsLoading, setCreditsLoading] = useState(false);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    setCreditsLoading(true);
    try {
      const res = await api.get('/owner/credits/balance');
      if (res.data) {
        setCredits({
          whatsappCredits: Number(res.data.whatsappCredits || 0),
          smsCredits: Number(res.data.smsCredits || 0)
        });
      }
    } catch (err) {
      console.error("Failed to load credits balance", err);
    } finally {
      setCreditsLoading(false);
    }
  };

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => step > 1 ? handleBack() : navigate('/admin/campaigns')} 
            style={{ 
              border: 'none', 
              cursor: 'pointer', 
              padding: 6, 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f1f5f9', 
              borderRadius: 8 
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{draftId ? 'Edit Draft Campaign' : 'Create New Campaign'}</h1>
        </div>

        {/* Dynamic Channel Credits Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {channel === 'WHATSAPP' ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 30,
              padding: '6px 14px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', fontWeight: 700, color: '#065f46' }}>
                <Smartphone size={16} color="#059669" />
                WhatsApp Credits:
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#047857' }}>
                  {creditsLoading ? '...' : (credits.whatsappCredits || 0).toLocaleString()}
                </span>
              </span>
              <button
                type="button"
                onClick={() => navigate('/admin/whatsapp-credits')}
                style={{
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Zap size={12} /> Recharge
              </button>
            </div>
          ) : channel === 'SMS' ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 30,
              padding: '6px 14px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', fontWeight: 700, color: '#1e40af' }}>
                <MessageSquare size={16} color="#2563eb" />
                SMS Credits:
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1d4ed8' }}>
                  {creditsLoading ? '...' : (credits.smsCredits || 0).toLocaleString()}
                </span>
              </span>
              <button
                type="button"
                onClick={() => navigate('/admin/whatsapp-credits')}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Zap size={12} /> Recharge
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#065f46'
              }}>
                <Smartphone size={13} color="#059669" /> WA: <b>{(credits.whatsappCredits || 0).toLocaleString()}</b>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#1e40af'
              }}>
                <MessageSquare size={13} color="#2563eb" /> SMS: <b>{(credits.smsCredits || 0).toLocaleString()}</b>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/whatsapp-credits')}
                style={{
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  padding: '5px 11px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <Zap size={11} /> Top Up
              </button>
            </div>
          )}
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
                { 
                  id: 'WHATSAPP', 
                  title: 'WhatsApp', 
                  desc: 'Send rich media messages directly to WhatsApp.', 
                  icon: Smartphone,
                  creditsText: `${(credits.whatsappCredits || 0).toLocaleString()} Credits Available`,
                  badgeColor: '#059669',
                  badgeBg: '#ecfdf5'
                },
                { 
                  id: 'SMS', 
                  title: 'SMS', 
                  desc: 'Send standard text messages to mobile phones.', 
                  icon: MessageSquare,
                  creditsText: `${(credits.smsCredits || 0).toLocaleString()} Credits Available`,
                  badgeColor: '#2563eb',
                  badgeBg: '#eff6ff'
                },
                { 
                  id: 'EMAIL', 
                  title: 'Email', 
                  desc: 'Send promotional emails (Free).', 
                  icon: Mail,
                  creditsText: 'Free & Unlimited',
                  badgeColor: '#6366f1',
                  badgeBg: '#eef2ff'
                }
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>{ch.title}</h3>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: ch.badgeColor, background: ch.badgeBg, padding: '2px 8px', borderRadius: 10 }}>
                        {ch.creditsText}
                      </span>
                    </div>
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
              {/* Channel & Live Credits Status Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: channel === 'WHATSAPP' ? '#f0fdf4' : channel === 'SMS' ? '#eff6ff' : '#f8fafc',
                borderRadius: 12,
                border: channel === 'WHATSAPP' ? '1px solid #bbf7d0' : channel === 'SMS' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: channel === 'WHATSAPP' ? '#059669' : channel === 'SMS' ? '#2563eb' : '#475569',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {channel === 'WHATSAPP' ? <Smartphone size={20} /> : channel === 'SMS' ? <MessageSquare size={20} /> : <Mail size={20} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Active Channel
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      {channel === 'WHATSAPP' ? 'WhatsApp Promotional Message' : channel === 'SMS' ? 'SMS Text Campaign' : 'Email Campaign'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'block' }}>
                      {channel === 'WHATSAPP' ? 'Available WhatsApp Credits' : channel === 'SMS' ? 'Available SMS Credits' : 'Pricing'}
                    </span>
                    <span style={{ fontSize: '1.18rem', fontWeight: 800, color: channel === 'WHATSAPP' ? '#047857' : channel === 'SMS' ? '#1d4ed8' : '#059669' }}>
                      {channel === 'WHATSAPP' 
                        ? (credits.whatsappCredits || 0).toLocaleString() 
                        : channel === 'SMS' 
                          ? (credits.smsCredits || 0).toLocaleString() 
                          : 'Unlimited Free'}
                    </span>
                  </div>
                  {channel !== 'EMAIL' && (
                    <button
                      type="button"
                      onClick={() => navigate('/admin/whatsapp-credits')}
                      style={{
                        background: channel === 'WHATSAPP' ? '#059669' : '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '7px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                      }}
                    >
                      <Zap size={13} /> Recharge Credits
                    </button>
                  )}
                </div>
              </div>

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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                            <ImageIcon size={16} color="#6366f1" />
                            Hero Image (Optional)
                          </label>
                          {imageUrl && (
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: 0
                              }}
                            >
                              <X size={14} /> Remove Image
                            </button>
                          )}
                        </div>

                        {imageUrl ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: 12,
                            background: '#f8fafc',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0'
                          }}>
                            <img
                              src={imageUrl}
                              alt="Hero preview"
                              style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {uploadingImage ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" style={{ color: '#6366f1' }} />
                                    Uploading image...
                                  </>
                                ) : (
                                  'Image attached'
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                                {uploadingImage ? 'Uploading to server...' : 'Banner image will be sent at top of message'}
                              </div>
                            </div>
                            <label
                              style={{
                                padding: '7px 14px',
                                background: '#fff',
                                border: '1px solid #cbd5e1',
                                borderRadius: 6,
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#334155',
                                cursor: uploadingImage ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                flexShrink: 0
                              }}
                            >
                              <UploadCloud size={14} />
                              {uploadingImage ? 'Uploading...' : 'Change'}
                              <input
                                type="file"
                                accept="image/*"
                                hidden
                                disabled={uploadingImage}
                                onChange={handleImageFileChange}
                              />
                            </label>
                          </div>
                        ) : (
                          <label
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '24px 16px',
                              border: '2px dashed #cbd5e1',
                              borderRadius: 10,
                              background: '#f8fafc',
                              cursor: uploadingImage ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              textAlign: 'center'
                            }}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              disabled={uploadingImage}
                              onChange={handleImageFileChange}
                            />
                            <div style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              background: '#e0e7ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6366f1',
                              marginBottom: 8
                            }}>
                              {uploadingImage ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
                            </div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
                              {uploadingImage ? 'Uploading...' : 'Click to upload Hero Image'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                              PNG, JPG, WebP up to 5MB (Shown in WhatsApp preview)
                            </div>
                          </label>
                        )}

                        {uploadError && (
                          <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertCircle size={14} /> {uploadError}
                          </div>
                        )}
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

          {/* Audience & Credit Requirements Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '12px 18px',
            background: (channel !== 'EMAIL' && selectedCustomerIds.size > (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits)) ? '#fef2f2' : '#f8fafc',
            borderRadius: 12,
            border: (channel !== 'EMAIL' && selectedCustomerIds.size > (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits)) ? '1px solid #fecaca' : '1px solid #e2e8f0',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.86rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#475569' }}>
                Selected Recipients: <strong style={{ color: '#0f172a' }}>{selectedCustomerIds.size}</strong>
              </span>
              {channel !== 'EMAIL' && (
                <>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ color: '#475569' }}>
                    Credits Required: <strong style={{ color: '#0f172a' }}>{selectedCustomerIds.size}</strong>
                  </span>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ color: '#475569' }}>
                    Available {channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} Balance:{' '}
                    <strong style={{ color: (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits) >= selectedCustomerIds.size ? '#059669' : '#dc2626' }}>
                      {(channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits).toLocaleString()} Credits
                    </strong>
                  </span>
                </>
              )}
            </div>

            {channel !== 'EMAIL' && selectedCustomerIds.size > (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 700 }}>
                  ⚠️ Need {selectedCustomerIds.size - (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits)} more credits
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/admin/whatsapp-credits')}
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 12px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Zap size={12} /> Recharge Now
                </button>
              </div>
            )}
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
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ background: '#e0e7ff', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {channel === 'WHATSAPP' ? <Smartphone size={22} color="#4f46e5" /> : channel === 'EMAIL' ? <Mail size={22} color="#4f46e5" /> : <MessageSquare size={22} color="#4f46e5" />}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2, textTransform: 'uppercase', fontWeight: 600 }}>Channel</h3>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{channel}</p>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ background: '#ecfdf5', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Filter size={22} color="#059669" />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2, textTransform: 'uppercase', fontWeight: 600 }}>Recipients</h3>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{selectedCustomerIds.size} Customers</p>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ background: '#fef3c7', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={22} color="#d97706" />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2, textTransform: 'uppercase', fontWeight: 600 }}>Credits Required</h3>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    {channel === 'EMAIL' ? 'Free (0 Credits)' : `${selectedCustomerIds.size} Credits`}
                  </p>
                </div>
              </div>

              <div style={{ background: (channel !== 'EMAIL' && (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits) < selectedCustomerIds.size) ? '#fef2f2' : '#f0fdf4', padding: 18, borderRadius: 12, border: (channel !== 'EMAIL' && (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits) < selectedCustomerIds.size) ? '1px solid #fecaca' : '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ background: (channel !== 'EMAIL' && (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits) < selectedCustomerIds.size) ? '#fee2e2' : '#dcfce7', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={22} color={(channel !== 'EMAIL' && (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits) < selectedCustomerIds.size) ? '#dc2626' : '#16a34a'} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2, textTransform: 'uppercase', fontWeight: 600 }}>Available Balance</h3>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: (channel !== 'EMAIL' && (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits) < selectedCustomerIds.size) ? '#dc2626' : '#16a34a', margin: 0 }}>
                    {channel === 'EMAIL' ? 'Unlimited' : `${(channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits || 0).toLocaleString()} Credits`}
                  </p>
                </div>
              </div>
            </div>

            {/* Low Credits Warning Banner */}
            {channel !== 'EMAIL' && (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits) < selectedCustomerIds.size && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertCircle size={22} color="#dc2626" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.92rem' }}>
                      Insufficient {channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} Credits
                    </div>
                    <div style={{ color: '#b91c1c', fontSize: '0.82rem', marginTop: 2 }}>
                      You need {selectedCustomerIds.size} credits to dispatch to all selected recipients, but your available balance is {(channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits)}. Please recharge before sending.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/whatsapp-credits')}
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Zap size={14} /> Recharge Now
                </button>
              </div>
            )}
  
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
              
              <button 
                onClick={() => { if (!testSent) setShowConfirmModal(true); else submitCampaign(); }} 
                disabled={loading || (channel !== 'EMAIL' && (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits) < selectedCustomerIds.size)} 
                title={(channel !== 'EMAIL' && (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits) < selectedCustomerIds.size) ? "Insufficient credits. Please recharge." : ""}
                style={{ 
                  background: (channel !== 'EMAIL' && (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits) < selectedCustomerIds.size) ? '#94a3b8' : '#111827', 
                  border: 'none', 
                  padding: '10px 24px', 
                  borderRadius: 8, 
                  fontWeight: 600, 
                  color: '#fff', 
                  cursor: (channel !== 'EMAIL' && (channel === 'WHATSAPP' ? credits.whatsappCredits : credits.smsCredits) < selectedCustomerIds.size) ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6 
                }}
              >
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
