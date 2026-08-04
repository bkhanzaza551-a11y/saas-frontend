import { useEffect, useState, useCallback } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { Package, Plus, Eye, Edit2 } from "lucide-react";

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

export default function ProductsRequirementPage() {
  const [requirements, setRequirements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [viewDetailReq, setViewDetailReq] = useState(null);
  const [statusUpdateReq, setStatusUpdateReq] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resReq, resCat, resVen] = await Promise.all([
        api.get("/owner/product-requirements"),
        api.get("/owner/inventory/categories").catch(() => ({ data: [] })),
        api.get("/owner/purchases/vendors").catch(() => ({ data: [] }))
      ]);
      setRequirements(resReq.data || []);
      setCategories(resCat.data || []);
      setVendors(resVen.data || []);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load data"), success: "" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.productName.trim()) {
      setStatus({ error: "Product name is required.", success: "" });
      return;
    }
    setSaving(true);
    try {
      await api.post("/owner/product-requirements", form);
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
      await api.patch(`/owner/product-requirements/${id}`, { status: newStatus });
      setStatus({ error: "", success: "Status updated successfully." });
      setStatusUpdateReq(null);
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not update status"), success: "" });
    }
  };

  const filtered = requirements.filter((r) => !filter || r.status === filter);

  if (loading) return <div className="page-shell"><PageLoader title="Loading requirements" /></div>;

  return (
    <div className="page-shell">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Product Requirements</h1>
            <p style={{ marginBottom: 0 }}>Manage procurement needs for the salon (e.g. Shampoos, Chairs, Hair Dryers).</p>
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
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ background: pc.bg, color: pc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>{r.priority}</span>
                    <span style={{ background: sc.bg, color: sc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>{r.status}</span>
                    <button type="button" onClick={() => setViewDetailReq(r)} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }} title="View Detail">
                      <Eye size={14} /> Detail
                    </button>
                    <button type="button" onClick={() => setStatusUpdateReq(r)} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }} title="Update Status">
                      <Edit2 size={14} /> Status
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                <input
                  value={form.productName}
                  placeholder="e.g. Hair Dryer, Keratin Shampoo, Massage Bed"
                  required
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  placeholder="Describe the product need or specifications..."
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Category</label>
                  <CustomSelect
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    options={[
                      { label: "Select Category", value: "" },
                      ...categories.map(c => ({ label: c.name, value: c.name }))
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Vendor (Optional)</label>
                  <CustomSelect
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    options={[
                      { label: "Select Vendor", value: "" },
                      ...vendors.map(v => ({ label: v.name, value: v.name }))
                    ]}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Unit Price (Est.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unitPrice}
                    placeholder="0.00"
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Priority</label>
                  <CustomSelect 
                    value={form.priority} 
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    options={[
                      { label: "Low", value: "LOW" },
                      { label: "Medium", value: "MEDIUM" },
                      { label: "High", value: "HIGH" },
                      { label: "Urgent", value: "URGENT" }
                    ]}
                  />
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

      {/* View Detail Modal */}
      {viewDetailReq && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 500, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Requirement Details</h2>
              <button onClick={() => setViewDetailReq(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div><strong>Product Name:</strong> {viewDetailReq.productName}</div>
              <div><strong>Description:</strong> {viewDetailReq.description || "N/A"}</div>
              <div><strong>Category:</strong> {viewDetailReq.category || "N/A"}</div>
              <div><strong>Vendor:</strong> {viewDetailReq.vendor || "N/A"}</div>
              <div><strong>Quantity:</strong> {viewDetailReq.quantity}</div>
              <div><strong>Est. Unit Price:</strong> {viewDetailReq.unitPrice ? "\u20B9" + fmt(viewDetailReq.unitPrice) : "N/A"}</div>
              <div><strong>Priority:</strong> {viewDetailReq.priority}</div>
              <div><strong>Status:</strong> {viewDetailReq.status}</div>
              <div><strong>Created At:</strong> {new Date(viewDetailReq.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button type="button" onClick={() => setViewDetailReq(null)} className="btn btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusUpdateReq && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 400, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Update Status</h2>
              <button onClick={() => setStatusUpdateReq(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["PENDING", "ORDERED", "RECEIVED", "CANCELLED"].map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(statusUpdateReq.id, s)}
                  className="btn"
                  style={{
                    background: statusUpdateReq.status === s ? "#f1f5f9" : "white",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    fontWeight: 600,
                    padding: "10px",
                    textAlign: "center",
                    cursor: "pointer",
                    borderRadius: 8
                  }}
                >
                  Mark as {s}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button type="button" onClick={() => setStatusUpdateReq(null)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
