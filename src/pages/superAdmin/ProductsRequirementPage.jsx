import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { Clock, CheckCircle, X, ExternalLink, Calendar, Users, Package, Briefcase, Plus, Edit2, Trash2, Mail, Phone } from "lucide-react";

const statusConfig = {
  NEW: { label: "New", color: "#2563eb", bg: "#eff6ff", icon: Clock },
  PENDING: { label: "Pending", color: "#d97706", bg: "#fffbeb", icon: Clock },
  APPROVED: { label: "Approved", color: "#10b981", bg: "#d1fae5", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "#ef4444", bg: "#fef2f2", icon: X },
  COMPLETED: { label: "Completed", color: "#166534", bg: "#f0fdf4", icon: CheckCircle }
};

const priorityColors = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  URGENT: "#dc2626"
};

const emptyCatalog = {
  productName: "",
  description: "",
  category: "",
  brand: "",
  packSize: "",
  unitPackSize: "",
  defaultPrice: "",
  availableQty: "0"
};

export default function SuperAdminProductsRequirementPage() {
  const [requirements, setRequirements] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("requests");
  const [filter, setFilter] = useState(searchParams.get("status") || "ALL");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedReq, setSelectedReq] = useState(null);
  const [catalogForm, setCatalogForm] = useState(emptyCatalog);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [editCatalogItem, setEditCatalogItem] = useState(null);
  const [catalogSearch, setCatalogSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [resReqs, resCat] = await Promise.all([
        api.get("/super-admin/product-requirements"),
        api.get("/super-admin/product-catalog")
      ]);
      setRequirements(resReqs.data || []);
      setCatalog(resCat.data || []);
    } catch (err) {
      setError(formatApiError(err, "Failed to load data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status, internalNotes) => {
    setUpdatingId(id);
    try {
      const data = { status };
      if (internalNotes !== undefined) data.internalNotes = internalNotes;
      await api.patch(`/super-admin/product-requirements/${id}`, data);
      load();
      if (selectedReq && selectedReq.id === id) {
        setSelectedReq({ ...selectedReq, status, internalNotes: internalNotes !== undefined ? internalNotes : selectedReq.internalNotes });
      }
    } catch (err) {
      alert(formatApiError(err, "Failed to update status"));
    } finally {
      setUpdatingId(null);
    }
  };

  const saveCatalogItem = async (e) => {
    e.preventDefault();
    try {
      if (editCatalogItem) {
        await api.patch(`/super-admin/product-catalog/${editCatalogItem.id}`, catalogForm);
      } else {
        await api.post("/super-admin/product-catalog", catalogForm);
      }
      setCatalogForm(emptyCatalog);
      setShowCatalogModal(false);
      setEditCatalogItem(null);
      await load();
    } catch (err) {
      alert(formatApiError(err, "Failed to save"));
    }
  };

  const deleteCatalogItem = async (id) => {
    if (!window.confirm("Delete this catalog item?")) return;
    try {
      await api.delete(`/super-admin/product-catalog/${id}`);
      await load();
    } catch (err) {
      alert(formatApiError(err, "Failed to delete"));
    }
  };

  const openEditCatalog = (item) => {
    setEditCatalogItem(item);
    setCatalogForm({
      productName: item.productName || "",
      description: item.description || "",
      category: item.category || "",
      brand: item.brand || "",
      packSize: item.packSize || "",
      unitPackSize: item.unitPackSize || "",
      defaultPrice: item.defaultPrice ? String(item.defaultPrice) : "",
      availableQty: String(item.availableQty || 0)
    });
    setShowCatalogModal(true);
  };

  const filtered = filter === "ALL" ? requirements : requirements.filter(r => r.status === filter);
  const filteredCatalog = catalogSearch
    ? catalog.filter(c => c.productName.toLowerCase().includes(catalogSearch.toLowerCase()) || (c.category && c.category.toLowerCase().includes(catalogSearch.toLowerCase())))
    : catalog;

  const counts = {
    ALL: requirements.length,
    NEW: requirements.filter(r => r.status === "NEW").length,
    PENDING: requirements.filter(r => r.status === "PENDING").length,
    APPROVED: requirements.filter(r => r.status === "APPROVED").length,
    REJECTED: requirements.filter(r => r.status === "REJECTED").length,
    COMPLETED: requirements.filter(r => r.status === "COMPLETED").length
  };

  if (loading) return <div className="page-shell super-admin-page"><PageLoader title="Loading product requirements" /></div>;

  return (
    <div className="page-shell super-admin-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Product Requirements</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Manage product catalog and salon product requests</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setActiveTab("catalog")} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: activeTab === "catalog" ? "2px solid #0f172a" : "1px solid #e2e8f0", cursor: "pointer", background: activeTab === "catalog" ? "#0f172a" : "#fff", color: activeTab === "catalog" ? "#fff" : "#475569" }}>
            Available Products
          </button>
          <button onClick={() => setActiveTab("requests")} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: activeTab === "requests" ? "2px solid #0f172a" : "1px solid #e2e8f0", cursor: "pointer", background: activeTab === "requests" ? "#0f172a" : "#fff", color: activeTab === "requests" ? "#fff" : "#475569" }}>
            Product Requests
          </button>
        </div>
      </div>

      {error && <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {activeTab === "catalog" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <input type="text" placeholder="Search products..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, width: 300 }} />
            <button onClick={() => { setEditCatalogItem(null); setCatalogForm(emptyCatalog); setShowCatalogModal(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer", background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 600 }}>
              <Plus size={14} /> Add Product
            </button>
          </div>
          {filteredCatalog.length === 0 ? (
            <EmptyState title="No Products" message="No products in the catalog yet." />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredCatalog.map((item) => (
                <div key={item.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", flex: 1 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fdf4ff", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={18} /></div>
                    <div style={{ minWidth: 200 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.productName}</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{item.description || "No description"}</div>
                    </div>
                    <div style={{ minWidth: 100 }}><span style={{ fontSize: "0.78rem", color: "#64748b" }}>{item.category || "N/A"}</span></div>
                    <div style={{ minWidth: 80 }}><span style={{ fontSize: "0.78rem", color: "#64748b" }}>{item.brand || "N/A"}</span></div>
                    <div style={{ minWidth: 60 }}><span style={{ fontSize: "0.78rem", color: "#64748b" }}>{item.packSize || "N/A"}</span></div>
                    <div style={{ minWidth: 80 }}><span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0f172a" }}>{item.defaultPrice ? `₹${item.defaultPrice}` : "N/A"}</span></div>
                    <div style={{ minWidth: 60 }}><span style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: 600 }}>{item.availableQty} in stock</span></div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEditCatalog(item)} style={{ padding: 6, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#475569" }}><Edit2 size={14} /></button>
                    <button onClick={() => deleteCatalogItem(item.id)} style={{ padding: 6, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#ef4444" }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {["ALL", "NEW", "PENDING", "APPROVED", "REJECTED", "COMPLETED"].map(key => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                background: filter === key ? "#0f172a" : "#f1f5f9",
                color: filter === key ? "#fff" : "#64748b"
              }}>
                {key === "ALL" ? "All" : statusConfig[key]?.label} ({counts[key] || 0})
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No Requirements" message={filter === "ALL" ? "No product requirements submitted yet." : `No ${statusConfig[filter]?.label.toLowerCase()} requirements.`} />
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {filtered.map((req) => {
                const status = statusConfig[req.status] || statusConfig.NEW;
                const StatusIcon = status.icon;
                return (
                  <div key={req.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 280 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", margin: 0 }}>{req.productName}</h3>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: status.color, background: status.bg }}>
                            <StatusIcon size={12} /> {status.label}
                          </span>
                        </div>
                        {req.salon && (
                          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 4px" }}>
                            Salon: <b style={{ color: "#334155" }}>{req.salon.name}</b>
                            {req.salon.slug && <span style={{ color: "#94a3b8" }}> ({req.salon.slug})</span>}
                          </p>
                        )}
                        {req.owner && (
                          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#64748b", marginTop: 4, flexWrap: "wrap" }}>
                            {req.owner.name && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={12} /> {req.owner.name}</span>}
                            {req.owner.email && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={12} /> {req.owner.email}</span>}
                            {req.owner.phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} /> {req.owner.phone}</span>}
                          </div>
                        )}
                        {req.description && <p style={{ fontSize: 14, color: "#475569", margin: "8px 0" }}>{req.description}</p>}
                        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#64748b", flexWrap: "wrap", marginTop: 8 }}>
                          <span>Category: <b style={{ color: "#334155" }}>{req.category || "N/A"}</b></span>
                          <span>Brand: <b style={{ color: "#334155" }}>{req.brand || "N/A"}</b></span>
                          <span>Quantity: <b style={{ color: "#334155" }}>{req.quantity} {req.packSize && `(${req.packSize})`}</b></span>
                          <span>Priority: <b style={{ color: priorityColors[req.priority] || "#334155" }}>{req.priority}</b></span>
                        </div>
                        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                          Submitted: {new Date(req.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                        <button onClick={() => setSelectedReq(req)} style={{
                          padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #cbd5e1", cursor: "pointer",
                          background: "#fff", color: "#475569", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
                        }}>
                          <ExternalLink size={14} /> View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedReq && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} onClick={() => setSelectedReq(null)} />
          <div style={{ background: "#fff", width: "100%", maxWidth: 700, borderRadius: 16, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#f8fafc", borderRadius: "16px 16px 0 0" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{selectedReq.productName}</h2>
                  {(() => {
                    const status = statusConfig[selectedReq.status] || statusConfig.NEW;
                    const StatusIcon = status.icon;
                    return (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: status.color, background: status.bg }}>
                        <StatusIcon size={14} /> {status.label}
                      </span>
                    );
                  })()}
                </div>
                {selectedReq.salon && (
                  <p style={{ margin: 0, fontSize: 14, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={14} /> Salon: <span style={{ fontWeight: 600, color: "#334155" }}>{selectedReq.salon.name}</span>
                  </p>
                )}
                {selectedReq.owner && (
                  <div style={{ margin: "8px 0 0", padding: "10px 14px", background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd", display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.05em" }}>Owner Details</span>
                    <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#334155" }}>
                      <span><b>{selectedReq.owner.name}</b></span>
                      {selectedReq.owner.email && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={12} /> {selectedReq.owner.email}</span>}
                      {selectedReq.owner.phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} /> {selectedReq.owner.phone}</span>}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedReq(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: "24px 32px", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #f1f5f9" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <Package size={14} /> Product Details
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Category:</span><span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{selectedReq.category || "N/A"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Brand:</span><span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{selectedReq.brand || "N/A"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Quantity:</span><span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{selectedReq.quantity} {selectedReq.packSize && `(${selectedReq.packSize})`}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Est. Price:</span><span style={{ fontWeight: 600, color: "#10b981", fontSize: 13 }}>{selectedReq.unitPrice ? `₹${selectedReq.unitPrice}` : "N/A"}</span></div>
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #f1f5f9" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={14} /> Timeline & Info
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Submitted:</span><span style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{new Date(selectedReq.createdAt).toLocaleDateString()}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b", fontSize: 13 }}>Priority:</span><span style={{ fontWeight: 700, color: priorityColors[selectedReq.priority] || "#0f172a", fontSize: 13 }}>{selectedReq.priority}</span></div>
                  </div>
                </div>
              </div>
              {selectedReq.description && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#334155" }}>Description</h4>
                  <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.6, background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #f1f5f9" }}>{selectedReq.description}</p>
                </div>
              )}
              {selectedReq.vendor && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#334155" }}>Vendor</h4>
                  <p style={{ margin: 0, fontSize: 14, color: "#475569" }}>{selectedReq.vendor}</p>
                </div>
              )}
              {selectedReq.internalNotes && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#334155" }}>Admin Notes</h4>
                  <p style={{ margin: 0, fontSize: 14, color: "#475569", background: "#fffbeb", padding: 16, borderRadius: 8, border: "1px solid #fef3c7" }}>{selectedReq.internalNotes}</p>
                </div>
              )}
            </div>

            <div style={{ padding: "20px 32px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", borderRadius: "0 0 16px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Update Status:</span>
                <div style={{ display: "flex", background: "#e2e8f0", borderRadius: 8, padding: 4 }}>
                  {[
                    { val: "NEW", label: "New" },
                    { val: "PENDING", label: "Pending" },
                    { val: "APPROVED", label: "Approved" },
                    { val: "REJECTED", label: "Rejected" },
                    { val: "COMPLETED", label: "Completed" }
                  ].map(st => {
                    const isActive = selectedReq.status === st.val;
                    return (
                      <button
                        key={st.val}
                        disabled={updatingId === selectedReq.id}
                        onClick={() => updateStatus(selectedReq.id, st.val)}
                        style={{
                          padding: "6px 12px",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: isActive ? "#fff" : "transparent",
                          color: isActive ? "#0f172a" : "#64748b",
                          boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                          transition: "all 0.2s"
                        }}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
                {updatingId === selectedReq.id && <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>Saving...</span>}
              </div>
              <button onClick={() => setSelectedReq(null)} style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCatalogModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} onClick={() => { setShowCatalogModal(false); setCatalogForm(emptyCatalog); setEditCatalogItem(null); }} />
          <div style={{ background: "#fff", width: "100%", maxWidth: 540, borderRadius: 16, padding: 24, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", position: "relative", zIndex: 1, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{editCatalogItem ? "Edit Product" : "Add Product to Catalog"}</h2>
            <form onSubmit={saveCatalogItem} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Product Name *</label>
                <input type="text" required value={catalogForm.productName} onChange={e => setCatalogForm({ ...catalogForm, productName: e.target.value })} placeholder="e.g. Hair Dryer" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Description</label>
                <textarea rows={2} value={catalogForm.description} onChange={e => setCatalogForm({ ...catalogForm, description: e.target.value })} placeholder="Product description..." style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Category</label>
                  <input type="text" value={catalogForm.category} onChange={e => setCatalogForm({ ...catalogForm, category: e.target.value })} placeholder="e.g. Hair Care" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Brand</label>
                  <input type="text" value={catalogForm.brand} onChange={e => setCatalogForm({ ...catalogForm, brand: e.target.value })} placeholder="e.g. L'Oreal" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Pack Size</label>
                  <input type="text" value={catalogForm.packSize} onChange={e => setCatalogForm({ ...catalogForm, packSize: e.target.value })} placeholder="e.g. 500ml" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Unit Pack Size</label>
                  <input type="text" value={catalogForm.unitPackSize} onChange={e => setCatalogForm({ ...catalogForm, unitPackSize: e.target.value })} placeholder="e.g. per piece" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Default Price (₹)</label>
                  <input type="number" min="0" step="0.01" value={catalogForm.defaultPrice} onChange={e => setCatalogForm({ ...catalogForm, defaultPrice: e.target.value })} placeholder="0.00" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Available Quantity</label>
                  <input type="number" min="0" value={catalogForm.availableQty} onChange={e => setCatalogForm({ ...catalogForm, availableQty: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8, borderTop: "1px solid #eee", paddingTop: 16 }}>
                <button type="button" onClick={() => { setShowCatalogModal(false); setCatalogForm(emptyCatalog); setEditCatalogItem(null); }} className="btn btn-secondary" style={{ padding: "8px 20px" }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: "8px 20px" }}>{editCatalogItem ? "Update" : "Add Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
