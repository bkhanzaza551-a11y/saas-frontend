import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { Package } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
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
            <p style={{ marginBottom: 0 }}>Manage product procurement needs across the platform.</p>
          </div>
          <span className="badge">{requirements.length} total</span>
        </div>
      </div>

      {status.error && <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem" }}>{status.error}</div>}
      {status.success && <div style={{ background: "#ecfdf5", color: "#065f46", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem" }}>{status.success}</div>}

      <div className="panel-card" style={{ marginBottom: 20, padding: 24 }}>
        <h3 style={{ margin: "0 0 16px" }}>New Product Requirement</h3>
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
          <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Product Name *</span>
            <input value={form.productName} placeholder="e.g. Shampoo, Hair Color" required onChange={(e) => setForm({ ...form, productName: e.target.value })} />
          </label>
          <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Description</span>
            <textarea rows={2} value={form.description} placeholder="Describe the product need" onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Category</span>
            <input value={form.category} placeholder="e.g. Haircare, Skincare" onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Vendor</span>
            <input value={form.vendor} placeholder="Vendor name" onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Quantity</span>
            <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Unit Price</span>
            <input type="number" min="0" step="0.01" value={form.unitPrice} placeholder="0.00" onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Priority</span>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Status</span>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="PENDING">Pending</option>
              <option value="ORDERED">Ordered</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", fontWeight: 700, borderRadius: 10, padding: "12px 24px", border: "none", cursor: "pointer" }}>
              {saving ? "Creating..." : "Create Requirement"}
            </button>
          </div>
        </form>
      </div>

      <div className="panel-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>All Requirements</h3>
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
