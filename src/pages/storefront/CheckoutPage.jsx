import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { formatDuration, formatPrice } from "./storefrontUtils";

export default function CheckoutPage() {
  const { salon, bookings, clearBookings } = useOutletContext();
  const navigate = useNavigate();
  const currency = salon.currency || "INR";
  const razorpayLoaded = useRef(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  const savedForm = (() => { try { return JSON.parse(sessionStorage.getItem("sf_checkout_form") || "null"); } catch { return null; } })();
  const [form, setForm] = useState(savedForm || {
    firstName: "", lastName: "", email: "", phone: "",
    note: "", paymentMode: "PAY_AT_SALON",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => {
    const next = { ...form, [field]: e.target.value };
    setForm(next);
    try { sessionStorage.setItem("sf_checkout_form", JSON.stringify(next)); } catch {}
  };

  const total = bookings.reduce((sum, b) => sum + Number(b.price) * b.qty, 0);

  useEffect(() => {
    if (form.paymentMode === "ONLINE" && !razorpayLoaded.current) {
      setRazorpayLoading(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => { razorpayLoaded.current = true; setRazorpayLoading(false); };
      s.onerror = () => setRazorpayLoading(false);
      document.body.appendChild(s);
    }
  }, [form.paymentMode]);

  if (bookings.length === 0) {
    return (
      <div style={{ background: 'var(--sf-bg, #fdfdfd)', minHeight: '100vh', padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--sf-font-serif)', fontSize: '2.5rem', margin: '0 0 24px' }}>Booking Checkout</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>You have no services in your booking summary.</p>
        <Link to={`/site/${salon.slug}/services`} className="sf-btn sf-btn-primary" style={{ padding: '14px 32px' }}>Browse Services</Link>
      </div>
    );
  }

  const loadRazorpay = () => new Promise((resolve) => {
    if (razorpayLoaded.current) { resolve(true); return; }
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) { razorpayLoaded.current = true; resolve(true); return; }
    setRazorpayLoading(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => { razorpayLoaded.current = true; setRazorpayLoading(false); resolve(true); };
    s.onerror = () => { setRazorpayLoading(false); resolve(false); };
    document.body.appendChild(s);
  });

  const submitBookings = async (paymentDetails = null) => {
    setSubmitting(true);
    setError("");
    try {
      const customerName = `${form.firstName} ${form.lastName}`.trim();
      const payloads = [];

      for (const booking of bookings) {
        for (let i = 0; i < booking.qty; i++) {
          payloads.push({
            serviceId: booking.serviceId,
            customerName,
            customerPhone: form.phone,
            customerEmail: form.email || undefined,
            preferredDate: booking.date,
            preferredTime: booking.time,
            staffId: booking.staffId || null,
            note: form.note || undefined,
            paymentMode: form.paymentMode,
          });
        }
      }

      const results = await Promise.all(
        payloads.map(payload => api.post(`/public/salon/${salon.slug}/service-bookings`, payload))
      );
      const data = results.map(r => r.data);

      if (paymentDetails) {
        try {
          await api.post(`/public/salon/${salon.slug}/verify-razorpay-payment`, {
            razorpayOrderId: paymentDetails.razorpay_order_id,
            razorpayPaymentId: paymentDetails.razorpay_payment_id,
            razorpaySignature: paymentDetails.razorpay_signature
          });
        } catch (e) {
          setError("Payment verification failed. Please contact the salon with your booking reference.");
          setSubmitting(false);
          return;
        }
      }

      clearBookings();
      try {
        sessionStorage.removeItem("sf_checkout_form");
        sessionStorage.setItem("sf_last_phone", form.phone);
      } catch {}
      const orderNumber = data[0]?.order?.orderNumber || data[0]?.orderNumber || `BK-${Date.now()}`;
      navigate(`/site/${salon.slug}/booking-confirmation?orderNumber=${orderNumber}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place booking. Please try again.");
      setSubmitting(false);
    }
  };

  const handlePlaceBooking = async () => {
    if (!form.firstName || !form.phone) {
      setError("Please fill in your name and phone number.");
      return;
    }

    if (form.paymentMode === "ONLINE") {
      const loaded = await loadRazorpay();
      if (!loaded) { setError("Failed to load payment gateway. Please try again."); return; }

      try {
        const orderRes = await api.post(`/public/salon/${salon.slug}/razorpay-order`, {
          amount: total,
          currency: currency,
          receipt: `booking_${Date.now()}`
        });

        const rzp = new window.Razorpay({
          key: orderRes.data.keyId,
          amount: orderRes.data.amount,
          currency: orderRes.data.currency,
          name: salon.name,
          description: `Booking - ${salon.name}`,
          order_id: orderRes.data.orderId,
          handler: function (response) { submitBookings(response); },
          prefill: { name: `${form.firstName} ${form.lastName}`, email: form.email, contact: form.phone },
          theme: { color: "#c8a97e" },
          modal: { ondismiss: () => { setSubmitting(false); setError("Payment was cancelled."); } }
        });
        rzp.open();
        setSubmitting(false);
      } catch (err) {
        setError(err.response?.data?.message || "Payment failed. Please try again.");
        setSubmitting(false);
      }
    } else {
      await submitBookings();
    }
  };

  return (
    <div style={{ background: 'var(--sf-bg, #fdfdfd)', minHeight: '100vh', padding: '80px 20px' }}>
      <div className="sf-checkout-grid" style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr min(400px, 100%)', gap: 60 }}>

        <div>
          <Link to={`/site/${salon.slug}/booking-summary`} style={{ color: '#666', textDecoration: 'none', marginBottom: 32, display: 'inline-block' }}>&larr; Back to Booking Summary</Link>
          <h1 style={{ fontFamily: 'var(--sf-font-serif)', fontSize: '2.5rem', margin: '0 0 32px' }}>Booking Checkout</h1>

          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid #fecaca' }}>{error}</div>}

          <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 16 }}>Contact Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
                <div>
                  <label htmlFor="co-firstname" style={{ display: 'block', fontSize: '0.78rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>First Name *</label>
                  <input id="co-firstname" type="text" placeholder="First Name" value={form.firstName} onChange={set('firstName')} required style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label htmlFor="co-lastname" style={{ display: 'block', fontSize: '0.78rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>Last Name</label>
                  <input id="co-lastname" type="text" placeholder="Last Name" value={form.lastName} onChange={set('lastName')} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                  <label htmlFor="co-email" style={{ display: 'block', fontSize: '0.78rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>Email Address</label>
                  <input id="co-email" type="email" placeholder="Email Address (optional)" value={form.email} onChange={set('email')} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                  <label htmlFor="co-phone" style={{ display: 'block', fontSize: '0.78rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>Phone Number *</label>
                  <input id="co-phone" type="tel" placeholder="Phone Number" value={form.phone} onChange={set('phone')} required style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>

            <h2 style={{ fontSize: '1.2rem', margin: '40px 0 24px', borderBottom: '1px solid #eee', paddingBottom: 16 }}>Payment</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: `2px solid ${form.paymentMode === "PAY_AT_SALON" ? "var(--sf-accent, #c8a97e)" : "#ddd"}`, borderRadius: 8, cursor: 'pointer', background: form.paymentMode === "PAY_AT_SALON" ? "rgba(200,169,126,0.08)" : "white" }}>
                <input type="radio" name="payment" value="PAY_AT_SALON" checked={form.paymentMode === "PAY_AT_SALON"} onChange={set('paymentMode')} />
                <span style={{ fontWeight: 600 }}>Pay at Salon</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: `2px solid ${form.paymentMode === "ONLINE" ? "var(--sf-accent, #c8a97e)" : "#ddd"}`, borderRadius: 8, cursor: 'pointer', background: form.paymentMode === "ONLINE" ? "rgba(200,169,126,0.08)" : "white" }}>
                <input type="radio" name="payment" value="ONLINE" checked={form.paymentMode === "ONLINE"} onChange={set('paymentMode')} />
                <span style={{ fontWeight: 600 }}>Pay Online (Razorpay)</span>
              </label>
              {form.paymentMode === "ONLINE" && razorpayLoading && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #ccc', borderTopColor: 'var(--sf-accent, #c8a97e)', borderRadius: '50%', animation: 'sf-spin 0.6s linear infinite' }} />
                  Loading payment gateway...
                </p>
              )}
            </div>

            <div>
              <label htmlFor="co-note" style={{ display: 'block', fontSize: '0.78rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontWeight: 600 }}>Special Requests</label>
              <textarea id="co-note" placeholder="Special Requests (optional)" value={form.note} onChange={set('note')} rows={3} style={{ width: '100%', padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>

            <button onClick={handlePlaceBooking} disabled={submitting || razorpayLoading} className="sf-btn sf-btn-primary" style={{ width: '100%', padding: 16, marginTop: 40, opacity: (submitting || razorpayLoading) ? 0.6 : 1, cursor: (submitting || razorpayLoading) ? 'not-allowed' : 'pointer' }}>
              {submitting ? "Processing..." : form.paymentMode === "ONLINE" ? `Pay ${formatPrice(total, currency)}` : "Confirm Booking"}
            </button>
          </div>
        </div>

        <div>
          <div style={{ position: 'sticky', top: 100, zIndex: 1001, background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem' }}>Booking Summary ({bookings.length} {bookings.length === 1 ? 'service' : 'services'})</h3>
            {bookings.map((booking, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20, paddingBottom: 20, borderBottom: idx < bookings.length - 1 ? '1px solid #eee' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{booking.name}</p>
                    {booking.qty > 1 && <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>Qty: {booking.qty}</p>}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{formatPrice(Number(booking.price) * booking.qty, currency)}</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.8rem', color: '#666' }}>
                  <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: 4 }}>
                    {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: 4 }}>{booking.time}</span>
                  {booking.duration && <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: 4 }}>{formatDuration(booking.duration)}</span>}
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee', fontSize: '1.3rem', fontWeight: 700 }}>
                <span>Total</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
      <style>{`
        @keyframes sf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .sf-checkout-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
}
