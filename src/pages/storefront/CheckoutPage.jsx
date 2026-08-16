import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { ArrowLeft, Calendar, User, Phone, Mail, FileText, CheckCircle2 } from "lucide-react";

export default function CheckoutPage() {
  const { salon, bookings, clearBookings } = useOutletContext();
  const navigate = useNavigate();
  const currency = salon?.currency || "INR";

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    note: "", paymentMode: "PAY_AT_SALON",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const subtotal = bookings.reduce((sum, b) => sum + Number(b.price) * b.qty, 0);
  const finalTotal = Math.max(0, subtotal - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponMsg("");
    try {
      const res = await api.post(`/public/salon/${salon.slug}/coupons/validate`, {
        code: couponCode.trim(),
        subtotal
      });
      if (res.data?.valid) {
        setCouponDiscount(Number(res.data.discountAmount || 0));
        setCouponMsg({ text: res.data.message || `Coupon applied! Saved ${currency} ${res.data.discountAmount}`, type: "success" });
      } else {
        setCouponDiscount(0);
        setCouponMsg({ text: res.data.message || "Invalid coupon code", type: "error" });
      }
    } catch (err) {
      setCouponDiscount(0);
      setCouponMsg({ text: err.response?.data?.message || "Invalid coupon code", type: "error" });
    } finally {
      setValidatingCoupon(false);
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="storefront-wrapper" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: 'var(--surface)' }}>
        <div style={{ textAlign: 'center', padding: '80px 32px', background: 'var(--bg-main)', border: '1px solid var(--border)', maxWidth: 600, width: '100%' }}>
          <div style={{ width: 80, height: 80, background: 'var(--surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', color: 'var(--text-muted)' }}>
            <Calendar size={32} />
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: 24, fontFamily: 'var(--font-serif)', fontWeight: 500 }}>No Appointments Yet</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 48, fontSize: '1.1rem', fontWeight: 300 }}>You have no services in your booking summary.</p>
          <Link to={`/site/${salon.slug}/services`} className="sf-btn-primary">Browse Services</Link>
        </div>
      </div>
    );
  }

  const submitBookings = async () => {
    setSubmitting(true);
    setError("");
    try {
      const customerName = `${form.firstName} ${form.lastName}`.trim();
      const promises = [];
      for (const booking of bookings) {
        for (let i = 0; i < booking.qty; i++) {
          const payload = {
            serviceId: booking.serviceId || booking.id,
            customerName,
            customerPhone: form.phone,
            customerEmail: form.email || undefined,
            preferredDate: booking.date,
            preferredTime: booking.time,
            staffId: booking.staffId || null,
            branchId: booking.branchId || null,
            note: form.note || undefined,
            paymentMode: form.paymentMode,
            couponCode: couponDiscount > 0 ? couponCode.trim() : undefined
          };
          promises.push(api.post(`/public/salon/${salon.slug}/service-bookings`, payload));
        }
      }
      const resps = await Promise.all(promises);
      const results = resps.map(r => r.data);

      clearBookings();
      localStorage.setItem("sf_customer_phone", form.phone);
      const orderNumber = results[0]?.order?.orderNumber || results[0]?.orderNumber || `BK-${Date.now()}`;
      navigate(`/site/${salon.slug}/booking-confirmation?orderNumber=${orderNumber}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place booking. Please try again.");
      setSubmitting(false);
    }
  };

  const handlePlaceBooking = async () => {
    if (!form.firstName.trim() || !form.phone.trim()) {
      setError("Please fill in your first name and phone number.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 8) {
      setError("Please enter a valid phone number.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    await submitBookings();
  };

  return (
    <div className="sf-section" style={{ background: 'var(--bg-main)', minHeight: '100vh', paddingTop: 140 }}>
      <style>{`
        .sf-checkout-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 480px;
          gap: 80px;
          align-items: start;
        }
        .sf-checkout-input {
          width: 100%;
          padding: 16px 0;
          border: none;
          border-bottom: 1px solid var(--border);
          background: transparent;
          font-family: var(--font-sans);
          font-size: 1.1rem;
          color: var(--text-main);
          transition: border-color 0.3s;
          border-radius: 0;
        }
        .sf-checkout-input:focus {
          outline: none;
          border-color: var(--accent);
        }
        .sf-checkout-label {
          display: block;
          font-size: 0.85rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          font-weight: 500;
        }
        @media (max-width: 1024px) {
          .sf-checkout-grid {
            grid-template-columns: 1fr;
            gap: 60px;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ marginBottom: 60 }}>
          <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--text-main)', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
            Checkout
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 300, margin: 0 }}>
            Complete your reservation in just a few details.
          </p>
        </div>

        {error && (
          <div style={{ padding: 20, background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 'var(--radius-sm)', color: '#dc2626', marginBottom: 40, display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.95rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="sf-checkout-grid">
          <div>
            <div style={{ marginBottom: 60 }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 32, fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--text-main)' }}>
                1. Guest Information
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
                <div>
                  <label className="sf-checkout-label">First Name *</label>
                  <input type="text" required placeholder="e.g. Eleanor" value={form.firstName} onChange={set("firstName")} className="sf-checkout-input" />
                </div>
                <div>
                  <label className="sf-checkout-label">Last Name</label>
                  <input type="text" placeholder="e.g. Vance" value={form.lastName} onChange={set("lastName")} className="sf-checkout-input" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                <div>
                  <label className="sf-checkout-label">Phone Number *</label>
                  <input type="tel" required placeholder="e.g. +91 98765 43210" value={form.phone} onChange={set("phone")} className="sf-checkout-input" />
                </div>
                <div>
                  <label className="sf-checkout-label">Email Address (Optional)</label>
                  <input type="email" placeholder="eleanor@example.com" value={form.email} onChange={set("email")} className="sf-checkout-input" />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 60 }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 32, fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--text-main)' }}>
                2. Special Requests
              </h2>
              <textarea placeholder="Any preferences, allergies, or notes for our specialists..." value={form.note} onChange={set("note")} className="sf-checkout-input" rows={3} style={{ resize: 'vertical' }} />
            </div>

            <div style={{ marginBottom: 60 }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 32, fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--text-main)' }}>
                3. Payment Method
              </h2>
              <div style={{ padding: 24, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                <CheckCircle2 size={24} style={{ color: 'var(--accent)', marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '1.1rem', marginBottom: 8 }}>Pay at Salon</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 300, lineHeight: 1.6 }}>Your booking will be confirmed instantly. Please pay at the front desk when you arrive for your appointment.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="sf-checkout-sticky" style={{ position: 'sticky', top: 120 }}>
            <div style={{ background: 'var(--surface-alt)', padding: 48, borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1.8rem', marginBottom: 32, fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--text-main)' }}>Order Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
                {bookings.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {b.imageUrl ? (
                      <img src={b.imageUrl} alt={b.name} style={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: '8px', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={20} color="var(--text-muted)" />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <p style={{ margin: 0, fontWeight: 500, fontSize: '1rem', color: 'var(--text-main)' }}>{b.name}</p>
                        <span style={{ fontWeight: 500, color: 'var(--text-main)', fontFamily: 'var(--font-serif)', fontSize: '1rem' }}>{currency} {Number(b.price) * b.qty}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 300 }}>
                        {new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {b.time}
                      </p>
                      {b.staffName && <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--accent)' }}>Stylist: {b.staffName}</p>}
                      {b.qty > 1 && <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qty: {b.qty}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="PROMO CODE"
                    style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="sf-btn-outline"
                    style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  >
                    {validatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {couponMsg && (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: couponMsg.type === 'success' ? '#059669' : '#dc2626', fontWeight: 500 }}>
                    {couponMsg.text}
                  </p>
                )}
              </div>
              
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  <span>Subtotal</span>
                  <span>{currency} {subtotal}</span>
                </div>
                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: '#059669', marginBottom: 8 }}>
                    <span>Coupon Discount</span>
                    <span>- {currency} {couponDiscount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', color: 'var(--text-main)', fontFamily: 'var(--font-serif)', fontWeight: 500, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
                  <span>Total</span>
                  <span>{currency} {finalTotal}</span>
                </div>
              </div>

              <button 
                className="sf-btn-primary" 
                style={{ width: '100%', padding: '20px 0', fontSize: '1.1rem', borderRadius: '4px' }} 
                onClick={handlePlaceBooking} 
                disabled={submitting}
              >
                {submitting ? 'Confirming...' : 'Confirm Appointment'}
              </button>
              
              <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 300, lineHeight: 1.5 }}>
                By confirming your booking, you agree to our salon's cancellation policies.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
