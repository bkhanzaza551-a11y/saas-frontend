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

  const submitBookings = async () => {
    setSubmitting(true);
    setError("");
    try {
      const customerName = `${form.firstName} ${form.lastName}`.trim();
      const formattedPhone = form.phone.startsWith("+91") ? form.phone : `+91${form.phone}`;
      const promises = [];
      for (const booking of bookings) {
        for (let i = 0; i < booking.qty; i++) {
          const payload = {
            serviceId: booking.serviceId || booking.id,
            customerName,
            customerPhone: formattedPhone,
            customerEmail: form.email ? form.email.trim() : undefined,
            preferredDate: booking.date,
            preferredTime: booking.time,
            staffId: booking.staffId || null,
            branchId: booking.branchId || null,
            note: form.note ? form.note.trim() : undefined,
            paymentMode: form.paymentMode,
            couponCode: couponDiscount > 0 ? couponCode.trim() : undefined
          };
          promises.push(api.post(`/public/salon/${salon.slug}/service-bookings`, payload));
        }
      }
      const resps = await Promise.all(promises);
      const results = resps.map(r => r.data);

      clearBookings();
      localStorage.setItem("sf_customer_phone", formattedPhone);
      const orderNumber = results[0]?.order?.orderNumber || results[0]?.orderNumber || `BK-${Date.now()}`;
      navigate(`/site/${salon.slug}/booking-confirmation?orderNumber=${orderNumber}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place booking. Please try again.");
      setSubmitting(false);
    }
  };

  const handlePlaceBooking = async () => {
    setError("");
    const firstNameTrim = form.firstName.trim();
    if (!firstNameTrim) {
      setError("Please enter your First Name.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (firstNameTrim.length < 2) {
      setError("First name must be at least 2 characters.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const cleanPhone = form.phone.replace(/\D/g, "");
    if (!cleanPhone) {
      setError("Please enter your 10-digit mobile number.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (cleanPhone.length !== 10) {
      setError(`Please enter a valid 10-digit mobile number (currently ${cleanPhone.length} digits).`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (form.email && form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        setError("Please enter a valid email address.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
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
        .sf-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }
        @media (max-width: 1024px) {
          .sf-checkout-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }
        @media (max-width: 640px) {
          .sf-form-row {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
            margin-bottom: 20px !important;
          }
          .sf-checkout-container {
            padding: 20px 14px !important;
          }
          .sf-checkout-summary-card {
            padding: 24px 16px !important;
          }
        }
      `}</style>
      <div className="sf-checkout-container" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--text-main)', margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Checkout
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', fontWeight: 300, margin: 0 }}>
            Complete your reservation in just a few details.
          </p>
        </div>

        {error && (
          <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 'var(--radius-sm)', color: '#dc2626', marginBottom: 30, display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.9rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="sf-checkout-grid">
          <div>
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: 24, fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--text-main)' }}>
                1. Guest Information
              </h2>
              <div className="sf-form-row">
                <div>
                  <label className="sf-checkout-label">First Name *</label>
                  <input type="text" required placeholder="e.g. Eleanor" value={form.firstName} onChange={set("firstName")} className="sf-checkout-input" />
                </div>
                <div>
                  <label className="sf-checkout-label">Last Name</label>
                  <input type="text" placeholder="e.g. Vance" value={form.lastName} onChange={set("lastName")} className="sf-checkout-input" />
                </div>
              </div>
              <div className="sf-form-row">
                <div>
                  <label className="sf-checkout-label">Phone Number *</label>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'transparent' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '16px 12px 16px 0',
                      borderRight: '1px solid var(--border)',
                      marginRight: 12,
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      userSelect: 'none'
                    }}>
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="98765 43210"
                      value={form.phone}
                      onChange={handlePhoneInput}
                      className="sf-checkout-input"
                      style={{ borderBottom: 'none', padding: '16px 0', letterSpacing: '1px' }}
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
