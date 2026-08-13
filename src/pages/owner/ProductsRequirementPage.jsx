import { useEffect, useState, useCallback } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { Package, Plus, Eye, Edit2, Trash2, ShoppingCart, Search } from "lucide-react";

const priorityColors = {
  LOW: { bg: "#f0fdf4", color: "#166534" },
  MEDIUM: { bg: "#fffbeb", color: "#d97706" },
  HIGH: { bg: "#fff7ed", color: "#c2410c" },
  URGENT: { bg: "#fef2f2", color: "#dc2626" }
};

const statusColors = {
  NEW: { bg: "#eff6ff", color: "#2563eb" },
  PENDING: { bg: "#fffbeb", color: "#d97706" },
  APPROVED: { bg: "#ecfdf5", color: "#10b981" },
  REJECTED: { bg: "#fef2f2", color: "#ef4444" },
  COMPLETED: { bg: "#f0fdf4", color: "#166534" }
};

const fmt = (val) => Number(val || 0).toLocaleString("en-IN");

export default function ProductsRequirementPage() {
  const [requirements, setRequirements] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [filter, setFilter] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [viewDetailReq, setViewDetailReq] = useState(null);
  const [statusUpdateReq, setStatusUpdateReq] = useState(null);
  const [requestModal, setRequestModal] = useState(null);
  const [requestForm, setRequestForm] = useState({ quantity: "1", priority: "MEDIUM", note: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resReq, resCat] = await Promise.all([
        api.get("/owner/product-requirements"),
        api.get("/owner/product-catalog").catch(() => ({ data: [] }))
      ]);
      setRequirements(resReq.data || []);
      setCatalog(resCat.data || []);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load data"), success: "" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openRequestModal = (product) => {
    setRequestModal(product);
    setRequestForm({
      quantity: "1",
      priority: "MEDIUM",
      note: ""
    });
  };

  const submitRequest = async () => {
    if (!requestModal) return;
    setSaving(true);
    try {
      await api.post("/owner/product-requirements", {
        catalogId: requestModal.id,
        productName: requestModal.productName,
        description: requestModal.description,
        category: requestModal.category,
        brand: requestModal.brand,
        packSize: requestModal.packSize,
        unitPackSize: requestModal.unitPackSize,
        unitPrice: requestModal.defaultPrice,
        quantity: requestForm.quantity,
        priority: requestForm.priority,
        note: requestForm.note
      });
      setStatus({ error: "", success: `Request submitted for ${requestModal.productName}` });
      setRequestModal(null);
      setRequestForm({ quantity: "1", priority: "MEDIUM", note: "" });
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not submit request"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/owner/product-requirements/${id}`, { status: newStatus });
      setStatus({ error: "", success: "Status updated." });
      setStatusUpdateReq(null);
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not update status"), success: "" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this requirement?")) return;
    try {
      await api.delete(`/owner/product-requirements/${id}`);
      await load();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to delete"), success: "" });
    }
  };

  const filteredCatalog = catalogSearch
    ? catalog.filter(c => c.productName.toLowerCase().includes(catalogSearch.toLowerCase()) || (c.category && c.category.toLowerCase().includes(catalogSearch.toLowerCase())))
    : catalog;

  const filtered = requirements.filter((r) => !filter || r.status === filter);

  if (loading) return <div className="page-shell"><PageLoader title="Loading products" /></div>;

  return (
    <div className="page-shell">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Product Requirements</h1>
            <p style={{ marginBottom: 0 }}>Browse available products and submit requests.</p>
          </div>
        </div>
      </div>

      {status.error && <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>{status.error} <button onClick={() => setStatus({ ...status, error: "" })} style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer" }}>✕</button></div>}
      {status.success && <div style={{ background: "#ecfdf5", color: "#065f46", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>{status.success} <button onClick={() => setStatus({ ...status, success: "" })} style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer" }}>✕</button></div>}

      {/* Available Products Section */}
      <div className="panel-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}><Package size={20} /> Available Products</h3>
          <div style={{ position: "relative", width: 300 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search products..."
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }}
            />
          </div>
        </div>
        {filteredCatalog.length === 0 ? (
          <EmptyState title="No Products Available" message="No products in the catalog yet." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filteredCatalog.map((product) => (
              <div key={product.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
                onClick={() => openRequestModal(product)}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fdf4ff", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Package size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{product.productName}</h4>
                    {product.brand && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{product.brand}</p>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#475569" }}>
                  {product.category && <div>Category: <b style={{ color: "#334155" }}>{product.category}</b></div>}
                  {product.packSize && <div>Pack Size: <b style={{ color: "#334155" }}>{product.packSize}</b></div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 16 }}>{product.defaultPrice ? `₹${fmt(product.defaultPrice)}` : "Price N/A"}</span>
                    <span style={{ fontSize: 12, color: product.availableQty > 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                      {product.availableQty > 0 ? `${product.availableQty} in stock` : "Out of stock"}
                    </span>
                  </div>
                </div>
                <button style={{ width: "100%", marginTop: 12, padding: "10px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <ShoppingCart size={14} /> Request This Product
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Requests Section */}
      <div className="panel-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>My Requests ({requirements.length})</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {["", "NEW", "PENDING", "APPROVED", "REJECTED", "COMPLETED"].map((s) => (
              <button key={s} type="button" onClick={() => setFilter(s)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", background: filter === s ? "#4f46e5" : "#f1f5f9", color: filter === s ? "white" : "#64748b" }}>
                {s || "All"}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? <EmptyState title="No requests yet" message="Click on a product above to submit a request." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((r) => {
              const pc = priorityColors[r.priority] || priorityColors.MEDIUM;
              const sc = statusColors[r.status] || statusColors.NEW;
              return (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", flex: 1 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fdf4ff", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={18} /></div>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{r.productName || "General"}</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{r.description || "No description"}</div>
                    </div>
                    <div style={{ minWidth: 100 }}>
                      <div style={{ fontSize: "0.85rem", color: "#475569" }}>{r.category || "-"}</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>x{r.quantity || 1} {r.packSize && `(${r.packSize})`}</div>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{r.unitPrice ? "\u20B9" + fmt(r.unitPrice) : "-"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ background: pc.bg, color: pc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>{r.priority}</span>
                    <span style={{ background: sc.bg, color: sc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 }}>{r.status}</span>
                    <button type="button" onClick={() => setViewDetailReq(r)} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }} title="View Detail">
                      <Eye size={14} />
                    </button>
                    <button type="button" onClick={() => setStatusUpdateReq(r)} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }} title="Update Status">
                      <Edit2 size={14} />
                    </button>
                    {r.status === "NEW" && (
                      <button type="button" onClick={() => handleDelete(r.id)} className="btn btn-secondary" style={{ padding: "6px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4, color: "#ef4444" }} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Modal - Click on product */}
      {requestModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 480, borderRadius: 16, padding: 24, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Request Product</h2>
              <button onClick={() => setRequestModal(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>✕</button>
            </div>

            {/* Product Info Card */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fdf4ff", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Package size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{requestModal.productName}</h3>
                  {requestModal.brand && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{requestModal.brand}</p>}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, color: "#475569" }}>
                {requestModal.category && <div>Category: <b>{requestModal.category}</b></div>}
                {requestModal.packSize && <div>Pack Size: <b>{requestModal.packSize}</b></div>}
                {requestModal.defaultPrice && <div>Price: <b style={{ color: "#10b981" }}>₹{fmt(requestModal.defaultPrice)}</b></div>}
                <div>Stock: <b style={{ color: requestModal.availableQty > 0 ? "#10b981" : "#ef4444" }}>{requestModal.availableQty || 0}</b></div>
              </div>
              {requestModal.description && (
                <p style={{ margin: "12px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{requestModal.description}</p>
              )}
            </div>

            {/* Request Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={requestForm.quantity}
                  onChange={e => setRequestForm({ ...requestForm, quantity: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Priority</label>
                <select
                  value={requestForm.priority}
                  onChange={e => setRequestForm({ ...requestForm, priority: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box", background: "#fff" }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#475569" }}>Note (Optional)</label>
                <textarea
                  rows={2}
                  value={requestForm.note}
                  onChange={e => setRequestForm({ ...requestForm, note: e.target.value })}
                  placeholder="Any additional notes..."
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16 }}>
              <button type="button" onClick={() => setRequestModal(null)} className="btn btn-secondary">Cancel</button>
              <button
                type="button"
                onClick={submitRequest}
                disabled={saving || !requestForm.quantity || parseInt(requestForm.quantity) < 1}
                className="btn btn-primary"
                style={{ opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}
              >
                {saving ? "Submitting..." : <><ShoppingCart size={14} /> Submit Request</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewDetailReq && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 520, borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,0.18)", overflow: "hidden" }}>
            <div style={{ height: 5, background: "linear-gradient(90deg, #475569, #334155, #0f172a)" }} />
            <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Package size={18} color="white" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>{viewDetailReq.productName}</h2>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{viewDetailReq.category || "Uncategorized"}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewDetailReq(null)} style={{ border: "none", background: "#f1f5f9", cursor: "pointer", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#64748b" }}>✕</button>
            </div>
            <div style={{ padding: "12px 24px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(() => { const sc = statusColors[viewDetailReq.status] || statusColors.NEW; return <span style={{ background: sc.bg, color: sc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>{viewDetailReq.status}</span>; })()}
              {(() => { const pc = priorityColors[viewDetailReq.priority] || priorityColors.MEDIUM; return <span style={{ background: pc.bg, color: pc.color, padding: "4px 10px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700 }}>{viewDetailReq.priority} Priority</span>; })()}
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Quantity</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{viewDetailReq.quantity || 1}</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Unit Price</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: viewDetailReq.unitPrice ? "#0f172a" : "#94a3b8" }}>{viewDetailReq.unitPrice ? "\u20B9" + fmt(viewDetailReq.unitPrice) : "N/A"}</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Est. Total</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: viewDetailReq.unitPrice ? "#10b981" : "#94a3b8" }}>{viewDetailReq.unitPrice ? "\u20B9" + fmt(viewDetailReq.unitPrice * (viewDetailReq.quantity || 1)) : "N/A"}</div>
                </div>
              </div>
              {viewDetailReq.description && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Description</div>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", fontSize: "0.88rem", color: "#334155", lineHeight: 1.6, borderLeft: "3px solid #334155" }}>{viewDetailReq.description}</div>
                </div>
              )}
              {viewDetailReq.note && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Note</div>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", fontSize: "0.88rem", color: "#334155", lineHeight: 1.6 }}>{viewDetailReq.note}</div>
                </div>
              )}
              <div style={{ height: 1, background: "#e2e8f0", margin: "4px 0 16px" }} />
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Created {new Date(viewDetailReq.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
            </div>
            <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => { setViewDetailReq(null); setStatusUpdateReq(viewDetailReq); }} className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6 }}><Edit2 size={14} /> Update Status</button>
              <button type="button" onClick={() => setViewDetailReq(null)} className="btn btn-primary" style={{ padding: "8px 20px", fontSize: "0.82rem", background: "#0f172a", border: "none" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusUpdateReq && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "white", width: "100%", maxWidth: 420, borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,0.18)", overflow: "hidden" }}>
            <div style={{ height: 5, background: "linear-gradient(90deg, #475569, #334155, #0f172a)" }} />
            <div style={{ padding: "20px 24px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Update Status</h2>
                <button onClick={() => setStatusUpdateReq(null)} style={{ border: "none", background: "#f1f5f9", cursor: "pointer", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#64748b" }}>✕</button>
              </div>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>Select the new status for <strong>{statusUpdateReq.productName}</strong></p>
            </div>
            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { key: "PENDING", label: "Pending", desc: "Awaiting review", color: "#d97706", bg: "#fffbeb" },
                { key: "APPROVED", label: "Approved", desc: "Request approved", color: "#10b981", bg: "#ecfdf5" },
                { key: "REJECTED", label: "Rejected", desc: "Request rejected", color: "#ef4444", bg: "#fef2f2" },
                { key: "COMPLETED", label: "Completed", desc: "Fulfilled", color: "#166534", bg: "#f0fdf4" }
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => updateStatus(statusUpdateReq.id, s.key)}
                  style={{
                    background: statusUpdateReq.status === s.key ? s.bg : "white",
                    border: statusUpdateReq.status === s.key ? `2px solid ${s.color}` : "1px solid #e2e8f0",
                    borderLeft: `4px solid ${s.color}`,
                    color: "#0f172a",
                    padding: "12px 16px",
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: 12,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 12
                  }}
                  onMouseEnter={e => { if (statusUpdateReq.status !== s.key) e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={e => { if (statusUpdateReq.status !== s.key) e.currentTarget.style.background = "white"; }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{s.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>{s.desc}</div>
                  </div>
                  {statusUpdateReq.status === s.key && (
                    <span style={{ marginLeft: "auto", fontSize: "0.7rem", fontWeight: 700, color: s.color, background: s.bg, padding: "3px 8px", borderRadius: 100 }}>Current</span>
                  )}
                </button>
              ))}
            </div>
            <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setStatusUpdateReq(null)} className="btn btn-secondary" style={{ padding: "8px 20px", fontSize: "0.82rem" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
