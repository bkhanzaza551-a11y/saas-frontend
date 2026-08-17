import React, { useState, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Smartphone,
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  Send,
  TrendingUp,
  Calculator
} from "lucide-react";
import { api } from "../../api/client";
import { formatCurrency } from "../../utils/currency.js";
import PageLoader from "../../components/PageLoader.jsx";

export default function WhatsAppCreditsPage() {
  const [whatsappCredits, setWhatsappCredits] = useState(0);
  const [smsCredits, setSmsCredits] = useState(0);
  const [costs, setCosts] = useState({ whatsapp: 1, sms: 1 });
  const [whatsappPackages, setWhatsappPackages] = useState([]);
  const [smsPackages, setSmsPackages] = useState([]);
  const [whatsappTransactions, setWhatsappTransactions] = useState([]);
  const [smsTransactions, setSmsTransactions] = useState([]);
  const [customApiEnabled, setCustomApiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeChannel, setActiveChannel] = useState("WHATSAPP");
  const [activeTab, setActiveTab] = useState("ALL");
  const [copiedId, setCopiedId] = useState(null);
  const [smsUsage, setSmsUsage] = useState({ logs: [], stats: { totalCreditsUsed: 0, totalSent: 0, totalFailed: 0, total: 0 } });

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [balRes, wpkgRes, spkgRes, wtxnRes, stxnRes, smsRes] = await Promise.all([
        api.get("/owner/credits/balance"),
        api.get("/owner/credits/packages?type=WHATSAPP"),
        api.get("/owner/credits/packages?type=SMS"),
        api.get("/owner/credits/transactions?type=WHATSAPP"),
        api.get("/owner/credits/transactions?type=SMS"),
        api.get("/owner/credits/sms-usage").catch(() => ({ data: { logs: [], stats: { totalCreditsUsed: 0, totalSent: 0, totalFailed: 0, total: 0 } } }))
      ]);
      setWhatsappCredits(balRes.data.whatsappCredits || 0);
      setSmsCredits(balRes.data.smsCredits || 0);
      setCustomApiEnabled(balRes.data.customWhatsappEnabled || false);
      if (balRes.data.costs) {
        setCosts(balRes.data.costs);
      }
      setWhatsappPackages(wpkgRes.data || []);
      setSmsPackages(spkgRes.data || []);
      setWhatsappTransactions(wtxnRes.data || []);
      setSmsTransactions(stxnRes.data || []);
      setSmsUsage(smsRes.data || { logs: [], stats: { totalCreditsUsed: 0, totalSent: 0, totalFailed: 0, total: 0 } });
    } catch (err) {
      setError("Could not load credit information right now. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePurchase = async (pkg) => {
    try {
      setPurchasingId(pkg.id);
      setError("");
      setSuccessMsg("");
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        alert("Payment gateway failed to load. Please check your internet connection.");
        setPurchasingId(null);
        return;
      }

      const orderRes = await api.post("/owner/credits/create-order", { packageId: pkg.id });
      const { orderId, amount, currency, key: razorpayKey } = orderRes.data;

      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency,
        name: "SalonNest Communication Credits",
        description: `Top-up: ${pkg.name} (${pkg.credits.toLocaleString()} Credits)`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await api.post("/owner/credits/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              packageId: pkg.id
            });
            setSuccessMsg(`🎉 Success! ${pkg.credits.toLocaleString()} Credits have been added to your balance.`);
            fetchData();
          } catch (err) {
            setError("Payment verification failed. If money was deducted, please contact support.");
          }
        },
        prefill: {
          name: "Salon Owner",
          email: "owner@salon.com"
        },
        theme: { color: "#2563eb" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setError("Payment Failed: " + (response.error?.description || "Transaction was cancelled."));
      });
      rzp.open();
    } catch (err) {
      setError("Could not initiate purchase. " + (err.response?.data?.message || err.message));
    } finally {
      setPurchasingId(null);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentPackages = activeChannel === "WHATSAPP" ? whatsappPackages : smsPackages;
  const currentTransactions = activeChannel === "WHATSAPP" ? whatsappTransactions : smsTransactions;
  const currentCredits = activeChannel === "WHATSAPP" ? whatsappCredits : smsCredits;
  const currentCost = activeChannel === "WHATSAPP" ? costs.whatsapp : costs.sms;

  const filteredPackages = useMemo(() => {
    if (activeTab === "STARTER") return currentPackages.filter(p => p.credits <= 1000);
    if (activeTab === "GROWTH") return currentPackages.filter(p => p.credits > 1000 && p.credits <= 5000);
    if (activeTab === "ENTERPRISE") return currentPackages.filter(p => p.credits > 5000);
    return currentPackages;
  }, [currentPackages, activeTab]);

  if (loading) return <PageLoader title="Loading Communication Credits" message="Fetching your live messaging balance and packages..." />;

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1280, margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
              Communication Credits
            </h1>
            <span style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              <Zap size={13} /> Dual Wallet
            </span>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
            Top-up your balance to send automated <strong>WhatsApp notifications, SMS receipts, booking alerts, and marketing campaigns</strong>.
          </p>
        </div>

        <button
          onClick={fetchData}
          style={{
            padding: "9px 16px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            color: "#475569",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#cbd5e1"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
        >
          <RefreshCw size={14} /> Refresh Balance
        </button>
      </div>

      {error && (
        <div style={{ padding: "14px 18px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 24, fontSize: 14, fontWeight: 500 }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: "14px 18px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 10, marginBottom: 24, fontSize: 14, fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {customApiEnabled && (
        <div style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", border: "1px solid #a7f3d0", borderRadius: 14, padding: "20px 24px", marginBottom: 28, display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ background: "#10b981", color: "#fff", borderRadius: 10, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <h3 style={{ margin: "0 0 6px 0", color: "#065f46", fontSize: 16, fontWeight: 800 }}>Custom WhatsApp API Connected</h3>
            <p style={{ margin: 0, color: "#047857", fontSize: 13.5, lineHeight: 1.5 }}>
              Your salon is linked directly to your dedicated <strong>Meta WhatsApp Cloud API</strong>. Outbound WhatsApp messages will bypass platform credit deductions. You can still use platform credits for high-speed SMS delivery!
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 28 }}>

        <div style={{ background: "linear-gradient(135deg, #166534 0%, #14532d 100%)", borderRadius: 16, padding: "26px 28px", color: "#fff", boxShadow: "0 10px 25px -5px rgba(22, 101, 52, 0.3)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: "rgba(74, 222, 128, 0.12)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: -30, right: 20, width: 70, height: 70, background: "rgba(74, 222, 128, 0.08)", borderRadius: "50%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#bbf7d0", textTransform: "uppercase", letterSpacing: "0.08em" }}>WhatsApp Credits</span>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={20} color="#4ade80" />
            </div>
          </div>
          <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 10, letterSpacing: "-1.5px" }}>
            {whatsappCredits.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={13} /> {costs.whatsapp || 1} credit per message
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)", borderRadius: 16, padding: "26px 28px", color: "#fff", boxShadow: "0 10px 25px -5px rgba(30, 64, 175, 0.3)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: "rgba(96, 165, 250, 0.12)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: -30, right: 20, width: 70, height: 70, background: "rgba(96, 165, 250, 0.08)", borderRadius: "50%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#bfdbfe", textTransform: "uppercase", letterSpacing: "0.08em" }}>SMS Credits</span>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Smartphone size={20} color="#60a5fa" />
            </div>
          </div>
          <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 10, letterSpacing: "-1.5px" }}>
            {smsCredits.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: "#60a5fa", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={13} /> {costs.sms || 1} credit per SMS
          </div>
        </div>

      </div>

      <div style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", borderRadius: 16, padding: "22px 28px", marginBottom: 32, border: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", gap: 18 }}>
        <div style={{ background: "#fff", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <Calculator size={20} color="#2563eb" />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={16} color="#2563eb" /> Usage Estimate
          </h4>
          <p style={{ margin: "0 0 14px 0", fontSize: 13.5, color: "#475569", lineHeight: 1.5 }}>
            With your current balances you can send approximately:
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", padding: "10px 16px", borderRadius: 10, border: "1px solid #e2e8f0", flex: "1 1 200px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MessageSquare size={18} color="#16a34a" />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                  {Math.floor(whatsappCredits / (costs.whatsapp || 1)).toLocaleString()}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 500 }}>WhatsApp messages</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", padding: "10px 16px", borderRadius: 10, border: "1px solid #e2e8f0", flex: "1 1 200px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Smartphone size={18} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                  {Math.floor(smsCredits / (costs.sms || 1)).toLocaleString()}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 500 }}>SMS messages</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", background: "#f1f5f9", padding: 5, borderRadius: 14, gap: 5, marginBottom: 28, border: "1px solid #e2e8f0" }}>
        <button
          onClick={() => { setActiveChannel("WHATSAPP"); setActiveTab("ALL"); }}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            fontSize: 14,
            fontWeight: activeChannel === "WHATSAPP" ? 800 : 600,
            background: activeChannel === "WHATSAPP" ? "#fff" : "transparent",
            color: activeChannel === "WHATSAPP" ? "#166534" : "#64748b",
            boxShadow: activeChannel === "WHATSAPP" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}
        >
          <MessageSquare size={18} /> WhatsApp Credits
          <span style={{ fontSize: 12, fontWeight: 700, color: activeChannel === "WHATSAPP" ? "#16a34a" : "#94a3b8", background: activeChannel === "WHATSAPP" ? "#f0fdf4" : "transparent", padding: "2px 8px", borderRadius: 6 }}>
            {whatsappCredits.toLocaleString()}
          </span>
        </button>
        <button
          onClick={() => { setActiveChannel("SMS"); setActiveTab("ALL"); }}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            fontSize: 14,
            fontWeight: activeChannel === "SMS" ? 800 : 600,
            background: activeChannel === "SMS" ? "#fff" : "transparent",
            color: activeChannel === "SMS" ? "#1e40af" : "#64748b",
            boxShadow: activeChannel === "SMS" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}
        >
          <Smartphone size={18} /> SMS Credits
          <span style={{ fontSize: 12, fontWeight: 700, color: activeChannel === "SMS" ? "#2563eb" : "#94a3b8", background: activeChannel === "SMS" ? "#eff6ff" : "transparent", padding: "2px 8px", borderRadius: 6 }}>
            {smsCredits.toLocaleString()}
          </span>
        </button>
      </div>

      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
              {activeChannel === "WHATSAPP" ? "WhatsApp" : "SMS"} Top-Up Packages
            </h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13.5 }}>
              Choose a package to instantly recharge your {activeChannel === "WHATSAPP" ? "WhatsApp" : "SMS"} wallet with Razorpay.
            </p>
          </div>

          <div style={{ display: "flex", background: "#f1f5f9", padding: 4, borderRadius: 10, gap: 4 }}>
            {[
              { id: "ALL", label: "All Packages" },
              { id: "STARTER", label: "Starter" },
              { id: "GROWTH", label: "Growth" },
              { id: "ENTERPRISE", label: "Volume" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  background: activeTab === tab.id ? "#fff" : "transparent",
                  color: activeTab === tab.id ? "#0f172a" : "#64748b",
                  boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {filteredPackages.map((pkg) => {
            const isPopular = pkg.credits === 2000 || pkg.name.toLowerCase().includes("growth");
            const isPurchasing = purchasingId === pkg.id;
            const channelColor = activeChannel === "WHATSAPP" ? "#16a34a" : "#2563eb";

            return (
              <div
                key={pkg.id}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  border: isPopular ? `2px solid ${channelColor}` : "1px solid #e2e8f0",
                  padding: "24px 22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  boxShadow: isPopular ? `0 12px 30px -5px ${activeChannel === "WHATSAPP" ? "rgba(22, 163, 74, 0.15)" : "rgba(37, 99, 235, 0.15)"}` : "0 2px 8px rgba(0,0,0,0.02)",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
              >
                {isPopular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: channelColor, color: "#fff", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 4 }}>
                    <Sparkles size={11} /> Most Popular
                  </div>
                )}

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: 17, fontWeight: 800, color: "#0f172a" }}>{pkg.name}</h3>
                      <p style={{ margin: 0, fontSize: 12.5, color: "#64748b", lineHeight: 1.4 }}>{pkg.description || `${activeChannel === "WHATSAPP" ? "WhatsApp" : "SMS"} messaging bundle`}</p>
                    </div>
                  </div>

                  <div style={{ margin: "16px 0 20px 0", padding: "14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: 26, fontWeight: 900, color: "#0f172a" }}>{formatCurrency(pkg.price)}</span>
                      <span style={{ fontSize: 12, color: "#64748b", marginLeft: 4 }}>one-time</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: channelColor, background: activeChannel === "WHATSAPP" ? "#f0fdf4" : "#eff6ff", padding: "4px 8px", borderRadius: 6 }}>
                      {pkg.credits.toLocaleString()} Credits
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#334155" }}>
                      <CheckCircle2 size={15} color={channelColor} /> Instant POS Invoice Sharing
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#334155" }}>
                      <CheckCircle2 size={15} color={channelColor} /> Automated Appointment Alerts & Reminders
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#334155" }}>
                      <CheckCircle2 size={15} color={channelColor} /> Marketing Campaigns & Customer Offers
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#334155" }}>
                      <CheckCircle2 size={15} color={channelColor} /> Zero Expiry Date & Priority Queue
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={isPurchasing}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: isPopular ? channelColor : "#0f172a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: isPurchasing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.2s",
                    boxShadow: isPopular ? `0 4px 14px ${activeChannel === "WHATSAPP" ? "rgba(22, 163, 74, 0.3)" : "rgba(37, 99, 235, 0.3)"}` : "none"
                  }}
                  onMouseEnter={e => {
                    if (!isPurchasing) e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={e => {
                    if (!isPurchasing) e.currentTarget.style.opacity = "1";
                  }}
                >
                  {isPurchasing ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Opening Checkout...
                    </>
                  ) : (
                    <>
                      Buy {pkg.credits.toLocaleString()} Credits <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            );
          })}

          {filteredPackages.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "#94a3b8", background: "#f8fafc", borderRadius: 16, border: "1px dashed #e2e8f0" }}>
              <HelpCircle size={28} style={{ display: "block", margin: "0 auto 8px", opacity: 0.5 }} />
              No packages available for this filter.
            </div>
          )}
        </div>
      </div>

      {activeChannel === "SMS" && smsUsage.stats.total > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>SMS Usage</h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: 13.5 }}>Your recent SMS sending activity</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1px solid #bbf7d0" }}>{smsUsage.stats.totalSent} Sent</span>
              <span style={{ background: "#fef2f2", color: "#dc2626", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1px solid #fecaca" }}>{smsUsage.stats.totalFailed} Failed</span>
              <span style={{ background: "#eff6ff", color: "#2563eb", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1px solid #bfdbfe" }}>{smsUsage.stats.totalCreditsUsed} Credits Used</span>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 20px" }}>Date</th>
                  <th style={{ padding: "12px 20px" }}>Phone</th>
                  <th style={{ padding: "12px 20px" }}>Provider</th>
                  <th style={{ padding: "12px 20px" }}>Credits</th>
                  <th style={{ padding: "12px 20px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {smsUsage.logs.slice(0, 20).map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 20px", color: "#475569" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{new Date(log.createdAt).toLocaleDateString([], { dateStyle: "medium" })}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(log.createdAt).toLocaleTimeString([], { timeStyle: "short" })}</div>
                    </td>
                    <td style={{ padding: "12px 20px", fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>{log.phone}</td>
                    <td style={{ padding: "12px 20px", color: "#64748b", textTransform: "capitalize" }}>{log.provider || "-"}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ fontWeight: 800, color: log.creditsUsed > 0 ? "#2563eb" : "#64748b", background: log.creditsUsed > 0 ? "#eff6ff" : "#f8fafc", padding: "4px 10px", borderRadius: 6, fontSize: 12, border: `1px solid ${log.creditsUsed > 0 ? "#bfdbfe" : "#e2e8f0"}` }}>
                        {log.creditsUsed || 0}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: log.status === "SENT" ? "#ecfdf5" : "#fef2f2", color: log.status === "SENT" ? "#059669" : "#dc2626" }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
              {activeChannel === "WHATSAPP" ? "WhatsApp" : "SMS"} Recharge History
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: "#64748b", marginTop: 2 }}>Recent {activeChannel === "WHATSAPP" ? "WhatsApp" : "SMS"} credit purchase transactions</p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", background: "#e2e8f0", padding: "4px 10px", borderRadius: 20 }}>
            {currentTransactions.length} Records
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "14px 20px" }}>Date & Time</th>
                <th style={{ padding: "14px 20px" }}>Package</th>
                <th style={{ padding: "14px 20px" }}>Credits</th>
                <th style={{ padding: "14px 20px" }}>Amount Paid</th>
                <th style={{ padding: "14px 20px" }}>Status</th>
                <th style={{ padding: "14px 20px" }}>Payment Ref</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((tx, idx) => (
                <tr key={tx.id} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ padding: "14px 20px", color: "#475569" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{new Date(tx.createdAt).toLocaleDateString([], { dateStyle: "medium" })}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(tx.createdAt).toLocaleTimeString([], { timeStyle: "short" })}</div>
                  </td>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#0f172a" }}>
                    {tx.packageName}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontWeight: 800, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: 6, fontSize: 12 }}>
                      +{tx.credits.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", fontWeight: 700, color: "#0f172a" }}>
                    {formatCurrency(tx.amountPaidPaise / 100)}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: tx.status === "COMPLETED" ? "#ecfdf5" : tx.status === "PENDING" ? "#fef3c7" : "#fef2f2",
                        color: tx.status === "COMPLETED" ? "#059669" : tx.status === "PENDING" ? "#d97706" : "#dc2626"
                      }}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    {tx.razorpayPaymentId ? (
                      <button
                        onClick={() => copyToClipboard(tx.razorpayPaymentId, tx.id)}
                        style={{
                          background: "none",
                          border: "1px dashed #cbd5e1",
                          borderRadius: 6,
                          padding: "3px 8px",
                          fontSize: 11,
                          color: "#475569",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        {tx.razorpayPaymentId.slice(0, 14)}...
                        {copiedId === tx.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                      </button>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>-</span>
                    )}
                  </td>
                </tr>
              ))}

              {currentTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                    <Clock size={28} style={{ display: "block", margin: "0 auto 8px", opacity: 0.5 }} />
                    No {activeChannel === "WHATSAPP" ? "WhatsApp" : "SMS"} credit history found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
