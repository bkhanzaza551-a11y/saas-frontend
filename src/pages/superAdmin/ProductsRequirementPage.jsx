import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { Package, Plus } from "lucide-react";



const priorityColors = {
  LOW: { bg: "#f0fdf4", color: "#166534" },
  MEDIUM: { bg: "#fffbeb", color: "#d97706" },
  HIGH: { bg: "#fff7ed", color: "#c2410c" },
  URGENT: { bg: "#fef2f2", color: "#dc2626" }
};

const statusColors = {
  PENDING: { bg: "#fffbeb", color: "#d97706" },
  ORDERED: { bg: "#eff6ff", color: "#2563eb" },
  RECEIVED: { bg: "#ecfdf5", color: "#10b981" },
  CANCELLED: { bg: "#fef2f2", color: "#ef4444" }
};

const fmt = (val) => Number(val || 0).toLocaleString("en-IN");

export default function ProductsRequirementPage() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [filter, setFilter] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/super-admin/product-requirements");
      setRequirements(res.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load requirements"), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);



  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/super-admin/product-requirements/${id}`, { status: newStatus });
      setStatus({ error: "", success: "Status updated." });
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not update"), success: "" });
    }
  };

  const filtered = requirements.filter((r) => !filter || r.status === filter);

  if (loading) return <div className="page-shell super-admin-page"><PageLoader title="Loading requirements" /></div>;

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Product Requirements</h1>
            <p style={{ marginBottom: 0 }}>Manage procurement needs for the platform (Software, Electronics, Furniture, etc).</p>
          </div>
          </div>
        </div>
      </div>

      {status.error && <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>{status.error} <button onClick={() => setStatus({ ...status, error: "" })} style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer" }}>✕</button></div>}
      {status.success && <div style={{ background: "#ecfdf5", color: "#065f46", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>{status.success} <button onClick={() => setStatus({ ...status, success: "" })} style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer" }}>✕</button></div>}

      <div className="panel-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>All Procurements</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {["", "PENDING", "ORDERED", "RECEIVED", "CANCELLED"].map((s) => (
              <button key={s} type="button" onClick={() => setFilter(s)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", background: filter === s ? "#4f46e5" : "#f1f5f9", color: filter === s ? "white" : "#64748b" }}>
                {s || "All"}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? <EmptyState title="No requirements found" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((r) => {
              const pc = priorityColors[r.priority] || priorityColors.MEDIUM;
              const sc = statusColors[r.status] || statusColors.PENDING;
              return (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", gap: 24, alignItems: "center", flex: 1 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fdf4ff", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={18} /></div>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{r.productName || "General"}</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{r.description || "No description"}</div>
                    </div>
                    <div style={{ minWidth: 100 }}>
                      <div style={{ fontSize: "0.85rem", color: "#475569" }}>{r.category || "-"}</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>x{r.quantity || 1}</div>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{r.unitPrice ? "\u20B9" + fmt(r.unitPrice) : "-"}</div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{r.vendor || "-"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ background: pc.bg, color: pc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>{r.priority}</span>
                    <span style={{ background: sc.bg, color: sc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>{r.status}</span>
                    {r.status === "PENDING" && (
                      <>
                        <button type="button" onClick={() => updateStatus(r.id, "ORDERED")} style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: 6, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", cursor: "pointer" }}>Mark Ordered</button>
                        <button type="button" onClick={() => updateStatus(r.id, "CANCELLED")} style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", cursor: "pointer" }}>Cancel</button>
                      </>
                    )}
                    {r.status === "ORDERED" && (
                      <button type="button" onClick={() => updateStatus(r.id, "RECEIVED")} style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: 6, border: "1px solid #bbf7d0", background: "#ecfdf5", color: "#10b981", cursor: "pointer" }}>Mark Received</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
}
