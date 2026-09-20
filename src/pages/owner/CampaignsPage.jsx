import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Plus, RefreshCcw, Search, BarChart2 } from "lucide-react";
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
            <button style={{ 
              background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', 
              fontSize: "0.75rem", fontWeight: 600, padding: "4px 12px", borderRadius: 16, cursor: 'pointer' 
            }}>
              Need Help?
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
          <select className="form-input" style={{ width: 140, padding: "8px 12px", height: 38, margin: 0 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="createdAt">Created at</option>
            <option value="status">Status</option>
          </select>
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
