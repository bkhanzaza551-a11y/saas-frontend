import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import CustomSelect from "../../components/CustomSelect";
import { Shield, Plus, Pencil, Trash2, Mail, User, Check, X, Search, RefreshCw, Clock } from "lucide-react";
import { useAlert } from "../../context/AlertContext";

const emptyUserForm = { email: "", name: "", adminRoleId: "", department: "" };
const emptyRoleForm = { name: "", description: "", permissions: [] };

const PAGE_GROUP_LABELS = {
  "Overview & CRM": ["dashboard", "sales-pipeline"],
  "Operations & Salons": ["salons", "product-requests", "staff-requests"],
  "Billing & Subscriptions": ["subscriptions", "plans", "finance"],
  "Support & Helpdesk": ["support-tickets"],
  "Administration & Governance": ["credits", "staff", "settings", "audit-logs"]
};

const PERMISSION_PRESETS = [
  { label: "Sales", permissions: ["dashboard", "sales-pipeline", "salons", "subscriptions", "plans"] },
  { label: "Support", permissions: ["dashboard", "support-tickets", "salons"] },
  { label: "Finance", permissions: ["dashboard", "finance", "subscriptions", "plans", "salons"] },
  { label: "Operations", permissions: ["dashboard", "salons", "subscriptions", "sales-pipeline", "support-tickets", "product-requests", "staff-requests", "finance"] },
  { label: "Platform Admin", permissions: ["dashboard", "sales-pipeline", "salons", "subscriptions", "plans", "product-requests", "staff-requests", "support-tickets", "finance", "credits", "staff", "settings", "audit-logs"] },
  { label: "Super Admin", permissions: ["dashboard", "sales-pipeline", "salons", "subscriptions", "plans", "product-requests", "staff-requests", "support-tickets", "finance", "credits", "staff", "settings", "audit-logs"] }
];

const DEPARTMENTS = ["Sales", "Support", "Finance", "Operations", "Administration", "Marketing", "HR", "Other"];

export default function StaffManagementPage() {
  const { showConfirm } = useAlert();
  const [activeTab, setActiveTab] = useState("team");
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [availablePages, setAvailablePages] = useState([]);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState("");
  const [editingUserObj, setEditingUserObj] = useState(null);
  const [userActivities, setUserActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

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
      setStaff(staffRes?.data?.users || staffRes?.data || []);
      setRoles(rolesRes.data);
      setAvailablePages(pagesRes.data);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Could not load team data."), success: "" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openEditUser = async (user) => {
    setEditingUserId(user.id);
    setEditingUserObj(user);
    setUserForm({ email: user.email, name: user.name, adminRoleId: user.adminRoleId || "", department: user.department || "" });
    setIsUserModalOpen(true);
    setLoadingActivities(true);
    try {
      const actRes = await api.get(`/super-admin/team/${user.id}/activity`);
      let list = Array.isArray(actRes.data) ? actRes.data : [];
      if (list.length === 0) {
        if (user.createdAt) {
          list.push({
            id: `init-${user.id}`,
            action: user.passwordSetupRequired ? "INVITE_SENT" : "ACCOUNT_CREATED",
            summary: user.passwordSetupRequired ? `Invitation email sent for ${user.adminRole?.name || "Staff"}` : `Account created with role ${user.adminRole?.name || "Staff"}`,
            createdAt: user.createdAt
          });
        }
        if (user.lastLoginAt) {
          list.push({
            id: `login-${user.id}`,
            action: "LAST_LOGIN",
            summary: "User logged in to admin console",
            createdAt: user.lastLoginAt
          });
        }
        if (!user.isActive && !user.passwordSetupRequired) {
          list.push({
            id: `deact-${user.id}`,
            action: "DEACTIVATE_STAFF",
            summary: "Account deactivated",
            createdAt: user.updatedAt || user.createdAt
          });
        }
      }
      setUserActivities(list);
    } catch (e) {
      const fallbackList = [];
      if (user.createdAt) {
        fallbackList.push({
          id: `init-${user.id}`,
          action: user.passwordSetupRequired ? "INVITE_SENT" : "ACCOUNT_CREATED",
          summary: user.passwordSetupRequired ? `Invitation email sent` : `Account created`,
          createdAt: user.createdAt
        });
      }
      setUserActivities(fallbackList);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleResetPassword = async (userId) => {
    const confirmed = await showConfirm("Send password reset link to this user's email?");
    if (!confirmed) return;
    setStatus({ error: "", success: "" });
    try {
      const res = await api.post(`/super-admin/team/${userId}/reset-password`, {});
      setStatus({ error: "", success: res.data?.message || "Password reset link sent." });
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not reset password"), success: "" });
    }
  };

  const submitUser = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.adminRoleId) return setStatus({ error: "Name and Role are required.", success: "" });
    if (!editingUserId && !userForm.email) return setStatus({ error: "Email is required for new invites.", success: "" });
    setStatus({ error: "", success: "" });
    setSavingUser(true);
    try {
      if (editingUserId) {
        await api.patch(`/super-admin/team/${editingUserId}`, { name: userForm.name, department: userForm.department, adminRoleId: userForm.adminRoleId });
        setStatus({ error: "", success: "User updated successfully." });
      } else {
        await api.post("/super-admin/team/invite", userForm);
        setStatus({ error: "", success: "Invite sent successfully." });
      }
      setIsUserModalOpen(false);
      setUserForm(emptyUserForm);
      setEditingUserId("");
      setEditingUserObj(null);
      await loadData();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save user"), success: "" });
    } finally { setSavingUser(false); }
  };

  const toggleUserActive = async (id, isCurrentlyActive) => {
    setStatus({ error: "", success: "" });
    const actionLabel = isCurrentlyActive ? "deactivate" : "activate";
    const confirmed = await showConfirm(`Are you sure you want to ${actionLabel} this team member?`);
    if (!confirmed) return;
    try {
      if (!isCurrentlyActive) await api.patch(`/super-admin/team/${id}/activate`);
      else await api.patch(`/super-admin/team/${id}/deactivate`);
      setStatus({ error: "", success: `Team member ${isCurrentlyActive ? "deactivated" : "activated"} successfully.` });
      await loadData();
      if (editingUserObj && editingUserObj.id === id) {
        setEditingUserObj({ ...editingUserObj, isActive: !isCurrentlyActive });
      }
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not update status"), success: "" });
    }
  };

  const resendInvite = async (id) => {
    setStatus({ error: "", success: "" });
    try {
      await api.post(`/super-admin/team/${id}/resend-invite`);
      setStatus({ error: "", success: "Invite resent successfully." });
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not resend invite"), success: "" });
    }
  };

  const toggleRolePermission = (pageKey) => {
    setRoleForm((prev) => {
      const next = prev.permissions.includes(pageKey) ? prev.permissions.filter((p) => p !== pageKey) : [...prev.permissions, pageKey];
      return { ...prev, permissions: next };
    });
  };

  const toggleGroupPermissions = (pageKeys) => {
    setRoleForm((prev) => {
      const allSelected = pageKeys.every((k) => prev.permissions.includes(k));
      const next = allSelected ? prev.permissions.filter((k) => !pageKeys.includes(k)) : [...new Set([...prev.permissions, ...pageKeys])];
      return { ...prev, permissions: next };
    });
  };

  const applyPreset = (preset) => {
    setRoleForm({ ...roleForm, permissions: [...preset.permissions] });
  };

  const submitRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name) return setStatus({ error: "Role name is required.", success: "" });
    setStatus({ error: "", success: "" });
    setSavingRole(true);
    try {
      const permissionsObj = Object.fromEntries(roleForm.permissions.map(p => [p, true]));
      const payload = { ...roleForm, permissions: permissionsObj };
      if (editingRoleId) {
        await api.patch(`/super-admin/roles/${editingRoleId}`, payload);
        setStatus({ error: "", success: "Role updated successfully." });
      } else {
        await api.post("/super-admin/roles", payload);
        setStatus({ error: "", success: "Role created successfully." });
      }
      setIsRoleModalOpen(false);
      setRoleForm(emptyRoleForm);
      setEditingRoleId("");
      await loadData();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not save role"), success: "" });
    } finally { setSavingRole(false); }
  };

  const deleteRole = async (id, name) => {
    const confirmed = await showConfirm(`Delete role "${name}"?`);
    if (!confirmed) return;
    try {
      await api.delete(`/super-admin/roles/${id}`);
      setStatus({ error: "", success: "Role deleted." });
      await loadData();
    } catch (error) {
      setStatus({ error: formatApiError(error, "Could not delete role"), success: "" });
    }
  };

  // Point 14: Search by name, email, role, department + Filters
  const filteredStaff = staff.filter(s => {
    if (search) {
      const query = search.toLowerCase();
      const matchName = s.name?.toLowerCase().includes(query);
      const matchEmail = s.email?.toLowerCase().includes(query);
      const matchRole = s.adminRole?.name?.toLowerCase().includes(query);
      const matchDept = s.department?.toLowerCase().includes(query);
      if (!matchName && !matchEmail && !matchRole && !matchDept) return false;
    }
    if (filterStatus === "active" && !s.isActive) return false;
    if (filterStatus === "invited" && (s.isActive || !s.passwordSetupRequired)) return false;
    if (filterStatus === "inactive" && (s.isActive || s.passwordSetupRequired)) return false;
    if (filterRole && String(s.adminRoleId) !== String(filterRole)) return false;
    if (filterDepartment && s.department !== filterDepartment) return false;
    return true;
  });

  if (loading) return <div className="page-shell"><PageLoader title="Loading Team" /></div>;

  return (
    <div className="page-shell super-admin-page">
      <div className="hero-card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="item-head">
          <div>
            <h1 style={{ marginTop: 0 }}>Team & Roles</h1>
            <p style={{ marginBottom: 0 }}>Manage internal team members, roles, and permissions.</p>
          </div>
          <div className="badge-row">
            <span className="badge">Team: {staff.length}</span>
            <span className="badge">Roles: {roles.length}</span>
          </div>
        </div>
      </div>

      {status.error && <div style={{ padding: 12, background: "#fef2f2", color: "#ef4444", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{status.error}</div>}
      {status.success && <div style={{ padding: 12, background: "#f0fdf4", color: "#16a34a", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{status.success}</div>}

      <div style={{ display: "flex", gap: 16, marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
        <button onClick={() => setActiveTab("team")} style={{ background: "none", border: "none", fontSize: "1rem", fontWeight: 600, color: activeTab === "team" ? "#4f46e5" : "#64748b", cursor: "pointer", borderBottom: activeTab === "team" ? "2px solid #4f46e5" : "none", paddingBottom: 8 }}>Team Members</button>
        <button onClick={() => setActiveTab("roles")} style={{ background: "none", border: "none", fontSize: "1rem", fontWeight: 600, color: activeTab === "roles" ? "#4f46e5" : "#64748b", cursor: "pointer", borderBottom: activeTab === "roles" ? "2px solid #4f46e5" : "none", paddingBottom: 8 }}>Roles & Permissions</button>
      </div>

      {activeTab === "team" && (
        <>
          {/* Search & Filters Section */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 24, border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)" }}>
            
            {/* Top Search & Invite Row */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 280, position: "relative" }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", pointerEvents: "none", zIndex: 2 }}>
                  <Search size={18} />
                </div>
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Search name, email, role, department..."
                  style={{ width: "100%", height: 42, paddingLeft: 42, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "all 0.2s", background: "#f8fafc" }} 
                  onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.08)"; }}
                  onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              <button onClick={() => { setUserForm(emptyUserForm); setEditingUserId(""); setEditingUserObj(null); setIsUserModalOpen(true); }}
                style={{ display: "flex", alignItems: "center", gap: 6, height: 42, padding: "0 20px", borderRadius: 10, background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "white", fontWeight: 700, fontSize: "0.85rem", border: "none", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)", transition: "all 0.2s", whiteSpace: "nowrap" }}
                onMouseOver={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 8px -2px rgba(79, 70, 229, 0.3)"; }} 
                onMouseOut={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 4px 6px -1px rgba(79, 70, 229, 0.2)"; }}
              >
                <Plus size={16} /> Invite Staff
              </button>
            </div>

            {/* Dropdowns Row with clear Labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Account Status</label>
                <CustomSelect
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="invited">Invitation Sent</option>
                  <option value="inactive">Deactivated</option>
                </CustomSelect>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Department</label>
                <CustomSelect
                  value={filterDepartment}
                  onChange={e => setFilterDepartment(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </CustomSelect>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Admin Role</label>
                <CustomSelect
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="">All Roles</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </CustomSelect>
              </div>

              {(search || filterStatus || filterDepartment || filterRole) && (
                <div>
                  <button
                    onClick={() => { setSearch(""); setFilterStatus(""); setFilterDepartment(""); setFilterRole(""); }}
                    style={{ height: 42, width: "100%", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", color: "#64748b", transition: "all 0.2s" }}
                    onMouseOver={e => { e.currentTarget.style.background="#fee2e2"; e.currentTarget.style.borderColor="#fca5a5"; e.currentTarget.style.color="#dc2626"; }}
                    onMouseOut={e => { e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.borderColor="#cbd5e1"; e.currentTarget.style.color="#64748b"; }}
                  >
                    ✕ Reset Filters
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Point 6 & 15: Exact 8 columns & Account Status (Active, Invitation Sent, Deactivated) */}
          {filteredStaff.length === 0 ? <EmptyState title="No Team Members" message="No team members match the search filters." /> : (
            <div className="panel-card" style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Department</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Last Login</th>
                    <th style={thStyle}>Created Date</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s) => {
                    const statusLabel = s.isActive ? "Active" : s.passwordSetupRequired ? "Invitation Sent" : "Deactivated";
                    const statusStyle = s.isActive ? badgeStyleActive : s.passwordSetupRequired ? badgeStylePending : badgeStyleInactive;

                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={tdStyle}>
                          <strong style={{ color: "#0f172a", cursor: "pointer" }} onClick={() => openEditUser(s)}>{s.name}</strong>
                        </td>
                        <td style={tdStyle}>{s.email}</td>
                        <td style={tdStyle}>
                          <span style={{ background: "#eef2ff", color: "#4f46e5", padding: "3px 8px", borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                            {s.adminRole?.name || "No Role"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: "#475569" }}>{s.department || "General"}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={statusStyle}>
                            {statusLabel}
                          </span>
                        </td>
                        <td style={tdStyle}>{s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never"}</td>
                        <td style={tdStyle}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            {!s.isActive && s.passwordSetupRequired && (
                              <button onClick={() => resendInvite(s.id)} title="Resend Invitation Email" style={{ background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe", padding: "6px 10px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700 }}>
                                <Mail size={12} /> Resend
                              </button>
                            )}
                            <button onClick={() => openEditUser(s)} title="Edit Member & Controls" style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", padding: "6px 8px", borderRadius: 6, cursor: "pointer" }}><Pencil size={13} /></button>
                            
                            {/* Point 7: Deactivate / Reactivate action */}
                            <button 
                              onClick={() => toggleUserActive(s.id, s.isActive)}
                              title={s.isActive ? "Deactivate Member" : "Activate Member"}
                              style={{
                                background: s.isActive ? "#fef2f2" : "#f0fdf4",
                                color: s.isActive ? "#dc2626" : "#16a34a",
                                border: `1px solid ${s.isActive ? "#fecaca" : "#bbf7d0"}`,
                                padding: "6px 10px",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                              }}
                            >
                              {s.isActive ? <><X size={12} /> Deactivate</> : <><Check size={12} /> Activate</>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "roles" && (
        <>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => { setRoleForm(emptyRoleForm); setEditingRoleId(""); setIsRoleModalOpen(true); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#4f46e5", color: "white", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
              <Plus size={16} /> Add Role
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
                        <button onClick={() => {
                          setEditingRoleId(r.id);
                          setRoleForm({ name: r.name, description: r.description || "", permissions: r.permissions && typeof r.permissions === "object" && !Array.isArray(r.permissions) ? Object.keys(r.permissions).filter(k => r.permissions[k] === true) : Array.isArray(r.permissions) ? r.permissions : [] });
                          setIsRoleModalOpen(true);
                        }} style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}><Pencil size={14} /></button>
                        {(!r._count?.users || r._count?.users === 0) && (
                          <button onClick={() => deleteRole(r.id, r.name)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}><Trash2 size={14} /></button>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Assigned to <strong>{r._count?.users || 0}</strong> users</span>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}><strong>{r.permissions && typeof r.permissions === "object" && !Array.isArray(r.permissions) ? Object.keys(r.permissions).filter(k => r.permissions[k] === true).length : Array.isArray(r.permissions) ? r.permissions.length : 0}</strong> permissions</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Point 13: Improved Edit Staff Member Screen with Activity, Reset Password & Controls */}
      {isUserModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" }} onClick={() => setIsUserModalOpen(false)}>
          <div style={{ background: "white", width: "100%", maxWidth: editingUserId ? 640 : 500, borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{editingUserId ? "Edit Team Member" : "Invite Staff"}</h3>
              <button onClick={() => setIsUserModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: 22, color: "#94a3b8", cursor: "pointer" }}>&times;</button>
            </div>
            <form onSubmit={submitUser} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Name *</label>
                <input required value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Email *</label>
                <input type="email" required={!editingUserId} disabled={!!editingUserId} value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box", background: editingUserId ? "#f1f5f9" : "white" }} />
                {!editingUserId && <small style={{ color: "#64748b", fontSize: 11 }}>Invite link will be sent to set password.</small>}
              </div>
              
              {/* Point 11: Department */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Department</label>
                <CustomSelect
                  value={userForm.department}
                  onChange={e => setUserForm({ ...userForm, department: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </CustomSelect>
              </div>

              {/* Point 3: Role is mandatory */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Role *</label>
                <CustomSelect
                  required
                  value={userForm.adminRoleId}
                  onChange={e => setUserForm({ ...userForm, adminRoleId: e.target.value })}
                  style={{ width: "100%" }}
                >
                  <option value="">Select a Role</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </CustomSelect>
              </div>

              {/* Point 12 & 13: Account Status, Controls, Reset Password & Activity for Editing User */}
              {editingUserId && editingUserObj && (
                <div style={{ marginTop: 10, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 12, color: "#64748b", display: "block" }}>Account Status</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: editingUserObj.isActive ? "#10b981" : editingUserObj.passwordSetupRequired ? "#d97706" : "#ef4444" }}>
                        {editingUserObj.isActive ? "Active" : editingUserObj.passwordSetupRequired ? "Invitation Sent" : "Deactivated"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button 
                        type="button"
                        onClick={() => handleResetPassword(editingUserId)}
                        style={{ padding: "6px 12px", background: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        Reset Password
                      </button>
                      <button 
                        type="button"
                        onClick={() => toggleUserActive(editingUserId, editingUserObj.isActive)}
                        style={{ padding: "6px 12px", background: editingUserObj.isActive ? "#fef2f2" : "#f0fdf4", color: editingUserObj.isActive ? "#dc2626" : "#16a34a", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        {editingUserObj.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>

                  {/* Point 12: Recent Activity Audit Feed */}
                  <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={14} color="#6366f1" /> Recent Activity ({userActivities.length})
                    </div>
                    {loadingActivities ? (
                      <div style={{ fontSize: 11, color: "#94a3b8", padding: "6px 0" }}>Loading activity...</div>
                    ) : userActivities.length === 0 ? (
                      <div style={{ fontSize: 11, color: "#94a3b8", padding: "6px 0" }}>No recent activity logged for this member.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 160, overflowY: "auto" }}>
                        {userActivities.map(a => {
                          const actionFormatted = a.action ? a.action.replace(/_/g, " ") : "ACTIVITY";
                          return (
                            <div key={a.id} style={{ fontSize: 12, color: "#334155", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #e2e8f0", paddingBottom: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", textOverflow: "ellipsis" }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#e0e7ff", color: "#4338ca", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                                  {actionFormatted}
                                </span>
                                <span style={{ fontSize: 11, color: "#475569" }}>{a.summary || a.module}</span>
                              </div>
                              <span style={{ color: "#94a3b8", fontSize: 10, whiteSpace: "nowrap", marginLeft: 8 }}>
                                {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setIsUserModalOpen(false)} style={{ padding: "9px 16px", background: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={savingUser} style={{ padding: "9px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{savingUser ? "Saving..." : editingUserId ? "Update Member" : "Send Invite"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROLE MODAL */}
      {isRoleModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" }} onClick={() => setIsRoleModalOpen(false)}>
          <div style={{ background: "white", width: "100%", maxWidth: 700, maxHeight: "90vh", borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{editingRoleId ? "Edit Role" : "Create Role"}</h3>
              <button onClick={() => setIsRoleModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: 22, color: "#94a3b8", cursor: "pointer" }}>&times;</button>
            </div>
            <form onSubmit={submitRole} style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Role Name *</label>
                  <input required value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Description</label>
                  <input value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }} />
                </div>
              </div>

              {/* Permission Presets */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Quick Presets</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {PERMISSION_PRESETS.map(p => (
                    <button key={p.label} type="button" onClick={() => applyPreset(p)}
                      style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#475569" }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions by Module */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Shield size={16} style={{ color: "#6366f1" }} />
                  <span style={{ fontSize: "0.88rem", fontWeight: 700 }}>Permissions by Module</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>{roleForm.permissions.length} selected</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(PAGE_GROUP_LABELS).map(([group, pageKeys]) => (
                    <div key={group} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                      <div onClick={() => toggleGroupPermissions(pageKeys)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: pageKeys.every(k => roleForm.permissions.includes(k)) ? "#eef2ff" : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <input type="checkbox" checked={pageKeys.every(k => roleForm.permissions.includes(k))} readOnly style={{ width: 15, height: 15 }} />
                        <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>{group}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 12 }}>
                        {pageKeys.map((pk) => {
                          const page = availablePages.find((p) => p.key === pk);
                          if (!page) return null;
                          const isSelected = roleForm.permissions.includes(pk);
                          return (
                            <label key={pk} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${isSelected ? "#6366f1" : "#cbd5e1"}`, borderRadius: 16, cursor: "pointer", fontSize: "0.78rem", background: isSelected ? "#eef2ff" : "white", color: isSelected ? "#4338ca" : "#475569" }}>
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setIsRoleModalOpen(false)} style={{ padding: "9px 16px", background: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={savingRole} style={{ padding: "9px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{savingRole ? "Saving..." : "Save Role"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = { textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0" };
const tdStyle = { padding: "12px 14px", fontSize: 13, color: "#334155", verticalAlign: "middle" };
const badgeStyleActive = { display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#dcfce7", color: "#166534" };
const badgeStyleInactive = { display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#fee2e2", color: "#991b1b" };
const badgeStylePending = { display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#fff7ed", color: "#c2410c" };
