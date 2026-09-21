import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { useBranch } from "../../context/BranchContext";
import { formatApiError } from "../../utils/apiError";

import CustomSelect from "../../components/CustomSelect";
import { Scissors, Download, Upload, ChevronDown } from "lucide-react";

const emptyForm = {
  name: "",
  price: 0,
  durationMin: 30,
  categoryId: "",
  description: "",
  taxRate: 0,
  commissionPct: 0,
  onlineBookingEnabled: false,
  isFeatured: false,
  isPopular: false,
  showOnWebsite: false,
  imageUrl: ""
};

const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
  { value: 300, label: "5 hours" }
];

export default function ServicesPage() {
  const { selectedBranchId, branches } = useBranch();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState({ error: "", success: "", loading: true });
  const [imageUploading, setImageUploading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importing, setImporting] = useState(false);

  const title = useMemo(() => (editingId ? "Update Service" : "Add Service"), [editingId]);

  const load = async (branchId = selectedBranchId) => {
    const [servicesResponse, catsResponse] = await Promise.all([
      api.get("/owner/services", { params: branchId ? { branchId } : {} }),
      api.get("/owner/service-categories", { params: branchId ? { branchId } : {} })
    ]);
    setRows(servicesResponse.data);
    setCategories(catsResponse.data);
    setStatus((current) => ({ ...current, loading: false }));
  };

  useEffect(() => {
    let active = true;
    load();
    return () => { active = false; };
  }, [selectedBranchId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ error: "", success: "" });
    if (!form.imageUrl) {
      setStatus({ error: "Service image is required.", success: "" });
      return;
    }
    const payload = {
      ...form,
      price: Number(form.price),
      durationMin: Number(form.durationMin),
      branchId: selectedBranchId || undefined,
      categoryId: form.categoryId || null,
      taxRate: Number(form.taxRate || 0),
      commissionPct: Number(form.commissionPct || 0)
    };
    try {
      if (editingId) {
        await api.patch(`/owner/services/${editingId}`, payload);
        setStatus({ error: "", success: "Service updated." });
      } else {
        await api.post("/owner/services", payload);
        setStatus({ error: "", success: "Service added." });
      }
      resetForm();
      await load(selectedBranchId);
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save service"), success: "" });
    }
  };

  const archiveService = async (serviceId) => {
    await api.patch(`/owner/services/${serviceId}/archive`);
    if (editingId === serviceId) resetForm();
    await load(selectedBranchId);
  };

  const startEdit = (service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      price: Number(service.price || 0),
      durationMin: Number(service.durationMin || 30),
      categoryId: service.categoryId || "",
      description: service.description || "",
      taxRate: Number(service.taxRate || 0),
      commissionPct: Number(service.commissionPct || 0),
      onlineBookingEnabled: Boolean(service.onlineBookingEnabled),
      isFeatured: Boolean(service.isFeatured),
      isPopular: Boolean(service.isPopular),
      showOnWebsite: Boolean(service.showOnWebsite),
      imageUrl: service.imageUrl || ""
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setStatus({ error: "", success: "", loading: false });
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setForm((f) => ({ ...f, imageUrl: response.data?.url || "" }));
      setStatus({ error: "", success: "Image uploaded successfully.", loading: false });
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to upload image."), success: "", loading: false });
    } finally {
      setImageUploading(false);
    }
  };

  useEffect(() => {
    if (!showExportMenu) return;
    const close = () => setShowExportMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showExportMenu]);

  const downloadTestData = () => {
    setShowExportMenu(false);
    const headers = "NAME (Mandatory),PRICE (Mandatory),DURATION_MIN (Mandatory),CATEGORY (Optional),TAX_RATE% (Optional),COMMISSION% (Optional),DESCRIPTION (Optional)\n";
    const rows = [
      "Haircut,350,30,Hair,18,10,Classic haircut for men and women",
      "Hair Color,1200,60,Hair,18,12,Full hair coloring with premium colors",
      "Facial,800,45,Skin,18,10,Deep cleansing facial treatment",
      "Manicure,400,30,Nails,18,8,Basic nail care and polish",
      "Pedicure,500,45,Nails,18,8,Foot care and nail treatment",
      "Head Massage,300,20,Massage,18,10,Relaxing scalp massage",
      "Eyebrow Threading,100,15,Beauty,18,5,Precise eyebrow shaping",
      "Waxing Full Arms,400,30,Beauty,18,10,Full arm waxing service",
      "Bridal Makeup,5000,120,Makeup,18,15,Complete bridal makeup package",
      "Hair Spa,1500,60,Hair,18,12,Intensive hair treatment and spa"
    ].join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "Service_Test_Data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (format = "csv") => {
    setShowExportMenu(false);
    const headers = "Name,Category,Price,Duration (min),Tax Rate (%),Commission (%),Online Booking,Website Visible,Featured,Popular,Description\n";
    const csvRows = rows.map((s) => [
      `"${(s.name || "").replace(/"/g, '""')}"`,
      `"${(s.category?.name || "").replace(/"/g, '""')}"`,
      s.price || 0,
      s.durationMin || 30,
      s.taxRate || 0,
      s.commissionPct || 0,
      s.onlineBookingEnabled ? "Yes" : "No",
      s.showOnWebsite ? "Yes" : "No",
      s.isFeatured ? "Yes" : "No",
      s.isPopular ? "Yes" : "No",
      `"${(s.description || "").replace(/"/g, '""')}"`
    ].join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + csvRows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `Services_${new Date().toISOString().slice(0, 10)}.${format === "csv" ? "csv" : "csv"}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      setStatus({ error: "", success: "Importing services..." });
      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          setStatus({ error: "CSV file has no data rows.", success: "" });
          return;
        }
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
        const nameIdx = headers.findIndex(h => h.includes("name"));
        const priceIdx = headers.findIndex(h => h.includes("price"));
        const durIdx = headers.findIndex(h => h.includes("duration"));
        const catIdx = headers.findIndex(h => h.includes("category"));
        const taxIdx = headers.findIndex(h => h.includes("tax"));
        const commIdx = headers.findIndex(h => h.includes("commission"));
        const descIdx = headers.findIndex(h => h.includes("description") || h.includes("desc"));

        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const rawCols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
          const cols = rawCols.map(c => c.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
          const name = nameIdx !== -1 ? cols[nameIdx] : "";
          const price = priceIdx !== -1 ? Number(cols[priceIdx]) : 0;
          const durationMin = durIdx !== -1 ? Number(cols[durIdx]) || 30 : 30;
          if (!name || isNaN(price)) {
            errorCount++;
            continue;
          }
          const catName = catIdx !== -1 ? cols[catIdx] : "";
          const matchedCategory = catName ? categories.find(c => c.name?.toLowerCase() === catName.toLowerCase()) : null;
          const taxRate = taxIdx !== -1 ? Number(cols[taxIdx]) || 0 : 0;
          const commissionPct = commIdx !== -1 ? Number(cols[commIdx]) || 0 : 0;
          const description = descIdx !== -1 ? cols[descIdx] : "";

          try {
            await api.post("/owner/services", {
              name,
              price,
              durationMin,
              branchId: selectedBranchId || undefined,
              categoryId: matchedCategory?.id || null,
              taxRate,
              commissionPct,
              description
            });
            successCount++;
          } catch {
            errorCount++;
          }
        }
        setStatus({
          success: `Import completed: ${successCount} services created, ${errorCount} errors.`,
          error: ""
        });
        await load(selectedBranchId);
      } catch (err) {
        setStatus({ error: formatApiError(err, "Failed to import services"), success: "" });
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const branchLabel = selectedBranchId ? branches.find((item) => item.id === selectedBranchId)?.name : "All";

  return (
    <div className="page-shell">
      <div className="item-head" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2>Services</h2>
          <p className="muted">Services stay branch-aware so POS, invoices, and reports always use the right active catalog.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="crm-btn"
            onClick={handleImportClick}
            disabled={importing}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#3b82f6", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", minHeight: "unset", height: "auto", lineHeight: 1.2 }}
          >
            <Upload size={14} /> {importing ? "Importing..." : "Import"}
          </button>
          <div className="export-dropdown" style={{ position: "relative" }}>
            <button
              type="button"
              className="crm-btn"
              onClick={(e) => { e.stopPropagation(); setShowExportMenu(v => !v); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#3b82f6", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", minHeight: "unset", height: "auto", lineHeight: 1.2 }}
            >
              <Download size={14} /> Export <ChevronDown size={14} />
            </button>
            {showExportMenu && (
              <div
                className="export-menu"
                onClick={(e) => e.stopPropagation()}
                style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 155, zIndex: 9999, overflow: "hidden" }}
              >
                <button
                  type="button"
                  className="export-item"
                  onClick={() => handleExport("xlsx")}
                  style={{ width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: "0.78rem", color: "#475569", minHeight: "unset" }}
                >
                  Export as XLSX
                </button>
                <button
                  type="button"
                  className="export-item"
                  onClick={() => handleExport("xls")}
                  style={{ width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: "0.78rem", color: "#475569", minHeight: "unset" }}
                >
                  Export as XLS
                </button>
                <button
                  type="button"
                  className="export-item"
                  onClick={() => handleExport("csv")}
                  style={{ width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: "0.78rem", color: "#475569", minHeight: "unset" }}
                >
                  Export as CSV
                </button>
                <div style={{ height: 1, background: "#e2e8f0", margin: "2px 0" }} />
                <button
                  type="button"
                  className="export-item"
                  onClick={downloadTestData}
                  style={{ width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: "0.78rem", color: "#2563eb", fontWeight: 600, minHeight: "unset" }}
                >
                  Download Test Data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="settings-section-grid">
        <div className="panel-card">
          <h3>{title}</h3>
          <form onSubmit={submit} className="form-grid">
            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
              <div style={{ width: 80, height: 80, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px dashed #cbd5e1" }}>
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="Service" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Scissors size={28} color="#94a3b8" />
                )}
              </div>
              <div>
                <label className="secondary-button" style={{ display: "inline-block", cursor: "pointer" }}>
                  {imageUploading ? "Uploading..." : "Upload Service Image *"}
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={imageUploading} hidden />
                </label>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Required. Max 5MB.</p>
              </div>
            </div>
            <input placeholder="Service name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input type="number" min="0" placeholder="Price" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            <CustomSelect value={form.durationMin} onChange={(event) => setForm({ ...form, durationMin: event.target.value })}>
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </CustomSelect>
            <CustomSelect value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
              <option value="">No Category</option>
              {(categories || []).flatMap(cat => [
                <option key={cat.id} value={cat.id} style={{ fontWeight: 700 }}>{cat.name}</option>,
                ...(cat.children || []).map(sub => (
                  <option key={sub.id} value={sub.id}>&nbsp;&nbsp;{cat.name} / {sub.name}</option>
                ))
              ])}
            </CustomSelect>
            <input type="number" min="0" placeholder="Tax rate %" value={form.taxRate} onChange={(event) => setForm({ ...form, taxRate: event.target.value })} />
            <input type="number" min="0" placeholder="Commission %" value={form.commissionPct} onChange={(event) => setForm({ ...form, commissionPct: event.target.value })} />
            <textarea style={{ gridColumn: "1 / -1" }} rows="4" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <div className="badge-row" style={{ gridColumn: "1 / -1" }}>
              <label className="badge" style={{ gap: 8 }}><input type="checkbox" checked={form.onlineBookingEnabled} onChange={(event) => setForm({ ...form, onlineBookingEnabled: event.target.checked })} />Online booking</label>
              <label className="badge" style={{ gap: 8 }}><input type="checkbox" checked={form.showOnWebsite} onChange={(event) => setForm({ ...form, showOnWebsite: event.target.checked })} />Show on Website</label>
              <label className="badge" style={{ gap: 8 }}><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} />Featured</label>
              <label className="badge" style={{ gap: 8 }}><input type="checkbox" checked={form.isPopular} onChange={(event) => setForm({ ...form, isPopular: event.target.checked })} />Popular</label>
            </div>
            <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
              <button>{editingId ? "Save Service" : "Create Service"}</button>
              {editingId && <button type="button" className="secondary-button" onClick={resetForm}>Cancel Edit</button>}
            </div>
          </form>
          {status.error && <p className="error-text">{status.error}</p>}
          {status.success && <p className="success-text">{status.success}</p>}
        </div>

        <div className="panel-card">
          <h3>Catalog Summary</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Visible Services</div>
              <div className="stat-value">{rows.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Branch Filter</div>
              <div className="stat-value" style={{ fontSize: 18 }}>{branchLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {status.loading ? (
        <PageLoader
          title="Loading service catalog"
          message="Refreshing branch-aware services, pricing, duration, and booking visibility controls."
        />
      ) : null}

      <div className="list-stack" style={{ marginTop: 18 }}>
        {rows.map((service) => (
          <div key={service.id} className={`list-card ${editingId === service.id ? "active-row" : ""}`}>
            <div className="item-head">
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {service.imageUrl && (
                  <img src={service.imageUrl} alt={service.name} style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} />
                )}
                <div>
                  <strong>{service.name}</strong>
                <div className="item-meta">Price {String(service.price)} | Duration {service.durationMin} min | Tax {String(service.taxRate || 0)}%</div>
                <div className="item-meta">{service.branch?.name || "Available across branches"}</div>
                <div className="item-meta">Category: {service.category?.name || "Uncategorized"}</div>
                <div className="item-meta">Commission {String(service.commissionPct || 0)}% | Booking {service.onlineBookingEnabled ? "Enabled" : "Disabled"}</div>
                <div className="item-meta">{service.description || "No description added"}</div>
              </div>
              <div className="inline-actions">
                <button type="button" className="secondary-button" onClick={() => startEdit(service)}>Edit</button>
                <button type="button" className="danger-button" onClick={() => archiveService(service.id)}>Archive</button>
              </div>
            </div>
            <div className="badge-row">
              {service.showOnWebsite && <span className="badge" style={{ background: "#dbeafe", color: "#1e40af" }}>🌐 Website</span>}
              {service.isFeatured && <span className="badge">Featured</span>}
              {service.isPopular && <span className="badge">Popular</span>}
            </div>
          </div>
        ))}
        {!status.loading && !rows.length && (
          <EmptyState
            title="No services found"
            message="No service entries match the selected branch scope right now."
          />
        )}
      </div>
    </div>
  );
}

