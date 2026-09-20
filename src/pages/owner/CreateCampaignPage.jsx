import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { api } from '../../api/client';
import { campaignCategories, predefinedTemplates } from '../../utils/campaignTemplates';

const CreateCampaignPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Step 1
  const [channel, setChannel] = useState(''); // WhatsApp, Email, SMS
  
  // Step 2
  const [category, setCategory] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateVariables, setTemplateVariables] = useState({});
  const [imageUrl, setImageUrl] = useState(null);
  
  // Step 3
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Step 4
  const [campaignName, setCampaignName] = useState('');
  const [scheduleOption, setScheduleOption] = useState('now');
  const [scheduledFor, setScheduledFor] = useState('');
  const [testSent, setTestSent] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (step === 3) {
      fetchCustomers();
    }
  }, [step]);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/owner/customers');
      setCustomers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  // Template Logic
  const selectedTemplate = predefinedTemplates?.find(t => t.id === templateId);
  
  const extractVariables = (text) => {
    const regex = /\[\[(.*?)\]\]/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return [...new Set(matches)]; // unique
  };

  const variables = selectedTemplate ? extractVariables(selectedTemplate.content) : [];

  const handleVariableChange = (variable, value) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const getResolvedContent = (content, vars) => {
    if (!content) return '';
    let result = content;
    variables.forEach(variable => {
      const value = vars[variable] || `[[${variable}]]`;
      result = result.replace(new RegExp(`\\[\\[${variable}\\]\\]`, 'g'), value);
    });
    return result;
  };

  const getPreviewContent = (content, vars) => {
    if (!content) return '';
    let result = getResolvedContent(content, vars);
    // Replace {{...}} with placeholders for preview
    result = result.replace(/\{\{customerName\}\}/g, 'John Doe');
    result = result.replace(/\{\{shopName\}\}/g, 'Your Shop');
    // Add more typical generic placeholders if needed
    result = result.replace(/\{\{(.*?)\}\}/g, 'Placeholder'); 
    return result;
  };

  const resolvedContent = getResolvedContent(selectedTemplate?.content, templateVariables);

  // Customer Selection Logic
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.phone?.includes(searchQuery);
    const matchesGender = genderFilter ? c.gender === genderFilter : true;
    return matchesSearch && matchesGender;
  });

  const toggleCustomer = (id) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c._id));
    }
  };

  // Submission Logic
  const handleTestSend = async () => {
    try {
      await api.post('/owner/campaigns/test', {
        phoneNumber: testPhoneNumber,
        message: resolvedContent,
        channel
      });
      setTestSent(true);
      setShowTestModal(false);
      alert('Test message sent!');
    } catch (err) {
      console.error(err);
      alert('Failed to send test message');
    }
  };

  const submitCampaign = async () => {
    try {
      const payload = {
        name: campaignName || `${category} Campaign - ${new Date().toLocaleDateString()}`,
        type: channel,
        templateId: selectedTemplate?.id,
        message: resolvedContent, // Keep {{...}} intact
        scheduledFor: scheduleOption === 'schedule' ? scheduledFor : null,
        audienceFilter: 'SELECTED',
        audienceMeta: { selectedIds: selectedCustomers },
        imageUrl: imageUrl ? imageUrl.name : null, // Assuming basic handling, usually needs S3 upload
      };
      
      await api.post('/owner/campaigns', payload);
      alert('Campaign created successfully!');
      navigate('/owner/campaigns');
    } catch (err) {
      console.error(err);
      alert('Failed to create campaign');
    }
  };

  const handleConfirmAndSend = () => {
    if (!testSent) {
      setShowConfirmModal(true);
    } else {
      submitCampaign();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => step > 1 ? handleBack() : navigate('/owner/campaigns')} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
          <ChevronLeft />
        </button>
        <h1 className="text-2xl font-bold">Create Campaign</h1>
      </div>

      {/* Stepper Header */}
      <div className="flex justify-between mb-8 border-b pb-4">
        {['Select Channel', 'Select Message', 'Select Customers', 'Confirm'].map((label, idx) => (
          <div key={idx} className={`flex-1 text-center ${step === idx + 1 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
            <div className="text-sm">Step {idx + 1}</div>
            <div>{label}</div>
          </div>
        ))}
      </div>

      {/* Step 1: Channel */}
      {step === 1 && (
        <div>
          <h2 className="text-xl mb-4">Select Channel</h2>
          <div className="flex gap-4">
            {['WhatsApp', 'Email', 'SMS'].map(c => (
              <button 
                key={c}
                onClick={() => setChannel(c)}
                className={`p-6 border rounded-lg w-48 text-center ${channel === c ? 'border-blue-600 bg-blue-50' : 'hover:border-gray-400'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <button 
            disabled={!channel}
            onClick={handleNext}
            className="mt-8 px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2: Message */}
      {step === 2 && (
        <div className="flex gap-8">
          <div className="flex-1">
            <h2 className="text-xl mb-4">Configure Message</h2>
            
            <div className="mb-4">
              <label className="block mb-2">Category</label>
              <select className="w-full border p-2 rounded" value={category} onChange={e => { setCategory(e.target.value); setTemplateId(''); }}>
                <option value="">Select Category</option>
                {campaignCategories?.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-2">Template</label>
              <select className="w-full border p-2 rounded" value={templateId} onChange={e => setTemplateId(e.target.value)}>
                <option value="">Select Template</option>
                {predefinedTemplates?.filter(t => t.category === category).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-2">Variables</h3>
                {variables.length > 0 ? (
                  variables.map(variable => (
                    <div key={variable} className="mb-3 flex items-center">
                      <label className="w-32">{variable}:</label>
                      <input 
                        type="text" 
                        className="flex-1 border p-2 rounded"
                        value={templateVariables[variable] || ''}
                        onChange={e => handleVariableChange(variable, e.target.value)}
                        placeholder={`Enter ${variable}`}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No variables to configure for this template.</p>
                )}

                {selectedTemplate.supportsImage && (
                  <div className="mt-4">
                    <label className="block mb-2 font-semibold">Image</label>
                    <input type="file" onChange={e => setImageUrl(e.target.files[0])} className="border p-2 w-full rounded" />
                  </div>
                )}
              </div>
            )}
            
            <button 
              disabled={!templateId}
              onClick={handleNext}
              className="mt-8 px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>

          <div className="flex-1 bg-gray-50 p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">Live Preview</h3>
            {selectedTemplate ? (
              <div className="bg-white p-4 rounded border whitespace-pre-wrap">
                {getPreviewContent(selectedTemplate.content, templateVariables)}
              </div>
            ) : (
              <div className="text-gray-400 italic">Select a template to preview</div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Customers */}
      {step === 3 && (
        <div>
          <h2 className="text-xl mb-4">Select Audience</h2>
          
          <div className="flex gap-4 mb-4">
            <input 
              type="text" 
              placeholder="Search name or phone..." 
              className="border p-2 rounded flex-1"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select className="border p-2 rounded" value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="border rounded overflow-hidden mb-6">
            <table className="w-full text-left bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">
                    <input 
                      type="checkbox" 
                      checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Gender</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr key={c._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <input 
                        type="checkbox" 
                        checked={selectedCustomers.includes(c._id)}
                        onChange={() => toggleCustomer(c._id)}
                      />
                    </td>
                    <td className="p-3">{c.name}</td>
                    <td className="p-3">{c.phone}</td>
                    <td className="p-3">{c.gender}</td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-500">No customers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">{selectedCustomers.length} selected</span>
            <button 
              disabled={selectedCustomers.length === 0}
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div className="flex gap-8">
          <div className="flex-1">
            <h2 className="text-xl mb-4">Summary</h2>
            <div className="bg-gray-50 p-6 rounded border mb-6 space-y-3">
              <div><span className="font-semibold">Channel:</span> {channel}</div>
              <div><span className="font-semibold">Category:</span> {category}</div>
              <div><span className="font-semibold">Recipients:</span> {selectedCustomers.length} customers</div>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-semibold">Campaign Name (Optional)</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded" 
                value={campaignName} 
                onChange={e => setCampaignName(e.target.value)}
                placeholder={`${category} Campaign`}
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-semibold">Schedule</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={scheduleOption === 'now'} onChange={() => setScheduleOption('now')} />
                  Send Now
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={scheduleOption === 'schedule'} onChange={() => setScheduleOption('schedule')} />
                  Schedule for later
                </label>
              </div>
              {scheduleOption === 'schedule' && (
                <input 
                  type="datetime-local" 
                  className="mt-2 border p-2 rounded block"
                  value={scheduledFor}
                  onChange={e => setScheduledFor(e.target.value)}
                />
              )}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowTestModal(true)}
                className="px-6 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
              >
                Send Test Message
              </button>
              <button 
                onClick={handleConfirmAndSend}
                className="px-6 py-2 bg-blue-600 text-white rounded"
              >
                Confirm and Send Campaign
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-gray-50 p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">Final Preview</h3>
            <div className="bg-white p-4 rounded border whitespace-pre-wrap text-sm">
              {getPreviewContent(selectedTemplate?.content, templateVariables)}
            </div>
            {imageUrl && <p className="mt-2 text-sm text-gray-500 italic">Includes attached image</p>}
          </div>
        </div>
      )}

      {/* Modals */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Send Test Message</h3>
            <input 
              type="text" 
              placeholder="Enter phone number..." 
              className="w-full border p-2 rounded mb-4"
              value={testPhoneNumber}
              onChange={e => setTestPhoneNumber(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTestModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleTestSend} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Send Without Testing?</h3>
            <p className="mb-6 text-gray-600">You haven't sent a test message to verify how this campaign looks. Are you sure you want to continue?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={() => { setShowConfirmModal(false); submitCampaign(); }} className="px-4 py-2 bg-blue-600 text-white rounded">Yes, Send Anyway</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateCampaignPage;
