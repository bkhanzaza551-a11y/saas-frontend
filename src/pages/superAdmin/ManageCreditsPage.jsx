import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Edit2, ShieldAlert, MessageCircle, MessageSquare, CreditCard, X, Save } from "lucide-react";
import { api } from "../../api/client";
import { formatCurrency } from "../../utils/currency.js";
import PageLoader from "../../components/PageLoader.jsx";
import { useAlert } from "../../context/AlertContext.jsx";

export default function ManageCreditsPage() {
  const { showAlert } = useAlert();
  const [salons, setSalons] = useState([]);
  const [packages, setPackages] = useState([]);
  const [costs, setCosts] = useState({ whatsappCreditCost: 1, smsCreditCost: 1 });
  const [loading, setLoading] = useState(true);
  const [savingCosts, setSavingCosts] = useState(false);
  
  // Package modal
  const [pkgModalOpen, setPkgModalOpen] = useState(false);
  const [pkgForm, setPkgForm] = useState({ id: "", name: "", credits: "", price: "", currency: "INR" });

  // Add credits modal
  const [addCreditsModalOpen, setAddCreditsModalOpen] = useState(false);
  const [creditForm, setCreditForm] = useState({ salonId: "", amount: "", note: "" });

  // Custom API modal
  const [customApiModalOpen, setCustomApiModalOpen] = useState(false);
  const [customApiForm, setCustomApiForm] = useState({
    salonId: "",
    customWhatsappEnabled: false,
    customWhatsappToken: "",
    customWhatsappPhoneId: "",
    customWhatsappAccountId: ""
  });

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salonsRes, pkgsRes, costsRes] = await Promise.all([
        api.get("/super-admin/credits/salons"),
        api.get("/super-admin/credits/packages"),
        api.get("/super-admin/credits/costs")
      ]);
      setSalons(salonsRes.data || []);
      setPackages(pkgsRes.data || []);
      setCosts(costsRes.data || { whatsappCreditCost: 1, smsCreditCost: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    try {
      if (pkgForm.id) {
        await api.patch(`/super-admin/credits/packages/${pkgForm.id}`, {
          name: pkgForm.name,
          credits: Number(pkgForm.credits),
          price: Number(pkgForm.price),
          currency: pkgForm.currency
        });
      } else {
        await api.post("/super-admin/credits/packages", {
          name: pkgForm.name,
          credits: Number(pkgForm.credits),
          price: Number(pkgForm.price),
          currency: pkgForm.currency
        });
      }
      setPkgModalOpen(false);
      fetchData();
    } catch (err) {
      showAlert("Failed to save package");
    }
  };

  const handleAddCredits = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/super-admin/credits/salons/${creditForm.salonId}/add`, {
        amount: Number(creditForm.amount),
        note: creditForm.note
      });
      setAddCreditsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Failed to add credits");
    }
  };

  const handleSaveCosts = async (e) => {
    e.preventDefault();
    try {
      setSavingCosts(true);
      await api.post("/super-admin/credits/costs", costs);
      alert("Costs updated successfully");
      fetchData();
    } catch (err) {
      alert("Failed to update costs");
    } finally {
      setSavingCosts(false);
    }
  };

  const handleSaveCustomApi = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/super-admin/credits/salons/${customApiForm.salonId}/whatsapp-api`, {
        customWhatsappEnabled: customApiForm.customWhatsappEnabled,
        customWhatsappToken: customApiForm.customWhatsappToken,
        customWhatsappPhoneId: customApiForm.customWhatsappPhoneId,
        customWhatsappAccountId: customApiForm.customWhatsappAccountId
      });
      setCustomApiModalOpen(false);
      showAlert("Custom API configured successfully");
      fetchData();
    } catch (err) {
      alert("Failed to save custom API configuration");
    }
  };

  const filteredSalons = salons.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <PageLoader title="Loading Credit Hub" />;

  const cardStyle = {
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  };

  const cardHeaderStyle = {
    padding: "24px 28px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff"
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "0.95rem",
    color: "#334155",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s"
  };

  return (
    <div className="manage-credits-container" style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto", fontFamily: "'Inter', sans-serif", color: "#1e293b" }}>
      <style>{`
        .manage-credits-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .manage-credits-grid {
            grid-template-columns: 1fr;
          }
        }
        .credits-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: "36px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", padding: "12px", borderRadius: "14px", boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)" }}>
              <CreditCard size={28} />
            </div>
            WhatsApp Credits
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "16px", fontWeight: 500 }}>Manage communication credits, configure pricing, and monitor salon usage.</p>
        </div>
      </div>

      <div className="manage-credits-grid">
        
        {/* Left Side: Packages & Costs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Credit Packages */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Credit Packages</h3>
              <button 
                onClick={() => { setPkgForm({ id: "", name: "", credits: "", price: "", currency: "INR" }); setPkgModalOpen(true); }}
                style={{ background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)", transition: "all 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "none"}
              >
                <PlusCircle size={16} /> Create Package
              </button>
            </div>
            <div className="credits-table-wrapper">
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "16px 28px", fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>Package Name</th>
                    <th style={{ padding: "16px 28px", fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>Credits</th>
                    <th style={{ padding: "16px 28px", fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>Price</th>
                    <th style={{ padding: "16px 28px", fontWeight: 700, width: "60px", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontWeight: 500 }}>No packages found. Create one above.</td></tr>
                  ) : packages.map(pkg => (
                    <tr key={pkg.id} style={{ transition: "background 0.2s", borderBottom: "1px solid #f1f5f9" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "20px 28px", fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>{pkg.name}</td>
                      <td style={{ padding: "20px 28px", color: "#0f172a" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#ecfdf5", color: "#059669", padding: "6px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700 }}>
                          {pkg.credits.toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: "20px 28px", color: "#1e293b", fontWeight: 700, fontSize: "0.95rem" }}>{formatCurrency(pkg.price)}</td>
                      <td style={{ padding: "20px 28px", textAlign: "center" }}>
                        <button onClick={() => { setPkgForm(pkg); setPkgModalOpen(true); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: "8px", borderRadius: "8px", transition: "all 0.2s" }} title="Edit Package" onMouseOver={(e) => { e.currentTarget.style.color = "#4f46e5"; e.currentTarget.style.background = "#eef2ff"; }} onMouseOut={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent"; }}>
                          <Edit2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Consumption Costs */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Consumption Costs</h3>
            </div>
            <div style={{ padding: "24px" }}>
              <form onSubmit={handleSaveCosts} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", fontWeight: 700, color: "#334155", marginBottom: "12px" }}>
                    <MessageCircle size={18} color="#10b981" />
                    WhatsApp Cost <span style={{ color: "#94a3b8", fontWeight: 500 }}>(Credits per message)</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input 
                      type="number" required min="0.01" step="0.01"
                      style={{ ...inputStyle, paddingLeft: "16px", fontSize: "1.1rem", fontWeight: 700, borderColor: "#e2e8f0", transition: "border-color 0.2s" }}
                      value={costs.whatsappCreditCost} onChange={e => setCosts({...costs, whatsappCreditCost: e.target.value})} 
                      onFocus={e => e.target.style.borderColor = "#10b981"}
                      onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "12px" }}>
                  <button type="submit" disabled={savingCosts} style={{ width: "100%", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", border: "none", borderRadius: "10px", padding: "14px", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", cursor: savingCosts ? "not-allowed" : "pointer", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)", transition: "transform 0.2s", opacity: savingCosts ? 0.7 : 1 }} onMouseOver={(e) => !savingCosts && (e.currentTarget.style.transform = "translateY(-1px)")} onMouseOut={(e) => !savingCosts && (e.currentTarget.style.transform = "none")}>
                    <Save size={18} />
                    {savingCosts ? "Saving Settings..." : "Save Pricing Settings"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side: Salons */}
        <div style={cardStyle}>
          <div style={{ ...cardHeaderStyle, flexWrap: "wrap", gap: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Salon Balances</h3>
            <div style={{ position: "relative", minWidth: "300px" }}>
              <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", pointerEvents: "none" }}>
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Search salons by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: "42px", background: "#f8fafc", borderColor: "#e2e8f0" }}
                onFocus={e => { e.target.style.background = "#fff"; e.target.style.borderColor = "#6366f1"; }}
                onBlur={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#e2e8f0"; }}
              />
            </div>
          </div>
          <div className="credits-table-wrapper">
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "16px 28px", fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>Salon Details</th>
                  <th style={{ padding: "16px 28px", fontWeight: 700, textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>Available Credits</th>
                  <th style={{ padding: "16px 28px", fontWeight: 700, width: "200px", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalons.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontWeight: 500 }}>No salons found matching your search.</td></tr>
                ) : filteredSalons.map(salon => (
                  <tr key={salon.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "20px 28px" }}>
                      <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem", marginBottom: "6px" }}>{salon.name}</div>
                      <div style={{ color: "#64748b", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: salon.customWhatsappEnabled ? "#10b981" : "#cbd5e1" }}></div>
                        {salon.email}
                      </div>
                    </td>
                    <td style={{ padding: "20px 28px", textAlign: "right" }}>
                      <span style={{ 
                        padding: "8px 16px", 
                        borderRadius: "24px", 
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        background: salon.credits > 0 ? "#ecfdf5" : "#fef2f2",
                        color: salon.credits > 0 ? "#059669" : "#dc2626",
                        display: "inline-block",
                        minWidth: "80px",
                        textAlign: "center",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
                      }}>
                        {Number(salon.credits || 0).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: "20px 28px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px", justifyContent: "flex-end", width: "100%" }}>
                        <button 
                          style={{ background: "#fff", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "10px", padding: "8px 14px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", whiteSpace: "nowrap" }} 
                          onClick={() => { setCreditForm({ salonId: salon.id, amount: "", note: "" }); setAddCreditsModalOpen(true); }}
                          onMouseOver={(e) => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.color = "#0f172a"; }}
                          onMouseOut={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#475569"; }}
                        >
                          Adjust
                        </button>
                        <button 
                          style={{ background: salon.customWhatsappEnabled ? "#10b981" : "#f1f5f9", border: "none", color: salon.customWhatsappEnabled ? "#fff" : "#475569", borderRadius: "10px", padding: "8px 14px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", boxShadow: salon.customWhatsappEnabled ? "0 2px 4px rgba(16, 185, 129, 0.2)" : "none", whiteSpace: "nowrap" }} 
                          onClick={() => {
                            setCustomApiForm({
                              salonId: salon.id,
                              customWhatsappEnabled: salon.customWhatsappEnabled || false,
                              customWhatsappToken: salon.customWhatsappToken || "",
                              customWhatsappPhoneId: salon.customWhatsappPhoneId || "",
                              customWhatsappAccountId: salon.customWhatsappAccountId || ""
                            });
                            setCustomApiModalOpen(true);
                          }}
                          onMouseOver={(e) => { 
                            if (salon.customWhatsappEnabled) {
                              e.currentTarget.style.transform = "translateY(-1px)";
                            } else {
                              e.currentTarget.style.background = "#e2e8f0";
                              e.currentTarget.style.color = "#0f172a";
                            }
                          }}
                          onMouseOut={(e) => { 
                            if (salon.customWhatsappEnabled) {
                              e.currentTarget.style.transform = "none";
                            } else {
                              e.currentTarget.style.background = "#f1f5f9";
                              e.currentTarget.style.color = "#475569";
                            }
                          }}
                          title="Configure Custom WhatsApp API"
                        >
                          API Settings
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Package Modal */}
      {pkgModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "480px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{pkgForm.id ? "Edit Credit Package" : "Create New Package"}</h2>
              <button type="button" onClick={() => setPkgModalOpen(false)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px", borderRadius: "50%" }} onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSavePackage} style={{ padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Package Name</label>
                  <input type="text" required value={pkgForm.name} onChange={e => setPkgForm({...pkgForm, name: e.target.value})} placeholder="e.g. Starter Pack (5,000 Credits)" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Credit Amount</label>
                    <input type="number" required min="1" value={pkgForm.credits} onChange={e => setPkgForm({...pkgForm, credits: e.target.value})} placeholder="e.g. 5000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Price (₹)</label>
                    <input type="number" required min="0" step="0.01" value={pkgForm.price} onChange={e => setPkgForm({...pkgForm, price: e.target.value})} placeholder="e.g. 999.00" style={inputStyle} />
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => setPkgModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "#fff"}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#0f172a", color: "#fff", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }} onMouseOver={(e) => e.currentTarget.style.background = "#1e293b"} onMouseOut={(e) => e.currentTarget.style.background = "#0f172a"}>
                  <Save size={18} /> {pkgForm.id ? "Update Package" : "Publish Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {addCreditsModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "480px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>Adjust Salon Balance</h2>
              <button type="button" onClick={() => setAddCreditsModalOpen(false)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px", borderRadius: "50%" }} onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCredits} style={{ padding: "24px" }}>
              <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", color: "#b45309", padding: "16px", borderRadius: "12px", display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "24px" }}>
                <ShieldAlert size={24} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: "1.5" }}>
                  <strong>Manual Adjustment:</strong> Use positive numbers (e.g. <code style={{background:"#fef3c7", padding:"2px 4px", borderRadius:4}}>500</code>) to add credits, or negative numbers (e.g. <code style={{background:"#fef3c7", padding:"2px 4px", borderRadius:4}}>-200</code>) to deduct them.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Credit Amount</label>
                  <input type="number" required value={creditForm.amount} onChange={e => setCreditForm({...creditForm, amount: e.target.value})} placeholder="e.g. 500 or -150" style={{ ...inputStyle, fontSize: "1.1rem", fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Reason / Note</label>
                  <textarea required value={creditForm.note} onChange={e => setCreditForm({...creditForm, note: e.target.value})} placeholder="e.g. Manual recharge via cash payment" rows={3} style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}></textarea>
                </div>
              </div>
              <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => setAddCreditsModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "#fff"}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)" }} onMouseOver={(e) => e.currentTarget.style.background = "#1d4ed8"} onMouseOut={(e) => e.currentTarget.style.background = "#2563eb"}>
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom WhatsApp API Modal */}
      {customApiModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "520px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>Custom WhatsApp API</h2>
              <button type="button" onClick={() => setCustomApiModalOpen(false)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px", borderRadius: "50%" }} onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCustomApi} style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", padding: "16px", background: customApiForm.customWhatsappEnabled ? "#ecfdf5" : "#f1f5f9", borderRadius: "12px", border: `1px solid ${customApiForm.customWhatsappEnabled ? "#10b981" : "#cbd5e1"}` }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "12px", flex: 1, margin: 0 }}>
                  <div style={{ position: "relative", width: "44px", height: "24px", background: customApiForm.customWhatsappEnabled ? "#10b981" : "#cbd5e1", borderRadius: "12px", transition: "background 0.3s" }}>
                    <div style={{ position: "absolute", top: "2px", left: customApiForm.customWhatsappEnabled ? "22px" : "2px", width: "20px", height: "20px", background: "#fff", borderRadius: "50%", transition: "left 0.3s" }}></div>
                  </div>
                  <input type="checkbox" style={{ display: "none" }} checked={customApiForm.customWhatsappEnabled} onChange={e => setCustomApiForm({...customApiForm, customWhatsappEnabled: e.target.checked})} />
                  <div>
                    <div style={{ fontWeight: 700, color: customApiForm.customWhatsappEnabled ? "#065f46" : "#334155", fontSize: "1rem" }}>Bypass Credit System</div>
                    <div style={{ fontSize: "0.85rem", color: customApiForm.customWhatsappEnabled ? "#047857" : "#64748b" }}>Use salon's own WhatsApp credentials</div>
                  </div>
                </label>
              </div>

              {customApiForm.customWhatsappEnabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "fadeIn 0.3s" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Meta Access Token</label>
                    <input type="text" required value={customApiForm.customWhatsappToken} onChange={e => setCustomApiForm({...customApiForm, customWhatsappToken: e.target.value})} placeholder="EAA..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Phone Number ID</label>
                    <input type="text" required value={customApiForm.customWhatsappPhoneId} onChange={e => setCustomApiForm({...customApiForm, customWhatsappPhoneId: e.target.value})} placeholder="e.g. 123456789012345" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Business Account ID (Optional)</label>
                    <input type="text" value={customApiForm.customWhatsappAccountId} onChange={e => setCustomApiForm({...customApiForm, customWhatsappAccountId: e.target.value})} placeholder="e.g. 123456789012345" style={inputStyle} />
                  </div>
                </div>
              )}

              <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => setCustomApiModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "#fff"}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#0f172a", color: "#fff", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }} onMouseOver={(e) => e.currentTarget.style.background = "#1e293b"} onMouseOut={(e) => e.currentTarget.style.background = "#0f172a"}>
                  <Save size={18} /> Save Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

