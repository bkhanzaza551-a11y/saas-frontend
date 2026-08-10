import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { Shield, Plus, Pencil, Trash2, Mail, User, Check, X } from "lucide-react";

const emptyUserForm = { email: "", name: "", adminRoleId: "", department: "" };
const emptyRoleForm = { name: "", description: "", permissions: [] };

const PAGE_GROUP_LABELS = {
  "Platform": ["dashboard", "salons", "branches", "plans", "subscriptions"],
  "Operations": ["demo-leads", "support-tickets", "traffic", "global-dashboard", "financial-reports", "staff-requirements", "product-requirements", "salon-analytics"],
  "System": ["settings", "audit-logs", "staff"]
};

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState("team");
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [availablePages, setAvailablePages] = useState([]);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState("");
  const [savingUser, setSavingUser] = useState(false);

  // Role Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [editingRoleId, setEditingRoleId] = useState("");
  const [savingRole, setSavingRole] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, rolesRes, pagesRes] = await Promise.all([
        api.get("/super-admin/team"),
        api.get("/super-admin/roles"),
        api.get("/super-admin/available-pages")
      ]);
      setStaff(staffRes.data);
      setRoles(rolesRes.data);
      setAvailablePages(pagesRes.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load team data."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- USER LOGIC ---
  const submitUser = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.adminRoleId) return setStatus({ error: "Name and Role are required.", success: "" });
    if (!editingUserId && !userForm.email) return setStatus({ error: "Email is required for new invites.", success: "" });

    setStatus({ error: "", success: "" });
    setSavingUser(true);
    try {
      if (editingUserId) {
        await api.patch(`/super-admin/team/${editingUserId}/role`, { adminRoleId: userForm.adminRoleId });
        setStatus({ error: "", success: "User updated successfully." });
      } else {
        const res = await api.post("/super-admin/team/invite", userForm);
        setStatus({ error: "", success: "Invite sent successfully. Setup Token (Dev Only): " + res.data.devToken });
      }
      setIsUserModalOpen(false);
      setUserForm(emptyUserForm);
      setEditingUserId("");
      await loadData();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save user"), success: "" });
    } finally {
      setSavingUser(false);
    }
  };

  const toggleUserActive = async (id, isActive) => {
    setStatus({ error: "", success: "" });
    try {
      if (isActive) await api.patch(`/super-admin/team/${id}/activate`);
      else await api.patch(`/super-admin/team/${id}/deactivate`);
      setStatus({ error: "", success: `User ${isActive ? "activated" : "deactivated"}.` });
      await loadData();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not update status"), success: "" });
    }
  };

  // --- ROLE LOGIC ---
  const toggleRolePermission = (pageKey) => {
    setRoleForm((prev) => {
      const current = prev.permissions;
      const next = current.includes(pageKey)
        ? current.filter((p) => p !== pageKey)
        : [...current, pageKey];
      return { ...prev, permissions: next };
    });
  };

  const toggleGroupPermissions = (pageKeys) => {
    setRoleForm((prev) => {
      const allSelected = pageKeys.every((k) => prev.permissions.includes(k));
      const next = allSelected
        ? prev.permissions.filter((k) => !pageKeys.includes(k))
        : [...new Set([...prev.permissions, ...pageKeys])];
      return { ...prev, permissions: next };
    });
  };

  const submitRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name) return setStatus({ error: "Role name is required.", success: "" });

    setStatus({ error: "", success: "" });
    setSavingRole(true);
    try {
      if (editingRoleId) {
        await api.patch(`/super-admin/roles/${editingRoleId}`, roleForm);
        setStatus({ error: "", success: "Role updated successfully." });
      } else {
        await api.post("/super-admin/roles", roleForm);
        setStatus({ error: "", success: "Role created successfully." });
      }
      setIsRoleModalOpen(false);
      setRoleForm(emptyRoleForm);
      setEditingRoleId("");
      await loadData();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save role"), success: "" });
    } finally {
      setSavingRole(false);
    }
  };

  const deleteRole = async (id, name) => {
    if (!window.confirm(`Delete role "${name}"?`)) return;
    try {
      await api.delete(`/super-admin/roles/${id}`);
      setStatus({ error: "", success: "Role deleted." });
      await loadData();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not delete role"), success: "" });
    }
  };

  if (loading) return <div className="page-shell"><PageLoader title="Loading Team" /></div>;

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Team & Roles</h1>
            <p style={{ marginBottom: 0 }}>Manage your internal team members and their role-based permissions.</p>
          </div>
          <div className="badge-row">
            <span className="badge">Team Members: {staff.length}</span>
            <span className="badge">Roles: {roles.length}</span>
          </div>
        </div>
      </div>

      {status.error && <div className="alert alert-error">{status.error}</div>}
      {status.success && <div className="alert alert-success">{status.success}</div>}

      <div style={{ display: "flex", gap: 16, marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
        <button 
          onClick={() => setActiveTab("team")}
          style={{ background: "none", border: "none", fontSize: "1rem", fontWeight: 600, color: activeTab === "team" ? "#4f46e5" : "#64748b", cursor: "pointer", borderBottom: activeTab === "team" ? "2px solid #4f46e5" : "none", paddingBottom: 8 }}
        >
          Team Members
        </button>
        <button 
          onClick={() => setActiveTab("roles")}
          style={{ background: "none", border: "none", fontSize: "1rem", fontWeight: 600, color: activeTab === "roles" ? "#4f46e5" : "#64748b", cursor: "pointer", borderBottom: activeTab === "roles" ? "2px solid #4f46e5" : "none", paddingBottom: 8 }}
        >
          Roles & Permissions
        </button>
      </div>

      {activeTab === "team" && (
        <>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={() => { setUserForm(emptyUserForm); setEditingUserId(""); setIsUserModalOpen(true); }}>
              <Plus size={16} style={{ marginRight: 6 }} /> Invite Staff
            </button>
          </div>
          {staff.length === 0 ? <EmptyState title="No Team Members" message="Invite someone to join the admin team." /> : (
            <div className="panel-card" style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={tdStyle}><strong>{s.name}</strong><br/><small>{s.department || "N/A"}</small></td>
                      <td style={tdStyle}>{s.email}</td>
                      <td style={tdStyle}>{s.adminRole?.name || "No Role"}</td>
                      <td style={tdStyle}>
                        <span style={s.isActive ? badgeStyleActive : badgeStyleInactive}>
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {s.isActive ? (
                            <button className="btn btn-sm btn-danger-outline" onClick={() => toggleUserActive(s.id, false)}>Deactivate</button>
                          ) : (
                            <button className="btn btn-sm btn-outline" onClick={() => toggleUserActive(s.id, true)}>Activate</button>
                          )}
                          <button className="btn btn-sm btn-outline" onClick={() => {
                            setEditingUserId(s.id);
                            setUserForm({ email: s.email, name: s.name, adminRoleId: s.adminRoleId || "", department: s.department || "" });
                            setIsUserModalOpen(true);
                          }}><Pencil size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "roles" && (
        <>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={() => { setRoleForm(emptyRoleForm); setEditingRoleId(""); setIsRoleModalOpen(true); }}>
              <Plus size={16} style={{ marginRight: 6 }} /> Add Role
            </button>
          </div>
          {roles.length === 0 ? <EmptyState title="No Roles" message="Create roles to assign permissions." /> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {roles.map(r => (
                <div key={r.id} className="panel-card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: 8 }}>
                        {r.name} {r.isSystem && <span style={badgeStyleActive}>System</span>}
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>{r.description || "No description"}</p>
                    </div>
                    {!r.isSystem && (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => {
                          setEditingRoleId(r.id);
                          setRoleForm({ name: r.name, description: r.description || "", permissions: Array.isArray(r.permissions) ? r.permissions : [] });
                          setIsRoleModalOpen(true);
                        }}><Pencil size={14}/></button>
                        {r._count?.users === 0 && (
                          <button className="btn btn-sm btn-danger-outline" onClick={() => deleteRole(r.id, r.name)}><Trash2 size={14}/></button>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Assigned to <strong>{r._count?.users || 0}</strong> users</span>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}><strong>{(Array.isArray(r.permissions) ? r.permissions.length : 0)}</strong> permissions</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* USER MODAL */}
      {isUserModalOpen && (
        <div className="modal-overlay" onClick={() => setIsUserModalOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>{editingUserId ? "Edit User Role" : "Invite Staff"}</h3>
              <button className="modal-close-btn" onClick={() => setIsUserModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={submitUser} style={{ padding: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Name *</span>
                  <input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="input-field" disabled={!!editingUserId} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Email *</span>
                  <input type="email" required={!editingUserId} disabled={!!editingUserId} value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="input-field" />
                  {!editingUserId && <small style={{ color: "#64748b" }}>An invite link will be sent to this email to set a password.</small>}
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Department</span>
                  <input value={userForm.department} onChange={e => setUserForm({...userForm, department: e.target.value})} className="input-field" />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Assign Role *</span>
                  <select required value={userForm.adminRoleId} onChange={e => setUserForm({...userForm, adminRoleId: e.target.value})} className="input-field">
                    <option value="">Select a Role</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingUser}>{savingUser ? "Saving..." : "Send Invite"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROLE MODAL */}
      {isRoleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRoleModalOpen(false)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: "90vh", overflow: "auto" }}>
            <div className="modal-header">
              <h3>{editingRoleId ? "Edit Role" : "Create Role"}</h3>
              <button className="modal-close-btn" onClick={() => setIsRoleModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={submitRole} style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Role Name *</span>
                  <input required value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} className="input-field" />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Description</span>
                  <input value={roleForm.description} onChange={e => setRoleForm({...roleForm, description: e.target.value})} className="input-field" />
                </label>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Shield size={16} style={{ color: "#6366f1" }} />
                  <span style={{ fontSize: "0.88rem", fontWeight: 700 }}>Role Permissions</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {Object.entries(PAGE_GROUP_LABELS).map(([group, pageKeys]) => (
                    <div key={group} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                      <div onClick={() => toggleGroupPermissions(pageKeys)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", background: pageKeys.every(k => roleForm.permissions.includes(k)) ? "#eef2ff" : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <input type="checkbox" checked={pageKeys.every(k => roleForm.permissions.includes(k))} readOnly style={{ width: 16, height: 16 }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{group}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: 16 }}>
                        {pageKeys.map((pk) => {
                          const page = availablePages.find((p) => p.key === pk);
                          if (!page) return null;
                          const isSelected = roleForm.permissions.includes(pk);
                          return (
                            <label key={pk} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", border: `1px solid ${isSelected ? "#6366f1" : "#cbd5e1"}`, borderRadius: 20, cursor: "pointer", fontSize: "0.82rem", background: isSelected ? "#eef2ff" : "white", color: isSelected ? "#4338ca" : "#475569" }}>
                              <input type="checkbox" checked={isSelected} onChange={() => toggleRolePermission(pk)} style={{ display: "none" }} />
                              {page.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsRoleModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingRole}>{savingRole ? "Saving..." : "Save Role"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { textAlign: "left", padding: "12px 16px", fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0" };
const tdStyle = { padding: "12px 16px", fontSize: "0.88rem", color: "#334155", verticalAlign: "middle" };
const badgeStyleActive = { display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600, background: "#dcfce7", color: "#166534" };
const badgeStyleInactive = { display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600, background: "#fee2e2", color: "#991b1b" };
