import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Plus, RefreshCcw, Search, BarChart2, ChevronDown, HelpCircle, X, Users, Send, TrendingUp, Calendar } from "lucide-react";
import PageLoader from "../../components/PageLoader";
import EmptyState from "../../components/EmptyState";
import { formatApiError } from "../../utils/apiError";
import { useAlert } from "../../context/AlertContext";

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [reportCampaign, setReportCampaign] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/owner/campaigns");
      setCampaigns(res.data || []);
    } catch (err) {
      showAlert("Error", formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openReport = async (campaign) => {
    setReportCampaign(campaign);
    setReportData(null);
    setReportLoading(true);
    try {
      const res = await api.get(`/owner/campaigns/${campaign.id}/performance`);
      setReportData(res.data);
    } catch (err) {
      // performance endpoint might require campaignAnalytics feature, fallback to basic info
      setReportData({ campaign, logs: campaign.logs || [] });
    } finally {
      setReportLoading(false);
    }
  };

  const closeReport = () => {
    setReportCampaign(null);
    setReportData(null);
  };

  const filtered = campaigns
    .filter((c) => c.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "createdAt") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    });

  const statusColor = (s) => {
    if (s === "SENT") return { bg: "#dcfce7", color: "#166534" };
    if (s === "SCHEDULED") return { bg: "#fef9c3", color: "#854d0e" };
    if (s === "DRAFT") return { bg: "#f1f5f9", color: "#64748b" };
    return { bg: "#f1f5f9", color: "#475569" };
  };

  return (
    <div className="page-shell" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Campaigns</h1>
            <button
              onClick={() => navigate('/admin/support-tickets')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155',
                fontSize: "0.8rem", fontWeight: 500, padding: "4px 12px", borderRadius: 20, cursor: 'pointer'
              }}
            >
              <HelpCircle size={14} /> Need Help?
            </button>
          </div>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>
            Create and manage marketing campaigns to attract more customers and promote salon services.
          </p>
        </div>
        <button
          className="btn-primary-sm"
          onClick={() => navigate("/admin/campaigns/create")}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center", background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Sort By</span>
          <div
            style={{ position: 'relative' }}
            tabIndex={0}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setShowSortDropdown(false); }}
          >
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: 140, height: 36, padding: '0 12px', background: '#fff',
                border: showSortDropdown ? '1px solid #4f46e5' : '1px solid #cbd5e1',
                borderRadius: 8, color: '#334155', fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              {sortBy === 'createdAt' ? 'Created at' : 'Status'}
              <ChevronDown size={15} color="#64748b" style={{ transform: showSortDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {showSortDropdown && (
              <div style={{
                position: 'absolute', top: 42, left: 0, width: '100%',
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10, overflow: 'hidden'
              }}>
                {[{ value: 'createdAt', label: 'Created at' }, { value: 'status', label: 'Status' }].map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); }}
                    style={{
                      padding: '9px 12px', fontSize: '0.85rem', cursor: 'pointer',
                      background: sortBy === opt.value ? '#f8fafc' : '#fff',
                      color: sortBy === opt.value ? '#0f172a' : '#475569',
                      fontWeight: sortBy === opt.value ? 600 : 400,
                      borderBottom: opt.value === 'createdAt' ? '1px solid #f1f5f9' : 'none'
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ width: '1px', height: 24, background: '#e2e8f0', margin: '0 4px' }} />
        <div style={{ flex: 1, position: "relative", maxWidth: 400 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search campaigns..."
            style={{ paddingLeft: 36, width: "100%", height: 36, margin: 0, fontSize: '0.875rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', height: 36,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#475569',
          fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem'
        }}>
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState title="No campaigns found" description="You haven't created any campaigns yet." icon={BarChart2} action={() => navigate("/admin/campaigns/create")} actionText="Create Campaign" />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Sent</th>
                <th>Revenue</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const sc = statusColor(c.status);
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{c.name}</td>
                    <td>
                      <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: "0.72rem", fontWeight: 700, background: "#f1f5f9", color: "#475569" }}>
                        {c.type}
                      </span>
                    </td>
                    <td>
                      <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: "0.72rem", fontWeight: 700, background: sc.bg, color: sc.color }}>
                        {c.status}
                      </span>
                    </td>
                    <td>{c.sentCount || 0}</td>
                    <td>₹{c.revenue || 0}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      {c.status === "DRAFT" ? (
                        <button
                          className="btn-primary-sm"
                          onClick={() => navigate('/admin/campaigns/create', { state: { draft: c } })}
                        >
                          Continue Editing
                        </button>
                      ) : (
                        <button
                          className="btn-secondary-sm"
                          onClick={() => openReport(c)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                        >
                          <BarChart2 size={13} /> View Report
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Modal */}
      {reportCampaign && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={closeReport}
        >
          <div
            style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>{reportCampaign.name}</h2>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#f1f5f9', color: '#475569' }}>{reportCampaign.type}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, ...statusColor(reportCampaign.status) }}>{reportCampaign.status}</span>
                </div>
              </div>
              <button onClick={closeReport} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} color="#94a3b8" />
              </button>
            </div>

            {reportLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Loading report...</div>
            ) : (
              <>
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  {[
                    { icon: <Send size={20} color="#4f46e5" />, label: 'Messages Sent', value: reportCampaign.sentCount || reportData?.campaign?.logs?.length || 0, bg: '#eef2ff' },
                    { icon: <Users size={20} color="#059669" />, label: 'Recipients', value: reportData?.campaign?.audienceMeta?.selectedIds?.length || reportCampaign.sentCount || 0, bg: '#ecfdf5' },
                    { icon: <TrendingUp size={20} color="#d97706" />, label: 'Revenue Generated', value: `₹${reportCampaign.revenue || 0}`, bg: '#fffbeb' },
                    { icon: <Calendar size={20} color="#0ea5e9" />, label: 'Sent On', value: new Date(reportCampaign.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), bg: '#f0f9ff' },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: stat.bg, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flexShrink: 0 }}>{stat.icon}</div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{stat.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Preview */}
                {reportCampaign.message && (
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Message Sent</div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{reportCampaign.message}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
