import { useState, useEffect, useCallback } from "react";
import { Plus, Search, PackageCheck, AlertTriangle, Truck, ShoppingCart, CheckCircle, Edit2, Trash2, DollarSign, Building2 } from "lucide-react";
import { api } from "../../api/client";
import { useBranch } from "../../context/BranchContext";

const emptyForm = {
  productId: "",
  productName: "",
  category: "Hair Care Supplies",
  branchId: "",
  currentStock: 0,
  requiredQty: 5,
  unitCost: 0,
  vendor: "",
  priority: "Normal",
  reason: "",
  status: "PENDING"
};

export default function ProductRequirementsPage() {
  const { selectedBranchId: globalBranchId } = useBranch();
  const [requirements, setRequirements] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Sync global branch selection
  useEffect(() => {
    if (globalBranchId) {
      setSelectedBranch(globalBranchId);
    }
  }, [globalBranchId]);

  // Load real branches, catalog products, categories, and vendors
  useEffect(() => {
    Promise.allSettled([
      api.get("/owner/branches"),
      api.get("/owner/products"),
      api.get("/owner/inventory/categories"),
      api.get("/owner/purchases/vendors")
    ]).then(([branchesRes, productsRes, categoriesRes, vendorsRes]) => {
      if (branchesRes.status === "fulfilled") setBranches(branchesRes.value?.data || []);
      if (productsRes.status === "fulfilled") setProducts(productsRes.value?.data || []);
      if (categoriesRes.status === "fulfilled") setCategories(categoriesRes.value?.data || []);
      if (vendorsRes.status === "fulfilled") setVendors(vendorsRes.value?.data || []);
    });
  }, []);

  // Fetch real product requirements from backend
  const loadRequirements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
      if (priorityFilter && priorityFilter !== "ALL") params.append("priority", priorityFilter);
      if (selectedBranch && selectedBranch !== "ALL") params.append("branchId", selectedBranch);

      const res = await api.get(`/owner/product-requirements?${params.toString()}`);
      setRequirements(res.data || []);
    } catch (err) {
      console.error("Failed to load product requirements:", err);
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, selectedBranch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRequirements();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadRequirements]);

  // Auto-fill product info when selected from dropdown
  const handleProductSelect = (productId) => {
    const p = products.find(prod => prod.id === productId);
    if (p) {
      setForm(prev => ({
        ...prev,
        productId: p.id,
        productName: p.name,
        category: p.category?.name || prev.category,
        currentStock: Number(p.currentStock) || 0,
        unitCost: Number(p.costPrice || p.sellingPrice) || 0
      }));
    } else {
      setForm(prev => ({ ...prev, productId: "" }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.productName.trim()) return;

    setSaving(true);
    try {
      const payload = {
        productId: form.productId || null,
        productName: form.productName,
        category: form.category,
        branchId: form.branchId || null,
        currentStock: Number(form.currentStock) || 0,
        requiredQty: Number(form.requiredQty) || 1,
        unitCost: Number(form.unitCost) || 0,
        vendor: form.vendor,
        priority: form.priority,
        reason: form.reason,
        status: form.status
      };

      if (editingId) {
        const res = await api.patch(`/owner/product-requirements/${editingId}`, payload);
        setRequirements(prev => prev.map(req => req.id === editingId ? res.data : req));
      } else {
        const res = await api.post("/owner/product-requirements", payload);
        setRequirements(prev => [res.data, ...prev]);
      }
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save product requirement");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const startEdit = (req) => {
    setEditingId(req.id);
    setForm({
      productId: req.productId || "",
      productName: req.productName || "",
      category: req.category || "Hair Care Supplies",
      branchId: req.branchId || "",
      currentStock: Number(req.currentStock) || 0,
      requiredQty: Number(req.requiredQty) || 1,
      unitCost: Number(req.unitCost) || 0,
      vendor: req.vendor || "",
      priority: req.priority || "Normal",
      reason: req.reason || "",
      status: req.status || "PENDING"
    });
    setIsModalOpen(true);
  };

  const deleteReq = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product requirement?")) return;
    try {
      await api.delete(`/owner/product-requirements/${id}`);
      setRequirements(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product requirement");
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await api.patch(`/owner/product-requirements/${id}`, { status: newStatus });
      setRequirements(prev => prev.map(r => r.id === id ? res.data : r));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const stats = {
    total: requirements.length,
    pending: requirements.filter(r => r.status === "PENDING").length,
    ordered: requirements.filter(r => r.status === "ORDERED").length,
    received: requirements.filter(r => r.status === "RECEIVED").length,
    totalEstimatedCost: requirements.reduce((sum, r) => sum + (Number(r.requiredQty) * Number(r.unitCost)), 0)
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Urgent": return <span className="badge" style={{ background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>Urgent</span>;
      case "High": return <span className="badge" style={{ background: "#ffedd5", color: "#9a3412", fontWeight: 700 }}>High</span>;
      case "Normal": return <span className="badge" style={{ background: "#fef9c3", color: "#854d0e", fontWeight: 700 }}>Normal</span>;
      default: return <span className="badge" style={{ background: "#e0f2fe", color: "#075985", fontWeight: 700 }}>Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING": return <span className="badge" style={{ background: "#fff7ed", color: "#c2410c" }}>Pending Order</span>;
      case "ORDERED": return <span className="badge" style={{ background: "#e0e7ff", color: "#3730a3" }}>Ordered / In Transit</span>;
      case "RECEIVED": return <span className="badge" style={{ background: "#dcfce7", color: "#166534" }}>Received & Stocked</span>;
      default: return <span className="badge" style={{ background: "#fee2e2", color: "#991b1b" }}>Rejected</span>;
    }
  };

  return (
    <div className="page-shell super-admin-page">
      {/* Hero Header */}
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Product Requirements & Inventory Restock Requisitions</h1>
            <p style={{ marginBottom: 0 }}>Track stock shortages, restock requests, purchase estimates, and supplier fulfillments across branches.</p>
          </div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus size={16} style={{ marginRight: 6 }} />
            New Product Requirement
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="panel-card" style={{ padding: 20 }}>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>Total Requisitions</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{stats.total}</div>
        </div>
        <div className="panel-card" style={{ padding: 20, borderLeft: "4px solid #f97316" }}>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>Pending Reorders</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#ea580c", marginTop: 4 }}>{stats.pending}</div>
        </div>
        <div className="panel-card" style={{ padding: 20, borderLeft: "4px solid #6366f1" }}>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>Ordered / In Transit</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#4f46e5", marginTop: 4 }}>{stats.ordered}</div>
        </div>
        <div className="panel-card" style={{ padding: 20, borderLeft: "4px solid #22c55e" }}>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>Total Est. Restock Cost</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>₹{stats.totalEstimatedCost.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="panel-card" style={{ padding: 16, marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1, minWidth: 280 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search product name, category, vendor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: "8px 12px 8px 36px", width: "100%", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "white" }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Order</option>
            <option value="ORDERED">Ordered / In Transit</option>
            <option value="RECEIVED">Received & Stocked</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "white" }}
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Building2 size={16} style={{ color: "#64748b" }} />
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, fontWeight: 600, background: "white" }}
          >
            <option value="ALL">All Salon Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "20px 0", color: "#6366f1", fontWeight: 600 }}>Loading product requirements...</div>}

      {/* Requirements List Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {requirements.length > 0 ? (
          requirements.map(req => {
            const branchName = req.branch?.name || "Main Salon";
            const estCost = Number(req.requiredQty || 1) * Number(req.unitCost || 0);
            const reqDate = req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "";

            return (
              <div key={req.id} className="panel-card" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "2px 8px", borderRadius: 6 }}>{req.reqNumber || req.id}</span>
                      <h3 style={{ margin: "6px 0 2px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{req.productName}</h3>
                      <div style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{req.category}</span>
                        <span>•</span>
                        <span style={{ fontWeight: 600, color: "#475569" }}>{branchName}</span>
                      </div>
                    </div>
                    {getPriorityBadge(req.priority)}
                  </div>

                  <div style={{ margin: "14px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13, color: "#334155", background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                    <div><strong>Current Stock:</strong> <span style={{ color: Number(req.currentStock) === 0 ? "#dc2626" : "#0f172a", fontWeight: 700 }}>{req.currentStock} units</span></div>
                    <div><strong>Required Qty:</strong> <span style={{ color: "#4f46e5", fontWeight: 700 }}>{req.requiredQty} units</span></div>
                    <div><strong>Est. Unit Cost:</strong> ₹{Number(req.unitCost).toLocaleString("en-IN")}</div>
                    <div><strong>Est. Total:</strong> <span style={{ color: "#16a34a", fontWeight: 700 }}>₹{estCost.toLocaleString("en-IN")}</span></div>
                  </div>

                  {req.vendor && (
                    <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>
                      <strong>Preferred Vendor:</strong> {req.vendor}
                    </div>
                  )}

                  {req.reason && (
                    <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, margin: "0 0 14px" }}>{req.reason}</p>
                  )}
                </div>

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14, marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {getStatusBadge(req.status)}
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{reqDate}</span>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    {req.status === "PENDING" && (
                      <button onClick={() => updateStatus(req.id, "ORDERED")} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: 12, color: "#4f46e5" }} title="Mark Ordered">
                        <Truck size={14} />
                      </button>
                    )}
                    {req.status === "ORDERED" && (
                      <button onClick={() => updateStatus(req.id, "RECEIVED")} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: 12, color: "#16a34a" }} title="Mark Received">
                        <CheckCircle size={14} />
                      </button>
                    )}
                    <button onClick={() => startEdit(req)} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: 12 }} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteReq(req.id)} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: 12, color: "#dc2626" }} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="panel-card" style={{ padding: 40, textAlign: "center", color: "#94a3b8", gridColumn: "1 / -1" }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No product requirements found matching criteria.</p>
          </div>
        )}
      </div>

      {/* Create / Edit Requirement Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 540, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editingId ? "Edit Product Requirement" : "New Product Requirement"}</h2>
              <button onClick={resetForm} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {products.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Select Existing Product (Auto-Fill)</label>
                  <select
                    value={form.productId}
                    onChange={e => handleProductSelect(e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "white", boxSizing: "border-box" }}
                  >
                    <option value="">-- Custom / New Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. L'Oreal Hair Serum 100ml"
                  value={form.productName}
                  onChange={e => setForm({ ...form, productName: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "white", boxSizing: "border-box" }}
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Target Branch</label>
                  <select
                    value={form.branchId}
                    onChange={e => setForm({ ...form, branchId: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "white", boxSizing: "border-box" }}
                  >
                    <option value="">Main Salon (All Branches)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.currentStock}
                    onChange={e => setForm({ ...form, currentStock: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Required Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={form.requiredQty}
                    onChange={e => setForm({ ...form, requiredQty: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Est. Unit Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.unitCost}
                    onChange={e => setForm({ ...form, unitCost: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Preferred Vendor / Supplier</label>
                  <select
                    value={form.vendor}
                    onChange={e => setForm({ ...form, vendor: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "white", boxSizing: "border-box" }}
                  >
                    <option value="">Select a vendor</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "white", boxSizing: "border-box" }}
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Normal">Normal</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "white", boxSizing: "border-box" }}
                >
                  <option value="PENDING">PENDING (Pending Order)</option>
                  <option value="ORDERED">ORDERED (In Transit)</option>
                  <option value="RECEIVED">RECEIVED (Stocked)</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Restock Reason & Notes</label>
                <textarea
                  rows={3}
                  placeholder="Low stock alert, supplier quotes, or specific branch request notes..."
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12, borderTop: "1px solid #eee", paddingTop: 16 }}>
                <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : editingId ? "Update Requirement" : "Create Requirement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
