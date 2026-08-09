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
      const results = [];

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
          const res = await api.post(`/public/salon/${salon.slug}/service-bookings`, payload);
          results.push(res.data);
        }
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
    <div className="sf-section" style={{ background: 'var(--surface)', minHeight: '100vh', paddingTop: 140 }}>
      <style>{`
        .sf-checkout-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 420px;
          gap: 60px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .sf-checkout-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .sf-checkout-sticky {
            position: static !important;
          }
          .sf-checkout-form-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div className="sf-checkout-grid" style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* LEFT COLUMN: FORM */}
        <div>
          <Link to={`/site/${salon.slug}/cart`} style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Back to Cart
          </Link>
          <h1 style={{ fontSize: '3rem', marginBottom: 40, fontFamily: 'var(--font-serif)', fontWeight: 500 }}>Final Details</h1>

          {error && (
            <div style={{ background: '#fff1f2', color: '#be123c', padding: '20px 24px', marginBottom: 32, borderLeft: '4px solid #be123c', fontWeight: 500, fontSize: '1.05rem' }}>
              {error}
            </div>
          )}

          {/* Personal Info */}
          <div style={{ marginBottom: 40, background: 'var(--bg-main)', padding: 40, borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-serif)', fontWeight: 500 }}>
              <User size={24} style={{ color: 'var(--accent)' }} /> Your Information
            </h2>
            <div className="sf-checkout-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div className="sf-form-group">
                <label className="sf-form-label">First Name *</label>
                <input type="text" className="sf-form-input" placeholder="e.g. Sara" value={form.firstName} onChange={set("firstName")} style={{ background: 'var(--surface)' }} />
              </div>
              <div className="sf-form-group">
                <label className="sf-form-label">Last Name</label>
                <input type="text" className="sf-form-input" placeholder="e.g. Khan" value={form.lastName} onChange={set("lastName")} style={{ background: 'var(--surface)' }} />
              </div>
            </div>
            
            <div className="sf-form-group" style={{ marginBottom: 20 }}>
              <label className="sf-form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}><Phone size={14} /> Phone Number *</label>
              <input type="tel" className="sf-form-input" placeholder="e.g. 999 999 9999" value={form.phone} onChange={set("phone")} style={{ background: 'var(--surface)' }} />
            </div>

            <div className="sf-form-group" style={{ marginBottom: 20 }}>
              <label className="sf-form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}><Mail size={14} /> Email Address (Optional)</label>
              <input type="email" className="sf-form-input" placeholder="sara@example.com" value={form.email} onChange={set("email")} style={{ background: 'var(--surface)' }} />
            </div>
          </div>

          <div style={{ marginBottom: 40, background: 'var(--bg-main)', padding: 40, borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-serif)', fontWeight: 500, textAlign: 'left' }}>
              <FileText size={24} style={{ color: 'var(--accent)' }} /> Special Notes (Optional)
            </h2>
            <textarea 
              className="sf-form-input" 
              placeholder="Any specific instructions for your booking..." 
              value={form.note} onChange={set("note")} 
              rows={4}
              style={{ resize: 'vertical', background: 'var(--surface)' }}
            />
          </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-serif)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12 }}>
              Payment Method
            </h2>
            
            <div style={{ marginBottom: 48 }}>
              <div style={{ padding: 24, border: '1px solid var(--accent)', background: 'var(--surface)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <CheckCircle2 size={24} style={{ color: 'var(--accent)', marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>Pay at Salon</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 300 }}>Your booking will be confirmed instantly. You can pay with cash or card when you visit.</div>
                </div>
              </div>
            </div>

            <button 
              className="sf-btn-primary" 
              style={{ width: '100%', padding: '20px 0', fontSize: '1.1rem' }} 
              onClick={handlePlaceBooking} 
              disabled={submitting}
            >
              {submitting ? 'Confirming Appointment...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: SUMMARY */}
        <div className="sf-checkout-sticky" style={{ position: 'sticky', top: 120 }}>
          <div style={{ background: 'var(--bg-main)', padding: 40, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.6rem', marginBottom: 32, fontFamily: 'var(--font-serif)', fontWeight: 500, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {bookings.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, paddingRight: 16 }}>
                    <p style={{ margin: '0 0 8px', fontWeight: 500, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                      {b.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.9rem' }}>x{b.qty}</span>
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 300 }}>
                      <Calendar size={14} /> {new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {b.time}
                    </p>
                  </div>
                  <div style={{ fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap', fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>{currency} {Number(b.price) * b.qty}</div>
                </div>
              ))}
            </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 24, fontSize: '1.4rem', color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
            <span>Total</span>
            <span>{currency} {total}</span>
          </div>
          
          <div style={{ marginTop: 32, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 300, lineHeight: 1.6 }}>
            By confirming your booking, you agree to our salon's cancellation and rescheduling policies.
          </div>
        </div>
      </div>
    </div>
  );
}
