import { useEffect, useMemo, useState, useRef } from "react";
import { api } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { formatApiError } from "../../utils/apiError";
import { Search, RotateCcw, Clock, Activity } from "lucide-react";

const getEventTheme = (type = "") => {
  const t = type.toUpperCase();
  if (t.includes("SALON")) return { bg: "#ecfdf5", color: "#10b981", iconBg: "#d1fae5" };
  if (t.includes("PLAN")) return { bg: "#e0e7ff", color: "#4f46e5", iconBg: "#c7d2fe" };
  if (t.includes("SUBSCRIPTION") || t.includes("SUB_")) return { bg: "#f5f3ff", color: "#7c3aed", iconBg: "#ddd6fe" };
  if (t.includes("SUPPORT") || t.includes("TICKET")) return { bg: "#fff7ed", color: "#ea580c", iconBg: "#ffedd5" };
  if (t.includes("SETTINGS") || t.includes("SYSTEM")) return { bg: "#fdf2f8", color: "#db2777", iconBg: "#fce7f3" };
  return { bg: "#f8fafc", color: "#64748b", iconBg: "#e2e8f0" };
};

export default function AuditLogsPage() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [status, setStatus] = useState({ loading: true, error: "" });
  const debounceRef = useRef(null);

  const typeOptions = useMemo(() => [...new Set(rows.map((r) => r.type).filter(Boolean))], [rows]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    let active = true;
    setStatus((s) => ({ ...s, loading: true }));
    api.get("/super-admin/audit-logs", {
      params: { ...(debouncedQuery ? { q: debouncedQuery } : {}), ...(typeFilter ? { type: typeFilter } : {}) }
    }).then((res) => {
      if (!active) return;
      setRows(res.data || []);
      setStatus({ loading: false, error: "" });
    }).catch((err) => {
      if (!active) return;
      setRows([]);
      setStatus({ loading: false, error: formatApiError(err, "Could not load audit logs") });
    });
    return () => { active = false; };
  }, [debouncedQuery, typeFilter]);

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Audit Logs</h1>
            <p style={{ marginBottom: 0 }}>Platform-wide governance events and recent SaaS changes.</p>
          </div>
          <div className="badge-row">
            <span className="badge" style={{ background: "#eff6ff", color: "#1e40af", fontWeight: 700 }}>Entries: {rows.length}</span>
          </div>
        </div>
      </div>

      <div className="panel-card" style={{ marginBottom: 24, padding: "20px 24px", background: "white", border: "1px solid #e2e8f0", borderRadius: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 260, position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 14 }} />
            <input 
              className="search-input-field"
              value={query} 
              placeholder="Search action, type, or metadata..." 
              onChange={(e) => setQuery(e.target.value)} 
              style={{ width: "100%", fontSize: 13, border: "1px solid #cbd5e1", background: "#f8fafc" }} 
            />
          </div>
          <div style={{ width: 220 }}>
            <CustomSelect 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)} 
              options={[
                { label: "All Event Types", value: "" },
                ...typeOptions.map(t => ({ label: t, value: t }))
              ]}
              placeholder="All Event Types"
              style={{ width: "100%", height: 38 }}
            />
          </div>
          <div>
            <button 
              type="button" 
              onClick={() => { setQuery(""); setTypeFilter(""); }}
              style={{ 
                height: 48,
                minHeight: 48,
                padding: "0 22px", 
                borderRadius: 14, 
                background: "#f1f5f9", 
                color: "#475569", 
                fontWeight: 700, 
                fontSize: 13, 
                border: "none", 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                gap: 8,
                transition: "all 0.15s"
              }}
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {status.error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{status.error}</p>}

      {status.loading ? (
        <PageLoader compact title="Loading audit logs" message="Fetching events..." />
      ) : rows.length ? (
        <div>
          {rows.map((row) => {
            const theme = getEventTheme(row.type);
            return (
              <div 
                key={row.id} 
                style={{ 
                  background: "white", 
                  border: "1px solid #e2e8f0", 
                  borderRadius: 16, 
                  padding: "16px 20px", 
                  marginBottom: 16,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.iconBg, color: theme.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Activity size={18} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 800, color: theme.color, background: theme.bg, padding: "2px 8px", borderRadius: 6, textTransform: "uppercase" }}>{row.type}</span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>{row.action}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "#64748b" }}>
                      <Clock size={13} />
                      <span>{new Date(row.createdAt).toLocaleString()}</span>
                    </div>
                    {row.actorName && (
                      <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>
                        Changed by: <strong style={{ color: "#0f172a" }}>{row.actorName}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {row.summary && (
                  <p style={{ margin: "0 0 10px 48px", fontSize: "0.82rem", color: "#475569" }}>
                    {row.summary}
                  </p>
                )}

                {row.meta?.changes && Object.keys(row.meta.changes).length > 0 ? (
                  <div style={{ marginLeft: 48, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginTop: 8 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#334155", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Changed Values
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {Object.entries(row.meta.changes).map(([field, diff]) => (
                        <div key={field} style={{ display: "grid", gridTemplateColumns: "180px 1fr 20px 1fr", gap: 8, alignItems: "center", fontSize: "0.78rem", background: "white", padding: "6px 10px", borderRadius: 6, border: "1px solid #f1f5f9" }}>
                          <span style={{ fontWeight: 700, color: "#1e293b" }}>{field.replace(/([A-Z])/g, ' $1')}</span>
                          <span style={{ color: "#dc2626", background: "#fef2f2", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {typeof diff?.from === "object" ? JSON.stringify(diff?.from) : String(diff?.from ?? "empty")}
                          </span>
                          <span style={{ textAlign: "center", color: "#94a3b8", fontWeight: 800 }}>→</span>
                          <span style={{ color: "#16a34a", background: "#f0fdf4", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {typeof diff?.to === "object" ? JSON.stringify(diff?.to) : String(diff?.to ?? "empty")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : row.meta && Object.keys(row.meta).length > 0 ? (
                  <div style={{ marginLeft: 48, background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 10, padding: "10px 14px", marginTop: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "6px 14px" }}>
                      {Object.entries(row.meta).map(([key, val]) => (
                        <div key={key} style={{ display: "flex", fontSize: "0.78rem", gap: 6 }}>
                          <span style={{ fontWeight: 700, color: "#64748b", textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span style={{ color: "#334155", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {typeof val === "object" ? JSON.stringify(val) : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontStyle: "italic", marginTop: 4, paddingLeft: 48 }}>No additional metadata recorded</div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No audit logs" message="Try widening the search or resetting filters." label="Governance" />
      )}
    </div>
  );
}
