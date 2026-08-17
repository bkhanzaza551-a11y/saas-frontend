import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import EmptyState from "../../components/EmptyState";
import { formatApiError } from "../../utils/apiError";
import ModuleTabs from "../../components/ModuleTabs";
import PageLoader from "../../components/PageLoader";
import { Clock, User, Calendar, MapPin, Tag, CheckCircle, Edit, FileText, XCircle, AlertCircle, RefreshCw, MessageSquare } from "lucide-react";

import CustomSelect from "../../components/CustomSelect";

const statusOptions = ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];

function formatMoney(val) {
  const n = Number(val || 0);
  return n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [selfLinks, setSelfLinks] = useState(null);
  const [statusValue, setStatusValue] = useState("CONFIRMED");
  const [statusNote, setStatusNote] = useState("");
  const [status, setStatus] = useState({ loading: true, error: "", success: "" });

  const [showBillPreview, setShowBillPreview] = useState(false);
  const [consumableOverrides, setConsumableOverrides] = useState({});
  const [creating, setCreating] = useState(false);

  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappResult, setWhatsappResult] = useState({ error: "", success: "" });

  const load = async () => {
    try {
      const [appointmentResponse, linksResponse] = await Promise.all([
        api.get(`/owner/appointments/${id}`),
        api.get(`/owner/appointments/${id}/self-links`)
      ]);
      setAppointment(appointmentResponse.data);
      setSelfLinks(linksResponse.data);
      setStatusValue(appointmentResponse.data.status);
    } catch (error) {
      setStatus((current) => ({ ...current, error: formatApiError(error, "Could not reload appointment") }));
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get(`/owner/appointments/${id}`),
      api.get(`/owner/appointments/${id}/self-links`)
    ]).then(([response, linksResponse]) => {
      if (!active) return;
      setAppointment(response.data);
      setSelfLinks(linksResponse.data);
      setStatusValue(response.data.status);
      setStatus({ loading: false, error: "", success: "" });
    }).catch((error) => {
      if (!active) return;
      setStatus({ loading: false, error: formatApiError(error, "Could not load appointment"), success: "" });
    });
    return () => {
      active = false;
    };
  }, [id]);

  const updateStatus = async () => {
    setStatus((current) => ({ ...current, error: "", success: "" }));
    try {
      await api.patch(`/owner/appointments/${id}/status`, { status: statusValue, note: statusNote || undefined });
      await load();
      setStatus((current) => ({ ...current, success: "Appointment status updated." }));
    } catch (error) {
      setStatus((current) => ({ ...current, error: formatApiError(error, "Could not update appointment status") }));
    }
  };

  const cancelAppointment = async () => {
    setStatus((current) => ({ ...current, error: "", success: "" }));
    try {
      await api.post(`/owner/appointments/${id}/cancel`, { note: statusNote || "Cancelled from detail view" });
      await load();
      setStatus((current) => ({ ...current, success: "Appointment cancelled." }));
    } catch (error) {
      setStatus((current) => ({ ...current, error: formatApiError(error, "Could not cancel appointment") }));
    }
  };

  const openBillPreview = () => {
    const overrides = {};
    (appointment?.items || []).forEach((item) => {
      (item.service?.consumables || []).forEach((cons) => {
        overrides[`${item.serviceId}:${cons.productId}`] = Number(cons.reqdQty || 0);
      });
    });
    setConsumableOverrides(overrides);
    setShowBillPreview(true);
  };

  const updateOverride = useCallback((key, value) => {
    setConsumableOverrides((prev) => ({ ...prev, [key]: value }));
  }, []);

  const shareViaWhatsAppApi = async () => {
    setWhatsappResult({ error: "", success: "" });
    setWhatsappLoading(true);
    try {
      await api.post(`/owner/appointments/${id}/share-whatsapp`);
      setWhatsappResult({ error: "", success: "Appointment confirmation sent via WhatsApp!" });
    } catch (err) {
      setWhatsappResult({ error: err.response?.data?.message || "Failed to send WhatsApp message", success: "" });
    } finally {
      setWhatsappLoading(false);
    }
  };

  const shareViaWhatsAppWeb = () => {
    if (!appointment?.customer?.phone) {
      setWhatsappResult({ error: "Customer has no phone number", success: "" });
      return;
    }
    const rawDigits = appointment.customer.phone.replace(/[^\d]/g, "");
    const phone = rawDigits.startsWith("91") ? rawDigits : `91${rawDigits}`;
    const startStr = new Date(appointment.startAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    const services = (appointment.items || []).map(i => i.service?.name).filter(Boolean).join(", ");
    const text = encodeURIComponent(`Hello ${appointment.customer?.name || "Customer"}! 🌟\n\nYour appointment at ${appointment.branch?.name || "Salon"} is scheduled for *${startStr}*.\n\nBooked Services: ${services || "Salon Services"}\n\nThank you for booking with us!`);
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, "_blank");
  };

  const convertToInvoice = async () => {
    setStatus((current) => ({ ...current, error: "", success: "" }));
    setCreating(true);
    try {
      const hasOverrides = Object.values(consumableOverrides).some((v) => v != null);
      const payload = hasOverrides ? { consumableOverrides } : {};
      const response = await api.post(`/owner/appointments/${id}/convert-to-invoice`, payload);
      setShowBillPreview(false);
      setStatus((current) => ({ ...current, success: `Invoice ${response.data.invoiceNumber} created from appointment.` }));
      navigate(`/admin/invoices`);
    } catch (error) {
      setStatus((current) => ({ ...current, error: formatApiError(error, "Could not convert appointment to invoice") }));
    } finally {
      setCreating(false);
    }
  };

  const billServices = appointment?.items || [];
  const totalServices = billServices.length;
  const totalConsumables = billServices.reduce((sum, item) => sum + (item.service?.consumables?.length || 0), 0);

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED": return { bg: "#dcfce7", color: "#16a34a" };
      case "CONFIRMED": return { bg: "#dbeafe", color: "#2563eb" };
      case "PENDING": return { bg: "#fef3c7", color: "#d97706" };
      case "IN_PROGRESS": return { bg: "#f3e8ff", color: "#9333ea" };
      case "CANCELLED":
      case "NO_SHOW": return { bg: "#fee2e2", color: "#dc2626" };
      default: return { bg: "#f1f5f9", color: "#64748b" };
    }
  };

  return (
    <div className="page-shell">
      <ModuleTabs
        title="Appointment Detail"
        description="Inspect booking scope, assigned staff, booking history, customer self-service links, and billing conversion."
        items={[
          { label: "Appointments", to: "/admin/appointments", hint: "Back" },
          { label: "Detail", to: `/admin/appointments/${id}`, hint: "Inspect" },
          { label: "Edit", to: `/admin/appointments/${id}/edit`, hint: "Modify" }
        ]}
        actions={<Link to="/admin/appointments" className="module-tab" style={{ background: "#f8fafc", border: "1px solid #cbd5e1" }}>Back to Queue</Link>}
      />

      {status.loading && (
        <PageLoader
          title="Loading appointment detail"
          message="Preparing booking activity, assigned staff, self-service links, and billing controls."
        />
      )}
      {status.error && <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 20 }}>{status.error}</div>}
      {status.success && <div style={{ padding: "12px 16px", background: "#f0fdfa", color: "#0f766e", border: "1px solid #99f6e4", borderRadius: 8, marginBottom: 20 }}>{status.success}</div>}

      {appointment && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
          
          {/* LEFT COLUMN - APPOINTMENT INFO */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Header Card */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: "0 0 8px 0", fontSize: 24, fontWeight: 700, color: "#0f172a" }}>
                    {appointment.title || appointment.customer?.name || "Appointment"}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#64748b", fontSize: 13 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={14} /> {appointment.branch?.name || "Main branch"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Tag size={14} /> {appointment.bookingChannel}</span>
                  </div>
                </div>
                <div style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, ...getStatusColor(appointment.status) }}>
                  {appointment.status}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9", marginBottom: 20 }}>
                <Clock size={16} color="#3b82f6" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                  {new Date(appointment.startAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  <span style={{ color: "#94a3b8", margin: "0 8px" }}>&rarr;</span>
                  {new Date(appointment.endAt).toLocaleTimeString([], { timeStyle: 'short' })}
                </span>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Internal Notes</div>
                <p style={{ margin: 0, fontSize: 14, color: appointment.notes ? "#334155" : "#94a3b8", lineHeight: 1.5, padding: "12px", background: "#f8fafc", borderRadius: 8, fontStyle: appointment.notes ? "normal" : "italic" }}>
                  {appointment.notes || "No notes added for this booking."}
                </p>
              </div>
            </div>

            {/* Services Stack */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 4, height: 16, background: "#8b5cf6", borderRadius: 4 }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Booked Services</h3>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(appointment.items || []).map((item, idx) => (
                  <div key={item.id} style={{ padding: "20px 24px", borderBottom: idx < appointment.items.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{item.service?.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={14} /> {new Date(item.startAt).toLocaleTimeString([], {timeStyle: 'short'})} - {new Date(item.endAt).toLocaleTimeString([], {timeStyle: 'short'})}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: (item.service?.consumables?.length > 0) ? 12 : 0 }}>
                      <User size={14} color="#94a3b8" />
                      {(item.assignedStaff || []).map((assignment) => (
                        <span key={assignment.id} style={{ fontSize: 12, background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>
                          {assignment.userSalon?.user?.name}
                        </span>
                      ))}
                      {!(item.assignedStaff || []).length && <span style={{ fontSize: 12, color: "#94a3b8" }}>Unassigned</span>}
                    </div>

                    {(item.service?.consumables || []).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                        <div style={{ width: "100%", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Products Required</div>
                        {item.service.consumables.map((cons) => (
                          <span key={cons.id} style={{ fontSize: 12, background: "#fff", border: "1px solid #e2e8f0", color: "#475569", padding: "4px 10px", borderRadius: 6, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                            {cons.product?.name || "Product"}: <strong>{Number(cons.reqdQty)} {cons.product?.secondaryUnit || cons.product?.unit || "pcs"}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* History Logs */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 4, height: 16, background: "#64748b", borderRadius: 4 }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Activity Log</h3>
              </div>
              <div style={{ padding: "20px 24px" }}>
                {(appointment.logs || []).map((log, idx) => (
                  <div key={log.id} style={{ display: "flex", gap: 16, marginBottom: idx < appointment.logs.length - 1 ? 20 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#cbd5e1", marginTop: 4 }} />
                      {idx < appointment.logs.length - 1 && <div style={{ width: 2, flex: 1, background: "#f1f5f9", marginTop: 4 }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: idx < appointment.logs.length - 1 ? 20 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <strong style={{ fontSize: 14, color: "#0f172a" }}>{log.action}</strong>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{new Date(log.createdAt).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'})}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                        {log.details || `${log.fromStatus || "-"} \u2192 ${log.toStatus || "-"}`}
                      </div>
                    </div>
                  </div>
                ))}
                {!(appointment.logs || []).length && (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 14 }}>
                    No activity recorded yet.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - ACTIONS & CONTROLS */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "sticky", top: 24 }}>
            
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Update Status</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Status</label>
                  <CustomSelect value={statusValue} onChange={(event) => setStatusValue(event.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, outline: "none", color: "#0f172a", backgroundColor: "#fff" }}>
                    {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </CustomSelect>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Note (Optional)</label>
                  <input value={statusNote} placeholder="Reason for change..." onChange={(event) => setStatusNote(event.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, outline: "none" }} />
                </div>
                
                <button type="button" onClick={updateStatus} style={{ padding: "12px", background: "#1e293b", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#0f172a"} onMouseLeave={e => e.currentTarget.style.background = "#1e293b"}>
                  <RefreshCw size={16} /> Update Status
                </button>
              </div>

              <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: "24px 0" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Link to={`/admin/appointments/${id}/edit`} style={{ padding: "12px", background: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}>
                  <Edit size={16} /> Edit Booking Details
                </Link>
                
                <button type="button" onClick={openBillPreview} disabled={appointment.status !== "COMPLETED"} style={{ padding: "12px", background: appointment.status === "COMPLETED" ? "#10b981" : "#f1f5f9", color: appointment.status === "COMPLETED" ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: appointment.status === "COMPLETED" ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }} onMouseEnter={e => {if(appointment.status==="COMPLETED") e.currentTarget.style.background = "#059669"}} onMouseLeave={e => {if(appointment.status==="COMPLETED") e.currentTarget.style.background = "#10b981"}}>
                  <FileText size={16} /> Generate Bill
                </button>
                
                <button type="button" onClick={cancelAppointment} disabled={appointment.status === "CANCELLED"} style={{ padding: "12px", background: "none", color: appointment.status === "CANCELLED" ? "#fca5a5" : "#ef4444", border: appointment.status === "CANCELLED" ? "1px solid #fecaca" : "1px solid #f87171", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: appointment.status === "CANCELLED" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
                  <XCircle size={16} /> Cancel Appointment
                </button>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>WhatsApp Sharing</div>
                  
                  {whatsappResult.error && <div style={{ fontSize: 12, color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: 6, border: "1px solid #fecaca" }}>{whatsappResult.error}</div>}
                  {whatsappResult.success && <div style={{ fontSize: 12, color: "#16a34a", background: "#f0fdf4", padding: "8px 12px", borderRadius: 6, border: "1px solid #bbf7d0" }}>{whatsappResult.success}</div>}

                  <button type="button" onClick={shareViaWhatsAppApi} disabled={whatsappLoading || !appointment.customer?.phone} style={{ padding: "10px 14px", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: appointment.customer?.phone ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#1eb954"} onMouseLeave={e => e.currentTarget.style.background = "#25D366"}>
                    <MessageSquare size={16} /> {whatsappLoading ? "Sending..." : "Send using WhatsApp API"}
                  </button>

                  <button type="button" onClick={shareViaWhatsAppWeb} disabled={!appointment.customer?.phone} style={{ padding: "10px 14px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: appointment.customer?.phone ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#dcfce7"} onMouseLeave={e => e.currentTarget.style.background = "#f0fdf4"}>
                    Share via WhatsApp Web
                  </button>
                </div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={16} /> Booking Controls
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}>
                  <span style={{ color: "#64748b" }}>Advance Required</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{appointment.advancePaymentRequired ? "Yes" : "No"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}>
                  <span style={{ color: "#64748b" }}>Advance Paid</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{formatMoney(appointment.advancePaidAmount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}>
                  <span style={{ color: "#64748b" }}>Approval</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{appointment.approvalStatus || "Approved"}</span>
                </div>
                
                {selfLinks && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ color: "#64748b", marginBottom: 4 }}>Self-Service Links</div>
                    <input readOnly value={selfLinks.cancelUrl} style={{ width: "100%", padding: "6px 10px", fontSize: 11, background: "#fff", border: "1px solid #cbd5e1", borderRadius: 6, marginBottom: 8, color: "#475569" }} onClick={e => e.target.select()} />
                    <input readOnly value={selfLinks.rescheduleUrl} style={{ width: "100%", padding: "6px 10px", fontSize: 11, background: "#fff", border: "1px solid #cbd5e1", borderRadius: 6, color: "#475569" }} onClick={e => e.target.select()} />
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {showBillPreview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} onClick={() => !creating && setShowBillPreview(false)} />
          <div style={{ position: "relative", width: 520, maxWidth: "95vw", background: "#fff", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Bill Preview</h2>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{appointment.customer?.name || "Customer"} &middot; {totalServices} service{totalServices !== 1 ? "s" : ""} &middot; {totalConsumables} consumable{totalConsumables !== 1 ? "s" : ""}</div>
              </div>
              <button onClick={() => !creating && setShowBillPreview(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#64748b", padding: 4 }}>&times;</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              {billServices.map((item) => {
                const svc = item.service;
                const price = Number(svc?.price || 0);
                const taxRate = Number(svc?.taxRate || 0);
                const lineTotal = price + (price * taxRate) / 100;
                const staffNames = (item.assignedStaff || []).map((a) => a.userSalon?.user?.name).filter(Boolean).join(", ");
                const consumables = svc?.consumables || [];

                return (
                  <div key={item.id} style={{ marginBottom: 16, border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ padding: "12px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{svc?.name || "Service"}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{staffNames || "No staff"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{formatMoney(price)}</div>
                        {taxRate > 0 && <div style={{ fontSize: 10, color: "#94a3b8" }}>+{taxRate}% tax</div>}
                      </div>
                    </div>

                    {consumables.length > 0 ? (
                      <div style={{ padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Consumables Used</div>
                        {consumables.map((cons) => {
                          const key = `${item.serviceId}:${cons.productId}`;
                          const unit = cons.product?.secondaryUnit || cons.product?.unit || "pcs";
                          const defaultQty = Number(cons.reqdQty || 0);
                          const currentQty = consumableOverrides[key] ?? defaultQty;
                          const changed = currentQty !== defaultQty;

                          return (
                            <div key={cons.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "8px 10px", background: changed ? "#fefce8" : "#f8fafc", borderRadius: 8, border: changed ? "1px solid #fbbf24" : "1px solid #e2e8f0" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cons.product?.name || "Product"}</div>
                                <div style={{ fontSize: 10, color: "#94a3b8" }}>Default: {defaultQty} {unit}</div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={currentQty}
                                  onChange={(e) => updateOverride(key, Number(e.target.value) || 0)}
                                  style={{ width: 72, padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, textAlign: "center", fontWeight: 600, background: "#fff" }}
                                />
                                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{unit}</span>
                              </div>
                              {changed && (
                                <button
                                  onClick={() => updateOverride(key, defaultQty)}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: 2, lineHeight: 1 }}
                                  title="Reset to default"
                                >
                                  &#8634;
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8" }}>No consumables configured for this service</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13, color: "#475569" }}>
                <span>Services: {totalServices}</span>
                <span>Consumable overrides: {Object.keys(consumableOverrides).filter((k) => {
                  const [svcId, prodId] = k.split(":");
                  const svc = billServices.find((i) => i.serviceId === svcId);
                  const cons = svc?.service?.consumables?.find((c) => c.productId === prodId);
                  return cons && consumableOverrides[k] !== Number(cons.reqdQty || 0);
                }).length}</span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowBillPreview(false)}
                  disabled={creating}
                  style={{ flex: 1, padding: "12px 24px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 600, cursor: "pointer", color: "#475569" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={convertToInvoice}
                  disabled={creating}
                  style={{ flex: 2, padding: "12px 24px", background: creating ? "#94a3b8" : "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer", fontSize: 14 }}
                >
                  {creating ? "Creating Invoice..." : "Confirm & Create Invoice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
