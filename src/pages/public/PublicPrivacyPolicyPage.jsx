import React from "react";
import { Link } from "react-router-dom";

export default function PublicPrivacyPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src="/logo.jfif" alt="Salon Nest Logo" style={{ maxHeight: "42px", maxWidth: "160px", objectFit: "contain" }} />
          </Link>
          <Link to="/" style={{ textDecoration: "none", color: "#64748b", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%)", padding: "80px 24px 100px", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", padding: "6px 16px", borderRadius: 100, fontSize: "0.85rem", fontWeight: 600, color: "#0369a1", marginBottom: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <span>🔒</span> Legal & Compliance
        </div>
        <h1 style={{ fontSize: "3.5rem", fontWeight: 900, color: "#0f172a", margin: "0 0 20px", letterSpacing: "-0.04em" }}>Privacy Policy</h1>
        <p style={{ color: "#475569", fontSize: "1.2rem", margin: "0 auto", maxWidth: 600, lineHeight: 1.6 }}>
          We value your privacy and are committed to protecting your personal information. Here is how we handle your data.
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "-60px auto 80px", padding: "56px 72px", background: "white", borderRadius: 24, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)", border: "1px solid rgba(226,232,240,0.8)", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 24, borderBottom: "1px solid #f1f5f9", marginBottom: 40 }}>
          <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0 }}><strong>Effective Date:</strong> 06 August 2026</p>
          <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0 }}><strong>Last Updated:</strong> 06 August 2026</p>
        </div>

        <div style={{ color: "#334155", lineHeight: 1.9, fontSize: "1.05rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>1. Introduction</h2>
          <p style={{ marginBottom: 16 }}>Welcome to Salon Nest ("Salon Nest", "we", "our", or "us"), a SaaS platform owned and operated by PROPCORP ADVERTISING (OPC) PRIVATE LIMITED.</p>
          <p style={{ marginBottom: 16 }}>We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, disclose, and protect your information when you use our website, applications, and services available through https://salonnest.in.</p>
          <p style={{ marginBottom: 16 }}>By accessing or using Salon Nest, you agree to the practices described in this Privacy Policy.</p>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>2. Company Information</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}>
            <li style={{ marginBottom: 8 }}><strong>Company Name:</strong> PROPCORP ADVERTISING (OPC) PRIVATE LIMITED</li>
            <li style={{ marginBottom: 8 }}><strong>Website:</strong> <a href="https://salonnest.in" style={{ color: "#3b82f6", textDecoration: "none" }}>https://salonnest.in</a></li>
            <li style={{ marginBottom: 8 }}><strong>Registered Address:</strong> PLOT NO G-49, Madhura Nagar, Hyderabad, Telangana, India – 500003</li>
            <li style={{ marginBottom: 8 }}><strong>Email:</strong> <a href="mailto:support@salonnest.in" style={{ color: "#3b82f6", textDecoration: "none" }}>support@salonnest.in</a></li>
          </ul>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>3. Scope</h2>
          <p style={{ marginBottom: 12 }}>This Privacy Policy applies to:</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            <li>Our website</li>
            <li>Web application</li>
            <li>Mobile applications (if applicable)</li>
            <li>Customer support</li>
            <li>Marketing communications</li>
            <li>Trial accounts</li>
            <li>Subscription services</li>
          </ul>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>4. Information We Collect</h2>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1e293b", margin: "20px 0 8px" }}>Information You Provide</h3>
          <p style={{ marginBottom: 12 }}>Depending on how you use Salon Nest, we may collect:</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            <li>Full name</li>
            <li>Email address</li>
            <li>Mobile number</li>
            <li>Business or salon name</li>
            <li>Business address</li>
            <li>Billing details</li>
            <li>GST information (where applicable)</li>
            <li>Profile information</li>
            <li>Subscription details</li>
            <li>Any information you voluntarily submit while using our platform</li>
          </ul>
          
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1e293b", margin: "20px 0 8px" }}>Customer Business Data</h3>
          <p style={{ marginBottom: 12 }}>Our platform allows customers to manage business operations. Information stored may include:</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            <li>Customer records</li>
            <li>Appointments</li>
            <li>Staff information</li>
            <li>Services and Products</li>
            <li>Sales records and Invoices</li>
            <li>Payment history</li>
            <li>Business reports</li>
            <li>Loyalty program information</li>
            <li>Marketing campaign data</li>
            <li>AI-generated content and prompts submitted by users</li>
          </ul>

          <p style={{ marginBottom: 12 }}>We do not intentionally collect:</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            <li>Medical records</li>
            <li>Uploaded documents</li>
            <li>Video files</li>
            <li>Chat conversations</li>
            <li>General file storage unrelated to the service</li>
          </ul>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>5. Automatically Collected Information</h2>
          <p style={{ marginBottom: 12 }}>When you access our platform, we may automatically collect:</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            <li>IP address</li>
            <li>Browser type</li>
            <li>Device information</li>
            <li>Operating system</li>
            <li>Session information</li>
            <li>Usage statistics</li>
            <li>Log data and Crash reports</li>
            <li>Pages visited</li>
            <li>Date and time of access</li>
            <li>Referring website</li>
          </ul>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>6. Cookies and Similar Technologies</h2>
          <p style={{ marginBottom: 12 }}>We use cookies and similar technologies to:</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            <li>Keep you signed in</li>
            <li>Remember preferences</li>
            <li>Improve website performance</li>
            <li>Measure usage analytics</li>
            <li>Enhance security</li>
            <li>Deliver personalized experiences</li>
            <li>Support marketing and remarketing activities</li>
          </ul>
          <p style={{ marginBottom: 16 }}>Users may control cookie settings through their browser, although disabling certain cookies may affect functionality.</p>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>7. How We Use Your Information</h2>
          <p style={{ marginBottom: 12 }}>We use your information to:</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            <li>Create and manage your account</li>
            <li>Deliver our SaaS services</li>
            <li>Process subscriptions and payments</li>
            <li>Provide customer support</li>
            <li>Improve platform functionality</li>
            <li>Analyze product usage and Develop new features</li>
            <li>Power AI-assisted features</li>
            <li>Send transactional emails, WhatsApp notifications, and SMS communications</li>
            <li>Send marketing communications where permitted</li>
            <li>Detect fraud and abuse</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>8. AI Features</h2>
          <p style={{ marginBottom: 16 }}>Salon Nest includes AI-powered functionality to assist users. Information submitted to AI features may be processed to generate responses or automate workflows. We do not use customer data to train our own AI models unless expressly disclosed and permitted. Users should avoid submitting confidential or highly sensitive personal information into AI prompts unless necessary for the intended service.</p>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>9. Payment Information</h2>
          <p style={{ marginBottom: 16 }}>Payments are processed through trusted third-party payment providers, including Razorpay. Salon Nest does not store your complete debit card, credit card, or banking credentials. Payment information is processed directly by the payment provider in accordance with its privacy and security practices.</p>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>10. Third-Party Services</h2>
          <p style={{ marginBottom: 12 }}>To operate and improve our services, we may use trusted third-party providers, including:</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            <li>Google Analytics 4</li>
            <li>Google Tag Manager</li>
            <li>Microsoft Clarity</li>
            <li>Amazon Web Services (AWS)</li>
            <li>Railway</li>
            <li>Google Cloud services / Microsoft Azure services (where applicable)</li>
            <li>Zoho</li>
            <li>WhatsApp Business API</li>
            <li>Other infrastructure, communication, analytics, and support providers as required</li>
          </ul>
          <p style={{ marginBottom: 16 }}>These providers may process information on our behalf solely to provide their respective services.</p>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>11. Sharing of Information</h2>
          <p style={{ marginBottom: 12 }}>We do not sell your personal information. We may share information with:</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            <li>Payment processors and Cloud hosting providers</li>
            <li>Analytics and Communication service providers</li>
            <li>Customer support platforms</li>
            <li>Government authorities when legally required</li>
            <li>Professional advisers</li>
            <li>Successors in the event of a merger, acquisition, restructuring, or sale of assets</li>
          </ul>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>12. Data Retention</h2>
          <p style={{ marginBottom: 16 }}>We retain your information only for as long as necessary to provide our services and comply with legal obligations. Unless otherwise required by law: Customer account information may be retained while your account remains active. After account closure, data may be retained for up to 90 days before deletion or anonymization, subject to backup and legal requirements.</p>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>13. Security</h2>
          <p style={{ marginBottom: 12 }}>We implement reasonable technical and organizational safeguards, including:</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            <li>SSL/TLS encryption</li>
            <li>Secure cloud infrastructure</li>
            <li>Access controls and Authentication mechanisms</li>
            <li>Regular monitoring and Security updates</li>
          </ul>
          <p style={{ marginBottom: 16 }}>While we strive to protect your information, no system can guarantee absolute security.</p>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>14. Your Rights</h2>
          <p style={{ marginBottom: 12 }}>Subject to applicable law, you may:</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            <li>Access, correct, or update your information</li>
            <li>Delete your account or request deletion of personal data</li>
            <li>Export your available data</li>
            <li>Withdraw consent where applicable</li>
          </ul>
          <p style={{ marginBottom: 16 }}>Contact us regarding privacy concerns at <a href="mailto:support@salonnest.in" style={{ color: "#3b82f6", textDecoration: "none" }}>support@salonnest.in</a>.</p>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>15. Children's Privacy</h2>
          <p style={{ marginBottom: 16 }}>Salon Nest is designed for business users and is not intended for children under the age of 18. We do not knowingly collect personal information from children. If we become aware that such information has been collected, we will take reasonable steps to delete it.</p>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>16. Business Transfers</h2>
          <p style={{ marginBottom: 16 }}>If Salon Nest or PROPCORP ADVERTISING (OPC) PRIVATE LIMITED undergoes a merger, acquisition, restructuring, financing, or sale of assets, user information may be transferred as part of that transaction, subject to applicable privacy obligations.</p>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>17. Legal Compliance</h2>
          <p style={{ marginBottom: 16 }}>We comply with applicable Indian laws relating to privacy and data protection, including the Digital Personal Data Protection Act, 2023 (DPDP Act), where applicable. If legal obligations require us to disclose information, we may do so in accordance with applicable law.</p>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>18. Third-Party Links</h2>
          <p style={{ marginBottom: 16 }}>Our website or platform may contain links to third-party websites or services. We are not responsible for their privacy practices or content. Users should review the privacy policies of those third parties before providing personal information.</p>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>19. Changes to This Privacy Policy</h2>
          <p style={{ marginBottom: 16 }}>We may update this Privacy Policy from time to time. Any changes will be posted on this page with a revised "Last Updated" date. Continued use of Salon Nest after changes become effective constitutes acceptance of the updated Privacy Policy.</p>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "32px 0 12px" }}>20. Contact Us</h2>
          <p style={{ marginBottom: 16 }}>
            If you have questions, requests, or concerns regarding this Privacy Policy or your personal information, please contact us:<br/><br/>
            <strong>PROPCORP ADVERTISING (OPC) PRIVATE LIMITED</strong><br/>
            PLOT NO G-49, Madhura Nagar, Hyderabad, Telangana, India – 500003<br/>
            Email: <a href="mailto:support@salonnest.in" style={{ color: "#3b82f6", textDecoration: "none" }}>support@salonnest.in</a><br/>
            Website: <a href="https://salonnest.in" style={{ color: "#3b82f6", textDecoration: "none" }}>https://salonnest.in</a>
          </p>
        </div>
      </div>

      {/* Footer */}
      {/* Footer */}
      <footer style={{ padding: "40px 24px", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #0d9488, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>S</div>
              <span style={{ fontWeight: 700, color: "#0f172a" }}>Salon Nest</span>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
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
              <strong style={{ color: "#0f172a" }}>PROPCORP ADVERTISING (OPC) PRIVATE LIMITED</strong><br/>
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
