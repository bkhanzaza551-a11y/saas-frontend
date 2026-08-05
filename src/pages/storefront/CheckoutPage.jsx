import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { api } from "../../api/client";

export default function CheckoutPage() {
  const { salon, bookings } = useOutletContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: ""
  });

  const cartTotal = bookings.reduce((sum, b) => sum + (Number(b.price) * b.qty), 0);

  if (bookings.length === 0) {
    return (
      <div style={{ padding: 120, textAlign: "center" }}>
        <h2>Your cart is empty</h2>
        <p style={{ color: "var(--sf-text-muted)", marginTop: 16 }}>Please select a service to book.</p>
        <button className="sf-btn-dark" style={{ marginTop: 24 }} onClick={() => navigate(`/site/${salon.slug}/services`)}>Browse Services</button>
      </div>
    );
  }

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.phone) {
      setError("Please fill in all required fields.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // In a real scenario we would post the booking to the backend.
      // For this dynamic demo, we'll simulate a success and clear cart.
      await new Promise(r => setTimeout(r, 1000));
      localStorage.removeItem("sf_bookings");
      navigate(`/site/${salon.slug}/booking-confirmation`, { state: { success: true } });
      window.location.reload(); // Reload to clear outlet state for demo
    } catch (err) {
      setError("Failed to process booking. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="sf-detail-wrap sf-animate" style={{ gridTemplateColumns: "1fr 400px", margin: "80px auto" }}>
      <div>
        <h1 style={{ fontSize: "2.5rem", marginBottom: 40 }}>Complete Your Booking</h1>
        
        {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 16, borderRadius: 8, marginBottom: 24 }}>{error}</div>}

        <form onSubmit={handleConfirm} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>First Name *</label>
              <input 
                type="text" 
                value={formData.firstName} 
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                style={{ width: "100%", padding: 16, borderRadius: 8, border: "1px solid var(--sf-border)", fontSize: "1rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Last Name</label>
              <input 
                type="text" 
                value={formData.lastName} 
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                style={{ width: "100%", padding: 16, borderRadius: 8, border: "1px solid var(--sf-border)", fontSize: "1rem" }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Email Address *</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})}
              style={{ width: "100%", padding: 16, borderRadius: 8, border: "1px solid var(--sf-border)", fontSize: "1rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Phone Number *</label>
            <input 
              type="tel" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})}
              style={{ width: "100%", padding: 16, borderRadius: 8, border: "1px solid var(--sf-border)", fontSize: "1rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Special Requests (Optional)</label>
            <textarea 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              rows={4}
              style={{ width: "100%", padding: 16, borderRadius: 8, border: "1px solid var(--sf-border)", fontSize: "1rem", fontFamily: "inherit" }}
            />
          </div>
        </form>
      </div>

      <div>
        <div className="sf-booking-panel">
          <h3>Order Summary</h3>
          <div style={{ marginTop: 24, marginBottom: 24 }}>
            {bookings.map((b, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--sf-border)" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: "1.1rem", marginBottom: 4 }}>{b.name}</div>
                  <div style={{ fontSize: "0.9rem", color: "var(--sf-text-muted)" }}>{new Date(b.date).toLocaleDateString()} at {b.time}</div>
                </div>
                <div style={{ fontWeight: 500 }}>{salon.currency} {Number(b.price).toLocaleString()}</div>
              </div>
            ))}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 600, marginBottom: 32 }}>
            <span>Total to Pay</span>
            <span>{salon.currency} {cartTotal.toLocaleString()}</span>
          </div>

          <button 
            className="sf-btn-block" 
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : "Confirm Booking"}
          </button>
          
          <p style={{ fontSize: "0.85rem", color: "var(--sf-text-muted)", textAlign: "center", marginTop: 16 }}>
            Payment will be collected at the salon. By confirming, you agree to our booking policies.
          </p>
        </div>
      </div>
    </div>
  );
}
