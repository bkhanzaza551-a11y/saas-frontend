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

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const total = bookings.reduce((sum, b) => sum + Number(b.price) * b.qty, 0);

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
            serviceId: booking.serviceId || booking.id, // Fixed mapping
            customerName,
            customerPhone: form.phone,
            customerEmail: form.email || undefined,
            preferredDate: booking.date,
            preferredTime: booking.time,
            staffId: booking.staffId || null,
            note: form.note || undefined,
            paymentMode: form.paymentMode, 
          };
          promises.push(api.post(`/public/salon/${salon.slug}/service-bookings`, payload));
        }
      }
      const resps = await Promise.all(promises);
      const results = resps.map(r => r.data);

      clearBookings();
      localStorage.setItem("sf_customer_phone", form.phone);
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 8) {
      setError("Please enter a valid phone number.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Direct booking flow, no payment gateway
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
          border-bottom-color: var(--accent);
        }
        .sf-checkout-input::placeholder {
          color: #a3a3a3;
          font-weight: 300;
        }
        @media (max-width: 900px) {
          .sf-checkout-grid {
            grid-template-columns: 1fr !important;
            gap: 60px !important;
          }
          .sf-checkout-sticky {
            position: static !important;
          }
        }
      `}</style>
      <div className="sf-checkout-grid" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        
        {/* LEFT COLUMN: FORM */}
        <div>
          <Link to={`/site/${salon.slug}/cart`} style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 40, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} /> Back to Services
          </Link>
          <h1 style={{ fontSize: '3.5rem', marginBottom: 60, fontFamily: 'var(--font-serif)', fontWeight: 500, letterSpacing: '-1px' }}>Checkout</h1>

          {error && (
            <div style={{ background: '#fff1f2', color: '#be123c', padding: '20px 24px', marginBottom: 40, borderLeft: '4px solid #be123c', fontWeight: 500, fontSize: '1.05rem' }}>
              {error}
            </div>
          )}

          {/* Personal Info */}
          <div style={{ marginBottom: 60 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 32, fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--text-main)' }}>
              1. Contact Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>First Name *</label>
                <input type="text" className="sf-checkout-input" placeholder="Rohan" value={form.firstName} onChange={set("firstName")} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Last Name</label>
                <input type="text" className="sf-checkout-input" placeholder="Sharma" value={form.lastName} onChange={set("lastName")} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Phone Number *</label>
                <input type="tel" className="sf-checkout-input" placeholder="+91 98765 43210" value={form.phone} onChange={set("phone")} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Email Address</label>
                <input type="email" className="sf-checkout-input" placeholder="rohan@example.com" value={form.email} onChange={set("email")} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 60 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 32, fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--text-main)' }}>
              2. Additional Notes
            </h2>
            <textarea 
              className="sf-checkout-input" 
              placeholder="Any specific requests or requirements for your stylist..." 
              value={form.note} onChange={set("note")} 
              rows={3}
              style={{ resize: 'vertical' }}
            />
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

        {/* RIGHT COLUMN: SUMMARY */}
        <div className="sf-checkout-sticky" style={{ position: 'sticky', top: 120 }}>
          <div style={{ background: 'var(--surface-alt)', padding: 48, borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: 40, fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--text-main)' }}>Order Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 40 }}>
              {bookings.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  {b.imageUrl ? (
                    <img src={b.imageUrl} alt={b.name} style={{ width: 64, height: 64, borderRadius: '8px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: '8px', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={24} color="var(--text-muted)" />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem', color: 'var(--text-main)' }}>{b.name}</p>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)', fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>{currency} {Number(b.price) * b.qty}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 300 }}>
                      {new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {b.time}
                    </p>
                    {b.qty > 1 && <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Qty: {b.qty}</p>}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32, marginBottom: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.6rem', color: 'var(--text-main)', fontFamily: 'var(--font-serif)', fontWeight: 500 }}>
                <span>Total</span>
                <span>{currency} {total}</span>
              </div>
            </div>

            <button 
              className="sf-btn-primary" 
              style={{ width: '100%', padding: '24px 0', fontSize: '1.1rem', borderRadius: '4px' }} 
              onClick={handlePlaceBooking} 
              disabled={submitting}
            >
              {submitting ? 'Confirming...' : 'Confirm Appointment'}
            </button>
            
            <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 300, lineHeight: 1.6 }}>
              By confirming your booking, you agree to our salon's cancellation policies.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
