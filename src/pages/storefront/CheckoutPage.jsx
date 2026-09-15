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
      const results = [];
      for (const booking of bookings) {
        for (let i = 0; i < (booking.qty || 1); i++) {
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
          const res = await api.post(`/public/salon/${salon.slug}/service-bookings`, payload);
          results.push(res.data);
        }
      }

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
    <div className="sf-section" style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: 'clamp(90px, 12vw, 130px)', paddingBottom: 80 }}>
      <style>{`
        .sf-checkout-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 420px;
          gap: 40px;
          align-items: start;
        }
        .sf-checkout-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 32px 28px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          margin-bottom: 24px;
        }
        .sf-checkout-step-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--text-main, #0f172a);
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 700;
          margin-right: 10px;
        }
        .sf-checkout-step-title {
          display: flex;
          align-items: center;
          font-size: 1.25rem;
          margin: 0 0 20px;
          font-family: var(--font-serif, serif);
          font-weight: 600;
          color: var(--text-main, #0f172a);
        }
        .sf-checkout-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e2e8f0;
          background: #fcfdfe;
          font-family: var(--font-sans);
          font-size: 0.95rem;
          color: var(--text-main, #0f172a);
          transition: all 0.2s ease;
          border-radius: 10px;
          box-sizing: border-box;
        }
        .sf-checkout-input:focus {
          outline: none;
          border-color: #0f172a;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
        }
        .sf-checkout-label {
          display: block;
          font-size: 0.8rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .sf-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .sf-checkout-summary-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 28px 24px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }
        .sf-item-thumb {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          object-fit: cover;
          background: #f1f5f9;
          flex-shrink: 0;
        }
        .sf-item-fallback-thumb {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          flex-shrink: 0;
        }
        @media (max-width: 1024px) {
          .sf-checkout-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        @media (max-width: 640px) {
          .sf-checkout-container {
            padding: 0 14px !important;
          }
          .sf-checkout-card {
            padding: 20px 16px !important;
            border-radius: 14px !important;
          }
          .sf-form-row {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin-bottom: 12px !important;
          }
          .sf-checkout-summary-card {
            padding: 20px 16px !important;
            border-radius: 16px !important;
          }
        }
      `}</style>
      <div className="sf-checkout-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <Link to={`/site/${salon?.slug}/collections`} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
            <ArrowLeft size={15} /> Back to Catalog
          </Link>
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontFamily: 'var(--font-serif)', fontWeight: 700, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Secure Checkout
          </h1>
          <p style={{ color: '#64748b', fontSize: 'clamp(0.88rem, 2.5vw, 1rem)', margin: 0 }}>
            Complete your reservation in just a few quick steps.
          </p>
        </div>

        {error && (
          <div style={{ padding: 14, background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 12, color: '#dc2626', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}>
            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="sf-checkout-grid">
          {/* Left Column: Form Steps */}
          <div>
            {/* Step 1: Guest Information */}
            <div className="sf-checkout-card">
              <h2 className="sf-checkout-step-title">
                <span className="sf-checkout-step-badge">1</span>
                Guest Information
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
                  <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: 10, background: '#fcfdfe', overflow: 'hidden' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '12px 10px',
                      background: '#f1f5f9',
                      borderRight: '1px solid #e2e8f0',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#0f172a',
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
                      style={{ border: 'none', background: 'transparent', padding: '12px 14px', width: '100%', fontSize: '0.95rem', outline: 'none', color: '#0f172a' }}
                    />
                  </div>
                  {form.phone && form.phone.length > 0 && form.phone.length < 10 && (
                    <small style={{ color: '#d97706', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                      {10 - form.phone.length} more digit{10 - form.phone.length > 1 ? "s" : ""} required
                    </small>
                  )}
                  {form.phone && form.phone.length === 10 && (
                    <small style={{ color: '#16a34a', fontSize: '0.75rem', marginTop: 4, display: 'block', fontWeight: 600 }}>
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

            {/* Step 2: Special Requests */}
            <div className="sf-checkout-card">
              <h2 className="sf-checkout-step-title">
                <span className="sf-checkout-step-badge">2</span>
                Special Requests
              </h2>
              <textarea placeholder="Any preferences, allergies, or notes for our specialists..." value={form.note} onChange={set("note")} className="sf-checkout-input" rows={3} style={{ resize: 'vertical' }} />
            </div>

            {/* Step 3: Payment Method */}
            <div className="sf-checkout-card">
              <h2 className="sf-checkout-step-title">
                <span className="sf-checkout-step-badge">3</span>
                Payment Method
              </h2>
              <div style={{ padding: '16px 18px', border: '2px solid #0f172a', background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <CheckCircle2 size={22} color="#0f172a" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a', marginBottom: 2 }}>Pay at Salon</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.4 }}>Your booking is confirmed instantly. Pay via Cash, Card, or UPI at the front desk upon arrival.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary Sticky Card */}
          <div className="sf-checkout-sticky" style={{ position: 'sticky', top: 100 }}>
            <div className="sf-checkout-summary-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 700, color: '#0f172a' }}>
                  Order Summary
                </h3>
                <span style={{ fontSize: '0.8rem', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 12, fontWeight: 700 }}>
                  {bookings.length} {bookings.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24, maxHeight: 300, overflowY: 'auto' }}>
                {bookings.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {b.imageUrl ? (
                      <div style={{ position: 'relative' }}>
                        <img 
                          src={b.imageUrl} 
                          alt=""
                          className="sf-item-thumb" 
                          onError={e => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="sf-item-fallback-thumb" style={{ display: 'none' }}>
                          <Calendar size={18} />
                        </div>
                      </div>
                    ) : (
                      <div className="sf-item-fallback-thumb">
                        <Calendar size={18} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 2 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', wordBreak: 'break-word' }}>{b.name}</p>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', flexShrink: 0 }}>{currency} {Number(b.price) * b.qty}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        📅 {new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {b.time}
                      </p>
                      {b.staffName && <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#c8a97e', fontWeight: 600 }}>Specialist: {b.staffName}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Input Group */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 18, marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="PROMO CODE"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1.5px solid #e2e8f0',
                      background: '#fcfdfe',
                      color: '#0f172a',
                      borderRadius: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    style={{
                      padding: '10px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      borderRadius: 10,
                      border: '1px solid #0f172a',
                      background: '#0f172a',
                      color: '#ffffff',
                      cursor: validatingCoupon || !couponCode.trim() ? 'not-allowed' : 'pointer',
                      opacity: validatingCoupon || !couponCode.trim() ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    {validatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {couponMsg && (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: couponMsg.type === 'success' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {couponMsg.text}
                  </p>
                )}
              </div>
              
              {/* Pricing Breakdown */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b', marginBottom: 6 }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{currency} {subtotal}</span>
                </div>
                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#16a34a', marginBottom: 6, fontWeight: 600 }}>
                    <span>Coupon Discount</span>
                    <span>- {currency} {couponDiscount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.35rem', color: '#0f172a', fontFamily: 'var(--font-serif)', fontWeight: 700, paddingTop: 10, borderTop: '1px dashed #e2e8f0', marginTop: 8 }}>
                  <span>Total</span>
                  <span>{currency} {finalTotal}</span>
                </div>
              </div>

              {/* Confirm Booking CTA */}
              <button 
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#ffffff',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(15, 23, 42, 0.25)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }} 
                onClick={handlePlaceBooking} 
                disabled={submitting}
              >
                {submitting ? 'Confirming Appointment...' : 'Confirm Appointment'}
              </button>
              
              <div style={{ marginTop: 14, textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                🔒 Free cancellation up to 2 hours before appointment.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
