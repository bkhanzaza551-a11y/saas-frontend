import React, { useState, useEffect } from "react";
import { History, MessageSquare, PlusCircle } from "lucide-react";
import { api } from "../../api/client";
import { formatCurrency } from "../../utils/currency.js";
import PageLoader from "../../components/PageLoader.jsx";

export default function WhatsAppCreditsPage() {
  const [balance, setBalance] = useState(0);
  const [packages, setPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
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
      const { order, razorpayKey } = orderRes.data;

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "Salon App Credits",
        description: `Purchase ${pkg.name}`,
        order_id: order.id,
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
          <h1 className="page-title">WhatsApp & SMS Credits</h1>
          <p className="page-subtitle">Manage your messaging balance to send automated reminders and invoices</p>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        {/* Left Side: Balance & Packages */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="panel-card" style={{ padding: "2rem", textAlign: "center", background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", borderColor: "#bfdbfe" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                <MessageSquare size={32} />
              </div>
            </div>
            <h2 style={{ fontSize: "1.25rem", color: "#1e40af", fontWeight: "600", marginBottom: "0.5rem" }}>Available Credits</h2>
            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#1e3a8a", lineHeight: 1 }}>{balance}</div>
            <p style={{ color: "#3b82f6", marginTop: "0.5rem", fontSize: "0.9rem" }}>1 credit = 1 WhatsApp / SMS message</p>
          </div>

          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "1rem", color: "#334155" }}>Purchase Packages</h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              {packages.map((pkg) => (
                <div key={pkg.id} className="panel-card" style={{ padding: "1.5rem", border: "2px solid transparent", transition: "all 0.2s", cursor: "pointer", position: "relative", overflow: "hidden" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#3b82f6"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <h4 style={{ fontWeight: "600", color: "#0f172a", fontSize: "1.1rem" }}>{pkg.name}</h4>
                      <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: 4 }}>{pkg.credits} Credits</div>
                    </div>
                    <div style={{ fontWeight: "bold", fontSize: "1.25rem", color: "#16a34a" }}>
                      {formatCurrency(pkg.price)}
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePurchase(pkg)} 
                    disabled={purchasing}
                    style={{ width: "100%", padding: "0.75rem", background: "#3b82f6", color: "white", borderRadius: 8, border: "none", fontWeight: "600", cursor: purchasing ? "not-allowed" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
                  >
                    <PlusCircle size={18} />
                    {purchasing ? "Processing..." : "Buy Now"}
                  </button>
                </div>
              ))}
              {packages.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem", color: "#64748b", background: "#f8fafc", borderRadius: 8 }}>
                  No packages available at the moment.
                </div>
              )}
            </div>
          </div>
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
