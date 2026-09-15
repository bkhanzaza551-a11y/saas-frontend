import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";

export default function CheckoutPage() {
  const { salon, bookings, clearBookings } = useOutletContext();
  const navigate = useNavigate();
  const currency = salon.currency || "INR";

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    note: "", paymentMode: "PAY_AT_SALON",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const total = bookings.reduce((sum, b) => sum + Number(b.price) * b.qty, 0);

  if (bookings.length === 0) {
    return (
      <div style={{ background: '#fafafa', minHeight: '100vh', padding: '60px 20px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--sf-font-serif)', fontSize: '2.5rem', margin: '0 0 24px' }}>Booking Checkout</h1>
        <p style={{ color: '#999', marginBottom: 24 }}>You have no services in your booking summary.</p>
        <Link to={`/site/${salon.slug}/services`} className="sf-btn sf-btn-primary" style={{ padding: '14px 32px' }}>Browse Services</Link>
      </div>
    );
  }

  const loadRazorpay = () => new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const submitBookings = async (paymentDetails = null) => {
    setSubmitting(true);
    setError("");
    try {
      const customerName = `${form.firstName} ${form.lastName}`.trim();
      const results = [];

      for (const booking of bookings) {
        for (let i = 0; i < booking.qty; i++) {
          const payload = {
            serviceId: booking.serviceId,
            customerName,
            customerPhone: form.phone,
            customerEmail: form.email || undefined,
            preferredDate: booking.date,
            preferredTime: booking.time,
            staffId: null,
            note: form.note || undefined,
            paymentMode: form.paymentMode,
          };
          const res = await api.post(`/public/salon/${salon.slug}/service-bookings`, payload);
          results.push(res.data);
        }
      }

      if (paymentDetails) {
        try {
          await api.post(`/public/salon/${salon.slug}/verify-razorpay-payment`, {
            razorpayOrderId: paymentDetails.razorpay_order_id,
            razorpayPaymentId: paymentDetails.razorpay_payment_id,
            razorpaySignature: paymentDetails.razorpay_signature
          });
        } catch (e) { console.error("Payment verification failed:", e); }
      }

      clearBookings();
      const orderNumber = results[0]?.order?.orderNumber || results[0]?.orderNumber || `BK-${Date.now()}`;
      navigate(`/site/${salon.slug}/booking-confirmation?orderNumber=${orderNumber}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place booking. Please try again.");
      setSubmitting(false);
    }
  };

  const handlePhoneInput = (e) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith("0")) {
      digits = digits.slice(1);
    }
    if (digits.length > 10) digits = digits.slice(0, 10);
    setForm({ ...form, phone: digits });
  };

  const handlePlaceBooking = async () => {
    setError("");
    const firstNameTrim = form.firstName.trim();
    if (!firstNameTrim) {
      setError("Please enter your First Name.");
      return;
    }
    if (firstNameTrim.length < 2) {
      setError("First name must be at least 2 characters.");
      return;
    }

    const cleanPhone = form.phone.replace(/\D/g, "");
    if (!cleanPhone) {
      setError("Please enter your 10-digit mobile number.");
      return;
    }
    if (cleanPhone.length !== 10) {
      setError(`Please enter a valid 10-digit mobile number (currently ${cleanPhone.length} digits).`);
      return;
    }

    if (form.email && form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    if (form.paymentMode === "ONLINE") {
      const loaded = await loadRazorpay();
      if (!loaded) { setError("Failed to load payment gateway. Please try again."); return; }

      try {
        const orderRes = await api.post(`/public/salon/${salon.slug}/razorpay-order`, {
          amount: total,
          currency: "INR",
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
          theme: { color: "var(--sf-accent, #c8a97e)" },
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
    <div style={{ background: '#fafafa', minHeight: '100vh', padding: '60px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 400px', gap: 60 }}>

        <div>
          <Link to={`/site/${salon.slug}/booking-summary`} style={{ color: '#999', textDecoration: 'none', marginBottom: 32, display: 'inline-block' }}>&larr; Back to Booking Summary</Link>
          <h1 style={{ fontFamily: 'var(--sf-font-serif)', fontSize: '2.5rem', margin: '0 0 32px' }}>Booking Checkout</h1>

          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid #fecaca' }}>{error}</div>}

          <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 16 }}>Contact Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <input type="text" placeholder="First Name *" value={form.firstName} onChange={set('firstName')} required style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8, width: '100%' }} />
                <input type="text" placeholder="Last Name" value={form.lastName} onChange={set('lastName')} style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8, width: '100%' }} />
              </div>
              <input type="email" placeholder="Email Address (optional)" value={form.email} onChange={set('email')} style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8, width: '100%' }} />
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', background: '#f8fafc', borderRight: '1px solid #ccc', fontWeight: 700, fontSize: '0.95rem', color: '#333', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={form.phone}
                    onChange={handlePhoneInput}
                    required
                    style={{ padding: 12, border: 'none', width: '100%', outline: 'none', fontSize: '0.95rem', letterSpacing: '1px' }}
                  />
                </div>
                {form.phone && form.phone.length > 0 && form.phone.length < 10 && (
                  <small style={{ color: '#d97706', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>
                    {10 - form.phone.length} more digit{10 - form.phone.length > 1 ? "s" : ""} required
                  </small>
                )}
                {form.phone && form.phone.length === 10 && (
                  <small style={{ color: '#16a34a', fontSize: '0.8rem', marginTop: 4, display: 'block', fontWeight: 600 }}>
                    ✓ 10-digit number verified
                  </small>
                )}
              </div>
            </div>

            <h2 style={{ fontSize: '1.2rem', margin: '40px 0 24px', borderBottom: '1px solid #eee', paddingBottom: 16 }}>Payment</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: `2px solid ${form.paymentMode === "PAY_AT_SALON" ? "var(--sf-accent, #c8a97e)" : "#ddd"}`, borderRadius: 8, cursor: 'pointer', background: form.paymentMode === "PAY_AT_SALON" ? "var(--sf-accent, #c8a97e)11" : "white" }}>
                <input type="radio" name="payment" value="PAY_AT_SALON" checked={form.paymentMode === "PAY_AT_SALON"} onChange={set('paymentMode')} />
                <span style={{ fontWeight: 600 }}>Pay at Salon</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: `2px solid ${form.paymentMode === "ONLINE" ? "var(--sf-accent, #c8a97e)" : "#ddd"}`, borderRadius: 8, cursor: 'pointer', background: form.paymentMode === "ONLINE" ? "var(--sf-accent, #c8a97e)11" : "white" }}>
                <input type="radio" name="payment" value="ONLINE" checked={form.paymentMode === "ONLINE"} onChange={set('paymentMode')} />
                <span style={{ fontWeight: 600 }}>Pay Online (Razorpay)</span>
              </label>
            </div>

            <textarea placeholder="Special Requests (optional)" value={form.note} onChange={set('note')} rows={3} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, marginTop: 24, resize: 'vertical', boxSizing: 'border-box' }} />

            <button onClick={handlePlaceBooking} disabled={submitting} className="sf-btn sf-btn-primary" style={{ width: '100%', padding: 16, marginTop: 40, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? "Processing..." : form.paymentMode === "ONLINE" ? `Pay ${currency} ${total.toFixed(2)}` : "Confirm Booking"}
            </button>
          </div>
        </div>

        <div>
          <div style={{ position: 'sticky', top: 100, background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem' }}>Booking Summary ({bookings.length} {bookings.length === 1 ? 'service' : 'services'})</h3>
            {bookings.map((booking, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20, paddingBottom: 20, borderBottom: idx < bookings.length - 1 ? '1px solid #eee' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{booking.name}</p>
                    {booking.qty > 1 && <p style={{ margin: 0, color: '#999', fontSize: '0.8rem' }}>Qty: {booking.qty}</p>}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{currency} {(Number(booking.price) * booking.qty).toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.8rem', color: '#666' }}>
                  <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: 4 }}>
                    {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: 4 }}>{booking.time}</span>
                  {booking.duration && <span style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: 4 }}>{booking.duration} min</span>}
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee', fontSize: '1.3rem', fontWeight: 700 }}>
                <span>Total</span>
                <span>{currency} {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
