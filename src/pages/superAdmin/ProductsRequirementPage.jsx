import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { Package, Plus, Building2, Tag, Hash, DollarSign, User, Calendar, Info, ArrowRight, X } from "lucide-react";

const emptyForm = {
  productName: "",
  description: "",
  category: "",
  quantity: "1",
  unitPrice: "",
  priority: "MEDIUM",
  status: "PENDING",
  vendor: ""
};

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

function DetailModal({ req, onClose, onUpdateStatus }) {
  if (!req) return null;
  const pc = priorityColors[req.priority] || priorityColors.MEDIUM;
  const sc = statusColors[req.status] || statusColors.PENDING;

  const InfoCard = ({ icon: Icon, label, value, color = "#6366f1" }) => (
    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon size={13} color={color} />
        {value || "—"}
      </div>
    </div>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "white", width: "100%", maxWidth: 600, borderRadius: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto", animation: "slideInRight 0.25s ease" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fdf4ff", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Package size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{req.productName}</h2>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>#{req.id?.slice(-8).toUpperCase()}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: pc.color, background: pc.bg, padding: "4px 10px", borderRadius: 100 }}>{req.priority}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg, padding: "4px 10px", borderRadius: 100 }}>{req.status}</span>
            <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", cursor: "pointer", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 16, flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: "20px 26px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Salon Info */}
          {req.salon && (
            <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)", borderRadius: 12, padding: "14px 16px", border: "1px solid #c7d2fe" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#4338ca", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>📍 Requested by Salon</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                  {req.salon.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{req.salon.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{req.salon.email || "No email"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {req.description && (
            <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 5 }}>Description</div>
              <p style={{ margin: 0, fontSize: 13, color: "#451a03", lineHeight: 1.6 }}>{req.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <InfoCard icon={Tag} label="Category" value={req.category} />
            <InfoCard icon={Hash} label="Quantity" value={req.quantity ? `${req.quantity} units` : "—"} color="#10b981" />
            <InfoCard icon={DollarSign} label="Unit Price" value={req.unitPrice ? `₹${fmt(req.unitPrice)}` : "—"} color="#f59e0b" />
            <InfoCard icon={DollarSign} label="Total Value" value={req.unitPrice && req.quantity ? `₹${fmt(Number(req.unitPrice) * Number(req.quantity))}` : "—"} color="#ef4444" />
            <InfoCard icon={User} label="Vendor" value={req.vendor} color="#8b5cf6" />
            <InfoCard icon={Calendar} label="Requested On" value={new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} color="#64748b" />
          </div>

          {/* Actions */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", alignSelf: "center", marginRight: 4 }}>Update Status:</div>
            {req.status === "PENDING" && (
              <>
                <button onClick={() => onUpdateStatus(req.id, "ORDERED")} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", cursor: "pointer", fontWeight: 700 }}>Mark Ordered</button>
                <button onClick={() => onUpdateStatus(req.id, "CANCELLED")} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontWeight: 700 }}>Cancel</button>
              </>
            )}
            {req.status === "ORDERED" && (
              <button onClick={() => onUpdateStatus(req.id, "RECEIVED")} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8, border: "1px solid #bbf7d0", background: "#ecfdf5", color: "#10b981", cursor: "pointer", fontWeight: 700 }}>✓ Mark Received</button>
            )}
            {(req.status === "RECEIVED" || req.status === "CANCELLED") && (
              <span style={{ fontSize: 13, color: "#94a3b8", alignSelf: "center" }}>No further actions available.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsRequirementPage() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);

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

  const submit = async (e) => {
    e.preventDefault();
    if (!form.productName.trim()) {
      setStatus({ error: "Product name is required.", success: "" });
      return;
    }
    setSaving(true);
    try {
      await api.post("/super-admin/product-requirements", form);
      setForm(emptyForm);
      setIsModalOpen(false);
      setStatus({ error: "", success: "Product requirement created." });
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not submit"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/super-admin/product-requirements/${id}`, { status: newStatus });
      setStatus({ error: "", success: "Status updated." });
      setSelectedReq(null);
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
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ padding: "8px 16px", height: "fit-content", alignSelf: "center", fontSize: "0.85rem" }}>
            <Plus size={16} style={{ marginRight: 6 }} />
            New Product Requirement
          </button>
        </div>
      </div>

      {status.error && <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>{status.error} <button onClick={() => setStatus({ ...status, error: "" })} style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer" }}>✕</button></div>}
      {status.success && <div style={{ background: "#ecfdf5", color: "#065f46", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>{status.success} <button onClick={() => setStatus({ ...status, success: "" })} style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer" }}>✕</button></div>}

      <div className="panel-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>All Procurements <span style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8", marginLeft: 6 }}>({filtered.length})</span></h3>
          <div style={{ display: "flex", gap: 8 }}>
            {["", "PENDING", "ORDERED", "RECEIVED", "CANCELLED"].map((s) => (
              <button key={s} type="button" onClick={() => setFilter(s)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", background: filter === s ? "#4f46e5" : "#f1f5f9", color: filter === s ? "white" : "#64748b" }}>
                {s || "All"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? <EmptyState title="No requirements found" /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontWeight: 700, textAlign: "left" }}>
                  <th style={{ padding: "12px 16px" }}>Product</th>
                  <th style={{ padding: "12px 16px" }}>Salon</th>
                  <th style={{ padding: "12px 16px" }}>Category</th>
                  <th style={{ padding: "12px 16px" }}>Qty</th>
                  <th style={{ padding: "12px 16px" }}>Price</th>
                  <th style={{ padding: "12px 16px" }}>Priority</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const pc = priorityColors[r.priority] || priorityColors.MEDIUM;
                  const sc = statusColors[r.status] || statusColors.PENDING;
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }} className="table-row-hover">
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#fdf4ff", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Package size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{r.productName || "General"}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.vendor || "No vendor"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {r.salon ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                              {r.salon.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 12 }}>{r.salon.name}</div>
                              <div style={{ fontSize: 10, color: "#94a3b8" }}>{r.salon.email}</div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>Platform</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569", fontSize: 13 }}>{r.category || "—"}</td>
                      <td style={{ padding: "14px 16px", color: "#475569", fontSize: 13, fontWeight: 600 }}>x{r.quantity || 1}</td>
                      <td style={{ padding: "14px 16px", color: "#475569", fontSize: 13 }}>{r.unitPrice ? `₹${fmt(r.unitPrice)}` : "—"}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: pc.bg, color: pc.color, padding: "3px 9px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>{r.priority}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: sc.bg, color: sc.color, padding: "3px 9px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>{r.status}</span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedReq(r)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 13px", background: "linear-gradient(135deg, #4f46e5, #6366f1)", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(79,70,229,0.25)" }}
                        >
                          View <ArrowRight size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      <DetailModal req={selectedReq} onClose={() => setSelectedReq(null)} onUpdateStatus={updateStatus} />

      {/* Create Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 540, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>New Product Requirement</h2>
              <button onClick={() => { setIsModalOpen(false); setForm(emptyForm); }} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>✕</button>
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Product Name *</label>
                <input value={form.productName} placeholder="e.g. MacBook Pro, Office Desk, AWS Credits" required onChange={(e) => setForm({ ...form, productName: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Description</label>
                <textarea rows={3} value={form.description} placeholder="Describe the product need or specifications..." onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Category</label>
                  <input value={form.category} placeholder="e.g. Electronics, Furniture, Software" onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Vendor (Optional)</label>
                  <input value={form.vendor} placeholder="e.g. Amazon, Dell, Microsoft" onChange={(e) => setForm({ ...form, vendor: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Quantity</label>
                  <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Unit Price</label>
                  <input type="number" min="0" step="0.01" value={form.unitPrice} placeholder="0.00" onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Priority</label>
                  <CustomSelect value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={[{ label: "Low", value: "LOW" }, { label: "Medium", value: "MEDIUM" }, { label: "High", value: "HIGH" }, { label: "Urgent", value: "URGENT" }]} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12, borderTop: "1px solid #eee", paddingTop: 16 }}>
                <button type="button" onClick={() => { setIsModalOpen(false); setForm(emptyForm); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Creating..." : "Create Requirement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
