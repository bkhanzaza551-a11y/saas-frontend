import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Plus, RefreshCcw, Search, BarChart2, ChevronDown, HelpCircle } from "lucide-react";
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
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt, status
  const [showSortDropdown, setShowSortDropdown] = useState(false);

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

  const filtered = campaigns
    .filter((c) => c.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "createdAt") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    });

  return (
    <div className="page-shell" style={{ maxWidth: 1200, margin: '0 auto' }}>
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
        <button className="primary-button" onClick={() => navigate("/admin/campaigns/create")} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500 }}>
          <Plus size={16} /> Create New Campaign
        </button>
      </div>

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
                width: 140, height: 38, padding: '0 12px', background: '#fff', 
                border: showSortDropdown ? '1px solid #4f46e5' : '1px solid #cbd5e1', 
                borderRadius: 8, color: '#334155', fontSize: '0.9rem', cursor: 'pointer',
                boxShadow: showSortDropdown ? '0 0 0 2px rgba(79, 70, 229, 0.1)' : 'none'
              }}
            >
              {sortBy === 'createdAt' ? 'Created at' : 'Status'}
              <ChevronDown size={16} color="#64748b" style={{ transform: showSortDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            
            {showSortDropdown && (
              <div style={{ 
                position: 'absolute', top: 44, left: 0, width: '100%', 
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 10,
                overflow: 'hidden'
              }}>
                {[
                  { value: 'createdAt', label: 'Created at' },
                  { value: 'status', label: 'Status' }
                ].map(opt => (
                  <div 
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); }}
                    style={{ 
                      padding: '10px 12px', fontSize: '0.9rem', cursor: 'pointer',
                      background: sortBy === opt.value ? '#f8fafc' : '#fff',
                      color: sortBy === opt.value ? '#0f172a' : '#475569',
                      fontWeight: sortBy === opt.value ? 500 : 400,
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
        <div style={{ width: '1px', height: 24, background: '#e2e8f0', margin: '0 8px' }} />
        <div style={{ flex: 1, position: "relative", maxWidth: 400 }}>
          <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search campaigns..."
            style={{ paddingLeft: 38, width: "100%", height: 38, margin: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={load} style={{ 
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', height: 38, 
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#475569', 
          fontWeight: 500, cursor: 'pointer' 
        }}>
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState title="No campaigns found" description="You haven't created any campaigns yet, or no campaigns match your search." icon={BarChart2} action={() => navigate("/admin/campaigns/create")} actionText="Create Campaign" />
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
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{c.name}</td>
                  <td>
                    <span style={{ padding: "4px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 700, background: "#f1f5f9", color: "#475569" }}>
                      {c.type}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: "4px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 700,
                      background: c.status === "SENT" ? "#dcfce7" : c.status === "SCHEDULED" ? "#fef9c3" : "#f1f5f9",
                      color: c.status === "SENT" ? "#166534" : c.status === "SCHEDULED" ? "#854d0e" : "#475569"
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td>{c.sentCount || 0}</td>
                  <td>₹{c.revenue || 0}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="secondary-button" onClick={() => navigate(`/admin/campaigns/${c.id}/logs`)}>View Report</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
