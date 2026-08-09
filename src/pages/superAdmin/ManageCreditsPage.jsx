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

  const filteredSalons = salons.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <PageLoader title="Loading Credit Hub" />;

  const cardStyle = {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)",
    border: "1px solid #f1f5f9",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  };

  const cardHeaderStyle = {
    padding: "20px 24px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f8fafc"
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.95rem",
    color: "#334155",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s"
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto", fontFamily: "'Poppins', sans-serif", color: "#1e293b" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "#eff6ff", color: "#3b82f6", padding: "10px", borderRadius: "12px" }}>
              <CreditCard size={28} />
            </div>
            WhatsApp Credits
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "15px" }}>Professional management of salon communication credits and pricing</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px", alignItems: "start" }}>
        
        {/* Left Side: Packages & Costs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Credit Packages */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Credit Packages</h3>
              <button 
                onClick={() => { setPkgForm({ id: "", name: "", credits: "", price: "", currency: "INR" }); setPkgModalOpen(true); }}
                style={{ background: "#0f172a", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", transition: "background 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.background = "#1e293b"}
                onMouseOut={(e) => e.currentTarget.style.background = "#0f172a"}
              >
                <PlusCircle size={16} /> Create Package
              </button>
            </div>
            <div style={{ padding: "0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "16px 24px", fontWeight: 600 }}>Package Name</th>
                    <th style={{ padding: "16px 24px", fontWeight: 600 }}>Credits</th>
                    <th style={{ padding: "16px 24px", fontWeight: 600 }}>Price</th>
                    <th style={{ padding: "16px 24px", fontWeight: 600, width: "60px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>No packages found. Create one above.</td></tr>
                  ) : packages.map(pkg => (
                    <tr key={pkg.id} style={{ borderTop: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "16px 24px", fontWeight: 600, color: "#334155" }}>{pkg.name}</td>
                      <td style={{ padding: "16px 24px", color: "#0f172a", fontWeight: 500 }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600 }}>
                          {pkg.credits.toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", color: "#0f172a", fontWeight: 600 }}>{formatCurrency(pkg.price)}</td>
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <button onClick={() => { setPkgForm(pkg); setPkgModalOpen(true); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", padding: "4px", borderRadius: "4px" }} title="Edit Package" onMouseOver={(e) => { e.currentTarget.style.color = "#3b82f6"; e.currentTarget.style.background = "#eff6ff"; }} onMouseOut={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}>
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
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                    <MessageCircle size={16} color="#25d366" />
                    WhatsApp Cost <span style={{ color: "#94a3b8", fontWeight: 400 }}>(Credits per message)</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input 
                      type="number" required min="0.01" step="0.01"
                      style={{ ...inputStyle, paddingLeft: "16px", fontSize: "1rem", fontWeight: 600 }}
                      value={costs.whatsappCreditCost} onChange={e => setCosts({...costs, whatsappCreditCost: e.target.value})} 
                    />
                  </div>
                </div>



                <div style={{ marginTop: "8px" }}>
                  <button type="submit" disabled={savingCosts} style={{ width: "100%", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", padding: "12px", fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: savingCosts ? "not-allowed" : "pointer", opacity: savingCosts ? 0.7 : 1, transition: "background 0.2s" }} onMouseOver={(e) => !savingCosts && (e.currentTarget.style.background = "#2563eb")} onMouseOut={(e) => !savingCosts && (e.currentTarget.style.background = "#3b82f6")}>
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
            <div style={{ position: "relative", minWidth: "250px" }}>
              <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input 
                type="text" 
                placeholder="Search salons by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: "36px", background: "#fff" }}
              />
            </div>
          </div>
          <div style={{ padding: "0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "16px 24px", fontWeight: 600 }}>Salon Details</th>
                  <th style={{ padding: "16px 24px", fontWeight: 600, textAlign: "right" }}>Available Credits</th>
                  <th style={{ padding: "16px 24px", fontWeight: 600, width: "120px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalons.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>No salons found matching your search.</td></tr>
                ) : filteredSalons.map(salon => (
                  <tr key={salon.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem", marginBottom: "4px" }}>{salon.name}</div>
                      <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{salon.email}</div>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <span style={{ 
                        padding: "6px 12px", 
                        borderRadius: "20px", 
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        background: salon.credits > 0 ? "#dcfce7" : "#fee2e2",
                        color: salon.credits > 0 ? "#166534" : "#991b1b",
                        display: "inline-block",
                        minWidth: "80px",
                        textAlign: "center"
                      }}>
                        {Number(salon.credits || 0).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "center" }}>
                      <button 
                        style={{ background: "#fff", border: "1px solid #cbd5e1", color: "#334155", borderRadius: "8px", padding: "6px 14px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }} 
                        onClick={() => { setCreditForm({ salonId: salon.id, amount: "", note: "" }); setAddCreditsModalOpen(true); }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.background = "#f8fafc"; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#fff"; }}
                      >
                        Adjust
                      </button>
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

    </div>
  );
}

