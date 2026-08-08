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
      <div className="storefront-wrapper" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: 24, letterSpacing: '-1px' }}>Booking Checkout</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '1.1rem' }}>You have no services in your booking summary.</p>
          <Link to={`/site/${salon.slug}/services`} className="sf-btn-primary">Browse Services</Link>
        </div>
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
      const orderNumber = results[0]?.orderNumber || `BK-${Date.now()}`;
      navigate(`/site/${salon.slug}/booking-confirmation?orderNumber=${orderNumber}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place booking. Please try again.");
      setSubmitting(false);
    }
  };

  const handlePlaceBooking = async () => {
    if (!form.firstName.trim() || !form.phone.trim()) {
      setError("Please fill in your first name and phone number.");
      return;
    }
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 8) {
      setError("Please enter a valid phone number.");
      return;
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
          theme: { color: "var(--accent)" },
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
    <div className="sf-section" style={{ background: 'var(--surface)', minHeight: '100vh', paddingTop: 120 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 60, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: FORM */}
        <div>
          <Link to={`/site/${salon.slug}/cart`} style={{ color: 'var(--text-muted)', display: 'inline-block', marginBottom: 32, fontWeight: 500 }}>&larr; Back to Cart</Link>
          <h1 style={{ fontSize: '2.5rem', marginBottom: 32, letterSpacing: '-1px' }}>Checkout</h1>

          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px 20px', borderRadius: 'var(--radius-sm)', marginBottom: 24, border: '1px solid #fecaca', fontWeight: 500 }}>{error}</div>}

          <div style={{ background: 'var(--bg-main)', padding: 40, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>Contact Information</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div className="sf-form-group" style={{ marginBottom: 0 }}>
                <label className="sf-form-label">First Name *</label>
                <input type="text" className="sf-form-input" placeholder="e.g. Sara" value={form.firstName} onChange={set('firstName')} required />
              </div>
              <div className="sf-form-group" style={{ marginBottom: 0 }}>
                <label className="sf-form-label">Last Name</label>
                <input type="text" className="sf-form-input" placeholder="e.g. Khan" value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>

            <div className="sf-form-group">
              <label className="sf-form-label">Phone Number *</label>
              <input type="tel" className="sf-form-input" placeholder="e.g. 999 999 9999" value={form.phone} onChange={set('phone')} required />
            </div>

            <div className="sf-form-group">
              <label className="sf-form-label">Email Address (Optional)</label>
              <input type="email" className="sf-form-input" placeholder="sara@example.com" value={form.email} onChange={set('email')} />
            </div>

            <div className="sf-form-group" style={{ marginBottom: 40 }}>
              <label className="sf-form-label">Special Notes (Optional)</label>
              <textarea className="sf-form-input" placeholder="Any specific instructions for your booking..." rows={3} value={form.note} onChange={set('note')} style={{ resize: 'vertical' }}></textarea>
            </div>

            <h2 style={{ fontSize: '1.4rem', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>Payment Method</h2>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
              <label style={{ flex: 1, minWidth: 200, padding: 20, border: form.paymentMode === 'PAY_AT_SALON' ? '2px solid var(--accent)' : '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)', background: form.paymentMode === 'PAY_AT_SALON' ? 'var(--surface)' : 'var(--bg-main)' }}>
                <input type="radio" name="payment" value="PAY_AT_SALON" checked={form.paymentMode === 'PAY_AT_SALON'} onChange={set('paymentMode')} style={{ display: 'none' }} />
                <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 4 }}>Pay at Salon</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pay with cash or card after your service</div>
              </label>

              {salon.config?.razorpayEnabled && (
                <label style={{ flex: 1, minWidth: 200, padding: 20, border: form.paymentMode === 'ONLINE' ? '2px solid var(--accent)' : '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)', background: form.paymentMode === 'ONLINE' ? 'var(--surface)' : 'var(--bg-main)' }}>
                  <input type="radio" name="payment" value="ONLINE" checked={form.paymentMode === 'ONLINE'} onChange={set('paymentMode')} style={{ display: 'none' }} />
                  <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 4 }}>Pay Online Now</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Securely pay via Razorpay</div>
                </label>
              )}
            </div>

            <button 
              className="sf-btn-primary" 
              style={{ width: '100%', padding: '18px 0', fontSize: '1.1rem' }} 
              onClick={handlePlaceBooking} 
              disabled={submitting}
            >
              {submitting ? 'Processing...' : (form.paymentMode === 'ONLINE' ? 'Proceed to Payment' : 'Confirm Booking')}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: SUMMARY */}
        <div style={{ background: 'var(--bg-main)', padding: 32, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', position: 'sticky', top: 100 }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>Order Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
            {bookings.map((b, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: 16 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>{b.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>x{b.qty}</span></div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {b.time}
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{currency} {Number(b.price) * b.qty}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 20, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
            <span>Total</span>
            <span>{currency} {total}</span>
          </div>
          
          <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            By confirming your booking, you agree to the salon's cancellation policy.
          </div>
        </div>
      </div>
    </div>
  );
}
