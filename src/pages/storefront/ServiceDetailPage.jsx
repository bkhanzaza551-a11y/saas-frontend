import { useState, useEffect } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { api } from "../../api/client";

export default function ServiceDetailPage() {
  const { slug, id } = useParams();
  const { salon, addBooking } = useOutletContext();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Booking State
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/public/salon/${slug}/service/${id}`)
      .then(res => setService(res.data?.service))
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [slug, id]);

  if (loading) return <div style={{ padding: 100, textAlign: "center" }}>Loading service details...</div>;
  if (!service) return <div style={{ padding: 100, textAlign: "center" }}>Service not found.</div>;

  // Generate next 7 days for demo
  const dates = Array.from({length: 8}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      full: d.toISOString().split("T")[0],
      day: d.toLocaleDateString("en-US", { weekday: 'short' }),
      date: d.getDate()
    };
  });

  const times = ["09:00 AM", "10:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];

  const handleBook = () => {
    if (!selectedDate || !selectedTime) return;
    addBooking(service, selectedDate, selectedTime);
    navigate(`/site/${slug}/checkout`);
  };

  return (
    <div className="sf-detail-wrap sf-animate">
      <div className="sf-detail-content">
        <div className="sf-detail-hero">
          <img src={service.imageUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&fit=crop"} alt={service.name} />
        </div>
        <h1 className="sf-detail-title">{service.name}</h1>
        <p style={{ fontSize: "1.2rem", color: "var(--sf-text-muted)", marginBottom: 40, lineHeight: 1.6 }}>
          {service.description || "Experience a premium service tailored to your needs. Our professionals ensure the highest quality of care and attention to detail."}
        </p>

        <div style={{ display: "flex", gap: 40, marginBottom: 40, borderTop: "1px solid var(--sf-border)", borderBottom: "1px solid var(--sf-border)", padding: "24px 0" }}>
          <div>
            <div style={{ fontSize: "0.9rem", color: "var(--sf-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Duration</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 500 }}>{service.durationMin} mins</div>
          </div>
          <div>
            <div style={{ fontSize: "0.9rem", color: "var(--sf-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Price</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 500 }}>{salon.currency} {Number(service.salePrice || service.price).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div>
        <div className="sf-booking-panel">
          <h3>Select a Date & Time</h3>
          
          <div style={{ marginBottom: 16, fontSize: "0.95rem", fontWeight: 500 }}>Choose Date</div>
          <div className="sf-date-grid">
            {dates.map(d => (
              <button 
                key={d.full} 
                className={`sf-date-btn ${selectedDate === d.full ? "active" : ""}`}
                onClick={() => setSelectedDate(d.full)}
              >
                <span>{d.day}</span>
                <span>{d.date}</span>
              </button>
            ))}
          </div>

          {selectedDate && (
            <div className="sf-animate">
              <div style={{ marginBottom: 16, fontSize: "0.95rem", fontWeight: 500, marginTop: 16 }}>Available Times</div>
              <div className="sf-time-grid">
                {times.map(t => (
                  <button 
                    key={t}
                    className={`sf-time-btn ${selectedTime === t ? "active" : ""}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button 
            className="sf-btn-block" 
            style={{ marginTop: 24, opacity: (!selectedDate || !selectedTime) ? 0.5 : 1 }}
            disabled={!selectedDate || !selectedTime}
            onClick={handleBook}
          >
            Confirm & Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
