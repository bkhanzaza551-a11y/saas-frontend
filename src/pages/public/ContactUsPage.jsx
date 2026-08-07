import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Briefcase } from "lucide-react";

export default function ContactUsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Poppins', sans-serif", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <header style={{ padding: "20px 24px", background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #0d9488, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>R</div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Salon Nest</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link to="/" style={{ textDecoration: "none", fontSize: 14, fontWeight: 600, color: "#64748b" }}>Home</Link>
            <Link to="/book-demo" style={{ textDecoration: "none", fontSize: 14, fontWeight: 700, color: "#fff", background: "#0f172a", padding: "10px 24px", borderRadius: 100 }}>Book Demo</Link>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main style={{ flex: 1, padding: "60px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px 0", textAlign: "center" }}>Contact Us</h1>
          <p style={{ fontSize: "1.1rem", color: "#64748b", margin: "0 0 40px 0", textAlign: "center" }}>We'd love to hear from you. Get in touch with us for any queries or support.</p>
          
          <div style={{ background: "#fff", borderRadius: 16, padding: 40, border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0 0 24px 0", borderBottom: "1px solid #f1f5f9", paddingBottom: 16 }}>Company Details</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a", flexShrink: 0 }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Company Name</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>PROPCORP ADVERTISING (OPC) PRIVATE LIMITED</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a", flexShrink: 0 }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Address</div>
                  <div style={{ fontSize: 16, color: "#334155", lineHeight: 1.5 }}>
                    PLOT NO G-49 MADHURA NAGAR ,<br/>
                    HYDERABAD, Telangana,<br/>
                    India - 500003
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a", flexShrink: 0 }}>
                  <Phone size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Phone</div>
                  <div style={{ fontSize: 16, color: "#334155" }}><a href="tel:9493952587" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>9493952587</a></div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a", flexShrink: 0 }}>
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Email</div>
                  <div style={{ fontSize: 16, color: "#334155" }}><a href="mailto:govardhan@salonnest.in" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>govardhan@salonnest.in</a></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ padding: "40px 24px", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #0d9488, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>R</div>
              <span style={{ fontWeight: 700, color: "#0f172a" }}>Salon Nest</span>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <Link to="/features" style={{ textDecoration: "none", fontSize: 14, color: "#64748b" }}>Features</Link>
              <Link to="/pricing" style={{ textDecoration: "none", fontSize: 14, color: "#64748b" }}>Pricing</Link>
              <Link to="/platform" style={{ textDecoration: "none", fontSize: 14, color: "#64748b" }}>Platform</Link>
              <Link to="/terms" style={{ textDecoration: "none", fontSize: 14, color: "#64748b" }}>Terms</Link>
              <Link to="/privacy-policy" style={{ textDecoration: "none", fontSize: 14, color: "#64748b" }}>Privacy</Link>
              <Link to="/contact" style={{ textDecoration: "none", fontSize: 14, color: "#64748b" }}>Contact Us</Link>
            </div>
          </div>
          
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
              <strong>PROPCORP ADVERTISING (OPC) PRIVATE LIMITED</strong><br/>
              PLOT NO G-49 MADHURA NAGAR , HYDERABAD, Telangana, India - 500003<br/>
              Ph: 9493952587 | Email: <a href="mailto:govardhan@salonnest.in" style={{color: "#3b82f6", textDecoration: "none"}}>govardhan@salonnest.in</a>
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              © {new Date().getFullYear()} PROPCORP ADVERTISING (OPC) PRIVATE LIMITED. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
