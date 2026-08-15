import React, { useState, useEffect } from "react";
import { History, MessageSquare, PlusCircle } from "lucide-react";
import { api } from "../../api/client";
import { formatCurrency } from "../../utils/currency.js";
import PageLoader from "../../components/PageLoader.jsx";

export default function WhatsAppCreditsPage() {
  const [balance, setBalance] = useState(0);
  const [packages, setPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customApiEnabled, setCustomApiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, pkgRes, txnRes] = await Promise.all([
        api.get("/owner/credits/balance"),
        api.get("/owner/credits/packages"),
        api.get("/owner/credits/transactions")
      ]);
      setBalance(balRes.data.credits || 0);
      setCustomApiEnabled(balRes.data.customWhatsappEnabled || false);
      setPackages(pkgRes.data || []);
      setTransactions(txnRes.data || []);
    } catch (err) {
      setError("Could not load credit information.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg) => {
    try {
      setPurchasing(true);
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        alert("Razorpay SDK failed to load. Are you online?");
        setPurchasing(false);
        return;
      }

      // Create Order on backend
      const orderRes = await api.post("/owner/credits/create-order", { packageId: pkg.id });
      const { orderId, amount, currency, key: razorpayKey } = orderRes.data;

      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency,
        name: "Salon App Credits",
        description: `Purchase ${pkg.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await api.post("/owner/credits/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              packageId: pkg.id
            });
            alert("Payment successful! Credits added to your account.");
            fetchData();
          } catch (err) {
            alert("Payment verification failed. If money was deducted, please contact support.");
          }
        },
        prefill: {
          name: "Salon Owner",
          email: "owner@salon.com"
        },
        theme: { color: "#3b82f6" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert("Payment Failed: " + response.error.description);
      });
      rzp.open();
    } catch (err) {
      alert("Could not initiate purchase. " + (err.response?.data?.message || err.message));
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <PageLoader title="Loading Credits" />;

  return (
    <div className="page-shell">
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">WhatsApp Credits</h1>
          <p className="page-subtitle">Manage your messaging balance to send automated reminders and invoices</p>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            {customApiEnabled && (
        <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ background: '#10b981', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#065f46', fontSize: '1.1rem', fontWeight: 700 }}>Custom WhatsApp API Active</h3>
            <p style={{ margin: 0, color: '#047857', lineHeight: '1.5' }}>
              Your salon is configured to use its own dedicated Meta WhatsApp API credentials. Messages sent by your salon will <strong>bypass the platform credit system</strong> and will not deduct from your balance. You do not need to purchase credits here.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        {/* Left Side: Balance & Packages */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="panel-card" style={{ padding: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", color: "white", borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                <MessageSquare size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.1rem", color: "#e0e7ff", fontWeight: "500", margin: 0, marginBottom: "4px" }}>Available Credits</h2>
                <div style={{ fontSize: "2.2rem", fontWeight: "800", lineHeight: 1 }}>{balance}</div>
              </div>
            </div>
          </div>

                    {!customApiEnabled && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "1rem", color: "#334155" }}>Purchase Packages</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {packages.map((pkg) => (
                <div key={pkg.id} className="panel-card" style={{ padding: "1.25rem", border: "1px solid #e2e8f0", borderRadius: "10px", transition: "all 0.2s", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ marginBottom: "1.2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <h4 style={{ fontWeight: "700", color: "#0f172a", fontSize: "1rem", margin: 0, lineHeight: 1.2, paddingRight: "8px" }}>{pkg.name}</h4>
                      <div style={{ fontWeight: "800", fontSize: "1.1rem", color: "#16a34a", whiteSpace: "nowrap" }}>
                        {formatCurrency(pkg.price)}
                      </div>
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                       <MessageSquare size={14} /> {pkg.credits} Credits
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePurchase(pkg)} 
                    disabled={purchasing}
                    style={{ width: "100%", padding: "0.6rem", background: "#f8fafc", color: "#3b82f6", borderRadius: "6px", border: "1px solid #bfdbfe", fontWeight: "600", cursor: purchasing ? "not-allowed" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", fontSize: "0.85rem", transition: "background 0.2s" }}
                    onMouseEnter={(e) => { if(!purchasing) { e.currentTarget.style.background = "#eff6ff"; } }}
                    onMouseLeave={(e) => { if(!purchasing) { e.currentTarget.style.background = "#f8fafc"; } }}
                  >
                    <PlusCircle size={16} />
                    {purchasing ? "Processing..." : "Buy Now"}
                  </button>
                </div>
              ))}
                            {packages.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem", color: "#64748b", background: "#f8fafc", borderRadius: 8, gridColumn: "1 / -1" }}>
                  No packages available at the moment.
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Right Side: Transactions History */}
        <div>
          <div className="panel-card">
            <div className="panel-header" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <History size={20} className="text-slate-500" />
              <h3 className="panel-title">Transaction History</h3>
            </div>
            <div className="panel-content" style={{ padding: 0 }}>
              {transactions.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
                  <History size={48} style={{ margin: "0 auto", marginBottom: 16, opacity: 0.2 }} />
                  <p>No transactions found.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Credits</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr key={txn.id}>
                          <td>{new Date(txn.createdAt).toLocaleString()}</td>
                          <td>
                            <span style={{ 
                              padding: "4px 8px", 
                              borderRadius: 4, 
                              fontSize: "0.75rem", 
                              fontWeight: "600",
                              background: txn.packageName === "MANUAL_ADD" ? "#dcfce7" : (txn.packageName === "USAGE" ? "#fef9c3" : "#f1f5f9"),
                              color: txn.packageName === "MANUAL_ADD" ? "#166534" : (txn.packageName === "USAGE" ? "#854d0e" : "#334155")
                            }}>
                              {txn.packageName}
                            </span>
                          </td>
                          <td style={{ fontWeight: "600", color: txn.packageName === "USAGE" ? "#ef4444" : "#10b981" }}>
                            {txn.packageName === "USAGE" ? "-" : "+"}{txn.credits}
                          </td>
                          <td>₹ {txn.amountPaidPaise ? (txn.amountPaidPaise / 100).toFixed(2) : "0.00"}</td>
                          <td>
                            <span style={{ 
                              padding: "4px 8px", 
                              borderRadius: 4, 
                              fontSize: "0.75rem", 
                              fontWeight: "600",
                              background: txn.status === "COMPLETED" ? "#dcfce7" : (txn.status === "FAILED" ? "#fee2e2" : "#fef3c7"),
                              color: txn.status === "COMPLETED" ? "#166534" : (txn.status === "FAILED" ? "#991b1b" : "#92400e")
                            }}>
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

