import React, { useState, useEffect } from "react";
import { Download, Printer, X } from "lucide-react";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../context/AuthContext";
import { readSalonSettingsCache } from "../utils/salonSettings";
import { api } from "../api/client";

const Divider = ({ dashed = false, style = {} }) => (
  <div aria-hidden="true" style={{ borderTop: `1px ${dashed ? "dashed" : "solid"} #cbd5e1`, margin: "14px 0", ...style }} />
);

const Tag = ({ color = "default", children, style = {} }) => {
  const palette = {
    success: { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" },
    error: { background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" },
    warning: { background: "#fffbeb", color: "#d97706", border: "1px solid #fcd34d" },
    default: { background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }
  };
  const tone = palette[color] || palette.default;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: 1.6, ...tone, ...style }}>
      {children}
    </span>
  );
};

const statusColor = (s) => ({ PAID: "success", UNPAID: "error", PARTIAL: "warning", CANCELLED: "default" }[s?.toUpperCase()] ?? "default");

const FORMATS = [
  { key: "a4", label: "A4 Invoice", width: 800, pageWidth: "210mm", pageHeight: "297mm" },
  { key: "a5", label: "A5 Receipt", width: 500, pageWidth: "148mm", pageHeight: "210mm" },
  { key: "t80", label: "Thermal 80mm", width: 300, pageWidth: "80mm", pageHeight: "auto" },
  { key: "t58", label: "Thermal 58mm", width: 220, pageWidth: "58mm", pageHeight: "auto" },
];

const ZigzagBottom = () => (
  <svg viewBox="0 0 400 16" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 16 }}>
    <polygon points="0,0 19,16 38,0 57,16 76,0 95,16 114,0 133,16 152,0 171,16 190,0 209,16 228,0 247,16 266,0 285,16 304,0 323,16 342,0 361,16 380,0 380,16 0,16" fill="#fff" />
    <polyline points="0,0 19,16 38,0 57,16 76,0 95,16 114,0 133,16 152,0 171,16 190,0 209,16 228,0 247,16 266,0 285,16 304,0 323,16 342,0 361,16 380,0" fill="none" stroke="#e2e8f0" strokeWidth="1" />
  </svg>
);

const FakeBarcode = ({ width = "75%" }) => {
  const strips = Array.from({ length: 48 }, (_, i) => ({ w: [1, 2, 3, 1, 2, 1, 3, 2, 1, 2][i % 10], h: 24 + (i % 4) * 4 }));
  return (
    <div style={{ margin: "14px auto 0", width, height: 36, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 1.5 }}>
      {strips.map((s, i) => <div key={i} style={{ width: s.w, height: s.h, background: "#0f172a", borderRadius: 0.5, opacity: 0.75 + (i % 3) * 0.08 }} />)}
    </div>
  );
};

export default function PosReceipt({ invoice, salonName, salonAddress, salonPhone, currencyCode = "INR", onClose, onPrint, onDownload, inline = false }) {
  const { auth } = useAuth();
  const salonId = auth?.salonId || auth?.membership?.salonId || auth?.membership?.salon?.id || "global";
  const [liveSettingsName, setLiveSettingsName] = useState(null);
  const [format, setFormat] = useState(() => localStorage.getItem("receiptFormat") || "a4");

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const response = await api.get("/owner/settings");
        if (active && response.data?.advancedSettings?.genericSettings?.salonName) {
          setLiveSettingsName(response.data.advancedSettings.genericSettings.salonName);
        }
      } catch (err) { /* ignore */ }
    };
    fetchSettings();
    return () => { active = false; };
  }, []);

  const isThermal = format === "t80" || format === "t58";
  const fmt = FORMATS.find(f => f.key === format) || FORMATS[0];

  const handleLocalPrint = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const printContent = document.getElementById('receipt-print-area').innerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const thermalCSS = isThermal ? `
      @page { margin: 2mm; size: ${fmt.pageWidth} auto; }
      body { font-size: 11px !important; }
      .invoice-paper { width: ${fmt.pageWidth} !important; max-width: ${fmt.pageWidth} !important; padding: 4px 6px !important; font-size: 11px !important; }
      .invoice-paper * { font-size: inherit !important; }
    ` : `
      @page { margin: 10mm; size: ${fmt.pageWidth} ${fmt.pageHeight}; }
      .invoice-paper { width: 100% !important; max-width: ${fmt.width}px !important; }
    `;

    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { background: white !important; display: flex !important; justify-content: center !important; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; }
            .no-print { display: none !important; }
            ${thermalCSS}
          </style>
        </head>
        <body>
          <div class="invoice-paper">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    iframe.contentWindow.document.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  };

  const handleFormatChange = (newFormat) => {
    setFormat(newFormat);
    localStorage.setItem("receiptFormat", newFormat);
  };

  const cachedSettings = readSalonSettingsCache(salonId);
  const customSalonName = cachedSettings?.advancedSettings?.genericSettings?.salonName;

  const safeInv = invoice || {};
  const items = safeInv.items || [];
  const customer = safeInv.customer || {};
  const displaySalonName = liveSettingsName || customSalonName || salonName || auth?.membership?.salon?.name || auth?.membership?.salonName || safeInv?.salon?.name || safeInv?.branch?.name || "My Salon";
  const displayAddress = salonAddress || "";
  const displayPhone = salonPhone || "";
  const invDate = safeInv.createdAt ? new Date(safeInv.createdAt) : new Date();
  const dateStr = invDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
  const timeStr = invDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const statusUp = (safeInv.status || "UNPAID").toUpperCase();
  const subtotal = Number(safeInv.subtotal || safeInv.total || 0);
  const discount = Number(safeInv.discount || 0);
  const tax = Number(safeInv.tax || 0);
  const grandTotal = Number(safeInv.total || subtotal);
  const paid = Number(safeInv.paidAmount || 0);
  const balance = Number(safeInv.balanceAmount || Math.max(0, grandTotal - paid));
  const money = (value) => formatCurrency(value || 0, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const wrapStyle = {
    position: "relative", width: fmt.width, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto",
    background: "#fff", borderRadius: isThermal ? 8 : 16,
    boxShadow: "0 25px 60px -12px rgba(0,0,0,0.35)",
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", paddingBottom: 0
  };

  return (
    <div style={inline ? { display: "flex", justifyContent: "center", width: "100%", padding: "20px 0" } : { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: 20 }} className={inline ? "" : "pos-receipt-overlay"} onClick={inline ? undefined : onClose}>
      <div style={{ ...wrapStyle, ...(inline ? { maxHeight: "none", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0" } : {}) }} className="invoice-paper" onClick={inline ? undefined : (e) => e.stopPropagation()}>
        {/* Action Bar */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, padding: isThermal ? "8px 8px" : "12px 16px", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid #f1f5f9", borderRadius: isThermal ? "8px 8px 0 0" : "16px 16px 0 0" }} className="no-print">
          {/* Format Selector */}
          <select value={format} onChange={(e) => handleFormatChange(e.target.value)} style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11, fontWeight: 600, color: "#475569", background: "#f8fafc", cursor: "pointer", marginRight: "auto" }}>
            {FORMATS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          {onPrint && <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", cursor: "pointer" }} title="Print" onClick={handleLocalPrint}><Printer size={14} /></div>}
          {onDownload && <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", cursor: "pointer" }} title="Download" onClick={onDownload}><Download size={14} /></div>}
          {onClose && !inline && <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#ef4444", cursor: "pointer" }} title="Close" onClick={onClose}><X size={14} /></div>}
        </div>

        {/* Receipt Body */}
        <div style={{ padding: isThermal ? "8px 10px" : "0 24px 24px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", padding: isThermal ? "8px 0 2px" : "20px 0 4px" }}>
            <div style={{ fontSize: isThermal ? 14 : 26, fontWeight: 900, letterSpacing: isThermal ? 1 : 3, color: "#0f172a", margin: 0, lineHeight: 1, fontFamily: "'Inter', system-ui, sans-serif" }}>{displaySalonName.toUpperCase()}</div>
            {!isThermal && <div style={{ fontSize: 9, letterSpacing: 3.5, color: "#94a3b8", marginTop: 4, textTransform: "uppercase", fontWeight: 600 }}>Hair - Lifestyle - Care</div>}
            {displayAddress && <div style={{ fontSize: isThermal ? 9 : 11, color: "#64748b", textAlign: "center", marginTop: 6, lineHeight: 1.6 }}>{displayAddress}{displayPhone && <><br />{displayPhone}</>}</div>}
          </div>

          <Divider dashed={true} style={{ margin: isThermal ? "6px 0" : "14px 0" }} />

          {/* Meta Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: isThermal ? "3px 8px" : "6px 12px", fontSize: isThermal ? 10 : 12 }}>
            <span style={{ color: "#94a3b8", fontSize: isThermal ? 9 : 11, fontWeight: 500 }}>Invoice No</span>
            <span style={{ color: "#0f172a", fontWeight: 600, textAlign: "right", fontSize: isThermal ? 10 : 12, fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>{safeInv.invoiceNumber || "—"}</span>
            <span style={{ color: "#94a3b8", fontSize: isThermal ? 9 : 11, fontWeight: 500 }}>Date</span>
            <span style={{ color: "#0f172a", fontWeight: 600, textAlign: "right", fontSize: isThermal ? 10 : 12, fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>{dateStr}</span>
            {!isThermal && <>
              <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 500 }}>Time</span>
              <span style={{ color: "#0f172a", fontWeight: 600, textAlign: "right", fontSize: 12, fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>{timeStr}</span>
            </>}
            <span style={{ color: "#94a3b8", fontSize: isThermal ? 9 : 11, fontWeight: 500 }}>Status</span>
            <span style={{ textAlign: "right" }}><Tag color={statusColor(statusUp)}>{statusUp}</Tag></span>
          </div>

          <Divider dashed={true} style={{ margin: isThermal ? "6px 0" : "14px 0" }} />

          {/* Customer */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: isThermal ? 8 : 9, color: "#94a3b8", letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700 }}>Bill To</div>
            <div style={{ fontWeight: 700, fontSize: isThermal ? 11 : 14, color: "#0f172a", marginTop: 2 }}>{customer.name || safeInv.customerName || "Walk-in Customer"}</div>
            {(customer.phone || safeInv.customerPhone) && <div style={{ fontSize: isThermal ? 9 : 11, color: "#64748b", marginTop: 1, fontFamily: "'JetBrains Mono', monospace" }}>{customer.phone || safeInv.customerPhone}</div>}
          </div>

          <Divider dashed={true} style={{ margin: isThermal ? "6px 0" : "14px 0" }} />

          {/* Items */}
          <div>
            {items.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", fontSize: isThermal ? 9 : 12, padding: isThermal ? "6px 0" : "14px 0" }}>No items</div>}
            {items.map((item, idx) => {
              const rate = Number(item.unitPrice || 0);
              const qty = Number(item.qty || 1);
              const amt = Number(item.lineTotal || rate * qty);
              const itemName = (item.serviceName || item.productName || item.name || "Item").replace(/\[Package:\s*(.*?)\]/i, "Package: $1 |");
              return (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: isThermal ? "4px 0" : "10px 0", borderBottom: "1px dashed #e2e8f0" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: isThermal ? 10 : 13 }}>{isThermal ? itemName.substring(0, 22) : itemName}</div>
                    <div style={{ fontSize: isThermal ? 8 : 11, color: "#94a3b8", marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>{qty} x {money(rate)}</div>
                    {!isThermal && item.staffName && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Staff: {item.staffName}</div>}
                  </div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: isThermal ? 10 : 13, textAlign: "right", minWidth: isThermal ? 50 : 70, fontFamily: "'JetBrains Mono', monospace" }}>{money(amt)}</div>
                </div>
              );
            })}
          </div>

          <Divider dashed={true} style={{ margin: isThermal ? "6px 0" : "14px 0" }} />

          {/* Totals */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: "#64748b", fontSize: isThermal ? 9 : 12 }}>Subtotal</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: isThermal ? 9 : 12 }}>{money(subtotal)}</span></div>
            {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: "#22c55e", fontSize: isThermal ? 8 : 11 }}>Discount</span><span style={{ color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", fontSize: isThermal ? 8 : 11 }}>- {money(discount)}</span></div>}
            {tax > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: "#f59e0b", fontSize: isThermal ? 8 : 11 }}>Tax</span><span style={{ color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace", fontSize: isThermal ? 8 : 11 }}>+ {money(tax)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isThermal ? "6px 0 2px" : "12px 0 4px", borderTop: "2px solid #0f172a", marginTop: 8 }}>
              <span style={{ fontWeight: 800, fontSize: isThermal ? 10 : 13, color: "#0f172a", letterSpacing: 0.5 }}>Grand Total</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: isThermal ? 12 : 18, color: "#0f172a" }}>{money(grandTotal)}</span>
            </div>
            {paid > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", marginTop: 4, borderTop: "1px dashed #e2e8f0" }}><span style={{ color: "#22c55e", fontSize: isThermal ? 9 : 12, fontWeight: 600 }}>Paid</span><span style={{ color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", fontSize: isThermal ? 9 : 12, fontWeight: 700 }}>{money(paid)}</span></div>}
            {balance > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: "#ef4444", fontSize: isThermal ? 8 : 11 }}>Balance Due</span><span style={{ color: "#ef4444", fontFamily: "'JetBrains Mono', monospace", fontSize: isThermal ? 8 : 11 }}>{money(balance)}</span></div>}
            {safeInv.payments?.length > 0 && (
              <>
                <Divider dashed style={{ margin: isThermal ? "4px 0" : "10px 0 6px" }} />
                {safeInv.payments.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                    <span style={{ color: "#94a3b8", fontSize: isThermal ? 8 : 10, textTransform: "uppercase", fontWeight: 600 }}>{p.mode}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: isThermal ? 8 : 11, color: "#64748b" }}>{money(p.amount)}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          <Divider dashed style={{ margin: isThermal ? "8px 0 0" : "16px 0 0" }} />

          {/* Footer */}
          <div style={{ textAlign: "center", padding: isThermal ? "8px 0" : "16px 0 20px" }}>
            <div style={{ fontSize: isThermal ? 10 : 15, fontWeight: 800, color: "#0f172a", letterSpacing: 1.5, marginBottom: 4 }}>Thank You!</div>
            <div style={{ fontSize: isThermal ? 8 : 10, color: "#94a3b8", letterSpacing: 2, fontWeight: 600 }}>Visit Again</div>
            {!isThermal && <FakeBarcode />}
            <div style={{ fontSize: isThermal ? 7 : 9, color: "#cbd5e1", marginTop: isThermal ? 6 : 16, letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>{safeInv.invoiceNumber || "—"}</div>
          </div>
        </div>

        {!isThermal && <ZigzagBottom />}
      </div>
    </div>
  );
}
