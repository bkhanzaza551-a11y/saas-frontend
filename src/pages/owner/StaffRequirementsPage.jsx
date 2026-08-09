import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { X, Plus, Trash2, Clock, CheckCircle, AlertCircle } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";

import CustomSelect from "../../components/CustomSelect";

const statusConfig = {
  OPEN: { label: "Open", color: "#f59e0b", bg: "#fef3c7", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "#3b82f6", bg: "#dbeafe", icon: AlertCircle },
  CLOSED: { label: "Closed", color: "#10b981", bg: "#d1fae5", icon: CheckCircle }
};

const urgencyColors = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  URGENT: "#dc2626"
};

export default function StaffRequirementsPage() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", department: "", position: "", salary: "", shift: "", urgency: "MEDIUM", skills: "", count: "1", priority: "MEDIUM" });

  const fetchRequirements = async () => {
    try {
      const res = await api.get("/owner/staff-requirements");
      setRequirements(res.data || []);
    } catch (err) {
      console.error("Failed to load requirements", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequirements(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api.post("/owner/staff-requirements", form);
      setForm({ title: "", description: "", department: "", position: "", salary: "", shift: "", urgency: "MEDIUM", skills: "", count: "1", priority: "MEDIUM" });
      setShowModal(false);
      fetchRequirements();
    } catch (err) {
      console.error("Failed to create requirement", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this requirement?")) return;
    try {
      await api.delete(`/owner/staff-requirements/${id}`);
      fetchRequirements();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Staff Requirements</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Submit staffing needs to Super Admin</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          <Plus size={18} /> New Requirement
        </button>
      </div>

      {requirements.length === 0 ? (
        <EmptyState title="No Requirements" message="You haven't submitted any staff requirements yet." />
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {requirements.map((req) => {
            const status = statusConfig[req.status] || statusConfig.OPEN;
            const StatusIcon = status.icon;
            return (
              <div key={req.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", margin: 0 }}>{req.title}</h3>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: status.color, background: status.bg }}>
                      <StatusIcon size={12} /> {status.label}
                    </span>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: urgencyColors[req.urgency] || "#64748b", background: "#f1f5f9" }}>
                      {req.urgency}
                    </span>
                  </div>
                  {req.description && <p style={{ fontSize: 14, color: "#475569", margin: "4px 0 8px" }}>{req.description}</p>}
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#64748b", flexWrap: "wrap" }}>
                    {req.department && <span>Dept: <b style={{ color: "#334155" }}>{req.department}</b></span>}
                    {req.position && <span>Position: <b style={{ color: "#334155" }}>{req.position}</b></span>}
                    {req.salary && <span>Salary: <b style={{ color: "#334155" }}>{req.salary}</b></span>}
                    {req.shift && <span>Shift: <b style={{ color: "#334155" }}>{req.shift}</b></span>}
                    {req.count > 1 && <span>Count: <b style={{ color: "#334155" }}>{req.count}</b></span>}
                    {req.skills && <span>Skills: <b style={{ color: "#334155" }}>{req.skills}</b></span>}
                  </div>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                    Submitted: {new Date(req.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                {req.status === "OPEN" && (
                  <button onClick={() => handleDelete(req.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e2e8f0" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>New Staff Requirement</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Title *</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Senior Hair Stylist" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Job description and requirements..." rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Department</label>
                  <input type="text" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Styling" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Position</label>
                  <input type="text" value={form.position} onChange={e => setForm({...form, position: e.target.value})} placeholder="e.g. Hair Stylist" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Salary Range</label>
                  <input type="text" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} placeholder="e.g. ₹15,000 - ₹25,000" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Shift</label>
                  <input type="text" value={form.shift} onChange={e => setForm({...form, shift: e.target.value})} placeholder="e.g. Morning" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Urgency</label>
                  <CustomSelect value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </CustomSelect>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Count</label>
                  <input type="number" min="1" value={form.count} onChange={e => setForm({...form, count: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Skills</label>
                <input type="text" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} placeholder="e.g. Coloring, Cutting, Styling" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "10px 20px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 600, cursor: "pointer", color: "#475569" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Submitting..." : "Submit Requirement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
