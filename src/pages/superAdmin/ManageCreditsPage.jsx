import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Edit2, ShieldAlert } from "lucide-react";
import { api } from "../../api/client";
import { formatCurrency } from "../../utils/currency.js";
import PageLoader from "../../components/PageLoader.jsx";

export default function ManageCreditsPage() {
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
      alert("Failed to save package");
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

  return (
    <div className="page-shell">
      <div className="page-header" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Manage WhatsApp Credits</h1>
          <p className="page-subtitle">Configure pricing packages and manage salon balances</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        {/* Left Side: Packages */}
        <div>
          <div className="panel-card">
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="panel-title">Credit Packages</h3>
              <button className="primary-button" style={{ padding: "6px 12px", fontSize: "0.85rem" }} onClick={() => { setPkgForm({ id: "", name: "", credits: "", price: "", currency: "INR" }); setPkgModalOpen(true); }}>
                <PlusCircle size={14} style={{ marginRight: 6 }} /> New Package
              </button>
            </div>
            <div className="panel-content" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Credits</th>
                    <th>Price</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map(pkg => (
                    <tr key={pkg.id}>
                      <td style={{ fontWeight: 600 }}>{pkg.name}</td>
                      <td>{pkg.credits}</td>
                      <td>{formatCurrency(pkg.price)}</td>
                      <td>
                        <button type="button" onClick={() => { setPkgForm(pkg); setPkgModalOpen(true); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#3b82f6" }}>
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel-card" style={{ marginTop: "2rem" }}>
            <div className="panel-header">
              <h3 className="panel-title">Credit Consumption Settings</h3>
            </div>
            <div className="panel-content">
              <form onSubmit={handleSaveCosts} className="form-grid">
                <div className="form-group">
                  <label>WhatsApp Cost (Credits per message)</label>
                  <input type="number" required min="1" value={costs.whatsappCreditCost} onChange={e => setCosts({...costs, whatsappCreditCost: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>SMS Cost (Credits per message)</label>
                  <input type="number" required min="1" value={costs.smsCreditCost} onChange={e => setCosts({...costs, smsCreditCost: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" className="primary-button" disabled={savingCosts}>
                    {savingCosts ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side: Salons */}
        <div>
          <div className="panel-card">
            <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="panel-title">Salon Balances</h3>
              <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <Search size={16} color="#64748b" />
                <input 
                  type="text" 
                  placeholder="Search salons..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: "none", background: "transparent", outline: "none", marginLeft: 8, fontSize: "0.85rem" }}
                />
              </div>
            </div>
            <div className="panel-content" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Salon Name</th>
                    <th>Email</th>
                    <th>Current Credits</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalons.map(salon => (
                    <tr key={salon.id}>
                      <td style={{ fontWeight: 600 }}>{salon.name}</td>
                      <td style={{ color: "#64748b" }}>{salon.email}</td>
                      <td>
                        <span style={{ 
                          padding: "4px 8px", 
                          borderRadius: 4, 
                          fontWeight: "bold",
                          background: salon.credits > 0 ? "#dcfce7" : "#fee2e2",
                          color: salon.credits > 0 ? "#166534" : "#991b1b"
                        }}>
                          {salon.credits || 0}
                        </span>
                      </td>
                      <td>
                        <button className="secondary-button" style={{ padding: "4px 8px", fontSize: "0.75rem" }} onClick={() => { setCreditForm({ salonId: salon.id, amount: "", note: "" }); setAddCreditsModalOpen(true); }}>
                          Adjust Balance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Package Modal */}
      {pkgModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>{pkgForm.id ? "Edit Package" : "Create Package"}</h2>
              <button type="button" className="close-button" onClick={() => setPkgModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSavePackage} className="modal-body form-grid">
              <div className="form-group">
                <label>Package Name</label>
                <input type="text" required value={pkgForm.name} onChange={e => setPkgForm({...pkgForm, name: e.target.value})} placeholder="e.g. Starter Pack" />
              </div>
              <div className="form-group">
                <label>Number of Credits</label>
                <input type="number" required min="1" value={pkgForm.credits} onChange={e => setPkgForm({...pkgForm, credits: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input type="number" required min="0" step="0.01" value={pkgForm.price} onChange={e => setPkgForm({...pkgForm, price: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select value={pkgForm.currency} onChange={e => setPkgForm({...pkgForm, currency: e.target.value})}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="modal-footer" style={{ gridColumn: "1 / -1" }}>
                <button type="button" className="secondary-button" onClick={() => setPkgModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Package</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {addCreditsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Adjust Salon Credits</h2>
              <button type="button" className="close-button" onClick={() => setAddCreditsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddCredits} className="modal-body form-grid">
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <div style={{ background: "#fef9c3", color: "#854d0e", padding: "12px", borderRadius: 8, display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 16 }}>
                  <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: "0.85rem", margin: 0 }}>You are manually adjusting the salon's credits. Use positive numbers to add credits, negative numbers to remove them.</p>
                </div>
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Amount (Credits to add/remove)</label>
                <input type="number" required value={creditForm.amount} onChange={e => setCreditForm({...creditForm, amount: e.target.value})} placeholder="e.g. 500 or -500" />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Note / Reason</label>
                <textarea required value={creditForm.note} onChange={e => setCreditForm({...creditForm, note: e.target.value})} placeholder="e.g. Manual recharge via cash" rows={3}></textarea>
              </div>
              <div className="modal-footer" style={{ gridColumn: "1 / -1" }}>
                <button type="button" className="secondary-button" onClick={() => setAddCreditsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
