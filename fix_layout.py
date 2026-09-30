import re

with open('src/pages/owner/EnquiriesPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('{mode === "detail" && (')

open_brackets = 0
end_idx = -1
for i in range(start_idx, len(content)):
    if content[i] == '{':
        open_brackets += 1
    elif content[i] == '}':
        open_brackets -= 1
        if open_brackets == 0:
            end_idx = i + 1
            break

new_layout = """{mode === "detail" && (
        <div className="anim-fade">
          {detailLoading || !detailData ? (
            <PageLoader title="Loading Enquiry Details" message="Fetching customer follow-up history and details..." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* 1. TOP HERO CARD: Enquiry Details & Specs */}
              <div className="eq-card" style={{ padding: "24px 28px", border: "1px solid #e2e8f0", background: "linear-gradient(to right, #ffffff, #f8fafc)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  
                  {/* Left: Avatar + Name + Status + Contacts */}
                  <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "16px", background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: 800, flexShrink: 0, boxShadow: "0 4px 10px rgba(15, 23, 42, 0.15)" }}>
                      {(detailData.name || "E").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                          {detailData.name}
                        </h2>
                        <span className="status-pill" style={{ background: getStatusColor(detailData.status).bg, color: getStatusColor(detailData.status).text, fontWeight: 800, padding: "4px 12px", fontSize: "11px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                          {mapStatusToUi(detailData.status)}
                        </span>
                        <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: "11px", fontWeight: 800, background: getPriorityColor(detailData.priority).bg, color: getPriorityColor(detailData.priority).text, textTransform: "uppercase", letterSpacing: "0.5px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                          {detailData.priority} Priority
                        </span>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 10, fontSize: "13px", color: "#64748b" }}>
                        <a 
                          href={`tel:${detailData.phone}`} 
                          style={{ textDecoration: "none", color: "#0f172a", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, background: "#f1f5f9", padding: "4px 10px", borderRadius: 8, transition: "all 0.2s" }}
                        >
                          <Phone size={14} color="#0f172a" /> {detailData.phone}
                        </a>
                        <a 
                          href={`https://wa.me/${detailData.phone?.replace(/[^0-9]/g, "")}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ textDecoration: "none", color: "#166534", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", padding: "4px 10px", borderRadius: 8, border: "1px solid #bbf7d0", transition: "all 0.2s" }}
                        >
                          <MessageCircle size={14} color="#16a34a" /> WhatsApp
                        </a>
                        {detailData.email && (
                          <a 
                            href={`mailto:${detailData.email}`}
                            style={{ textDecoration: "none", color: "#475569", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}
                          >
                            <Mail size={14} color="#64748b" /> {detailData.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Next Follow-Up Highlight */}
                  {detailData.followUpDate && (
                    <div style={{ background: "#eff6ff", padding: "12px 18px", borderRadius: 12, border: "1px solid #bfdbfe", minWidth: 180, display: "flex", alignItems: "center", gap: 12 }}>
                       <div style={{ background: "#dbeafe", padding: 10, borderRadius: "50%" }}>
                         <CalendarClock size={20} color="#2563eb" />
                       </div>
                       <div>
                         <div style={{ fontSize: "11px", fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.5px" }}>Next Follow-Up</div>
                         <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e40af", marginTop: 2 }}>
                           {new Date(detailData.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                         </div>
                       </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                  <div className="spec-item" style={{ background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                    <div className="spec-label"><LayoutGrid size={14}/> Enquiry Type</div>
                    <div className="spec-value">{detailData.type || "Walk In"}</div>
                  </div>
                  <div className="spec-item" style={{ background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                    <div className="spec-label"><Filter size={14}/> Lead Source</div>
                    <div className="spec-value">{detailData.source || "-"}</div>
                  </div>
                  <div className="spec-item" style={{ background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                    <div className="spec-label"><MapPin size={14}/> Branch</div>
                    <div className="spec-value">{detailData.branch?.name || "Global"}</div>
                  </div>
                  <div className="spec-item" style={{ background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                    <div className="spec-label"><User size={14}/> Assigned To</div>
                    <div className="spec-value">{detailData.assignedToStaff?.user?.name || "Unassigned"}</div>
                  </div>
                </div>

                {detailData.remark && (
                  <div style={{ marginTop: 16, background: "#f8fafc", padding: "14px 18px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <AlignLeft size={13} /> Original Enquiry Remarks
                    </div>
                    <div style={{ fontSize: "13.5px", color: "#334155", lineHeight: 1.5, fontWeight: 500 }}>
                      {detailData.remark}
                    </div>
                  </div>
                )}
              </div>

              {/* TWO COLUMN GRID FOR INTERACTION */}
              <div style={{ display: "grid", gridTemplateColumns: "4.5fr 5.5fr", gap: 24, alignItems: "start" }} className="eq-detail-grid">
                
                {/* 2. Follow-Up Recorder Box (Left Column) */}
                <div className="eq-card" style={{ position: "sticky", top: 20 }}>
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                      <Plus size={18} color="#2563eb" /> Log New Follow-Up
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
                      Record customer response, discussions, and update next reminder schedule.
                    </p>
                  </div>

                  <form onSubmit={handleAddFollowUpDetail}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      
                      {/* Quick Note Suggestions */}
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                          <Zap size={14} color="#f59e0b" /> Quick Templates:
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {[
                            "Spoke with client - very interested",
                            "Price quote shared - awaiting response",
                            "Call not answered / busy",
                            "Requested callback next week",
                            "Appointment booked / visiting salon"
                          ].map(text => (
                            <button
                              key={text}
                              type="button"
                              className="quick-chip-btn"
                              onClick={() => setDetailFollowUpNote(prev => prev ? `${prev} | ${text}` : text)}
                            >
                              + {text}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="eq-label">Follow-up Conversation Notes / Remarks *</label>
                        <textarea
                          className="eq-input"
                          required
                          rows={4}
                          placeholder="Detail customer's response, preferences, price quote offered, objections discussed..."
                          value={detailFollowUpNote}
                          onChange={(e) => setDetailFollowUpNote(e.target.value)}
                          style={{ height: 110, padding: "14px 16px", lineHeight: 1.5, borderRadius: 10, resize: "vertical" }}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                          <label className="eq-label">Update Status</label>
                          <CustomSelect
                            className="eq-input"
                            value={detailFollowUpStatus}
                            onChange={(e) => setDetailFollowUpStatus(e.target.value)}
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </CustomSelect>
                        </div>

                        <div>
                          <label className="eq-label">Next Reminder Date</label>
                          <input
                            type="date"
                            className="eq-input"
                            value={detailFollowUpDate}
                            onChange={(e) => setDetailFollowUpDate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                        <button
                          type="submit"
                          disabled={savingFollowUp || !detailFollowUpNote.trim()}
                          className="eq-btn"
                          style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#ffffff", height: 44, padding: "0 24px", fontWeight: 600, borderRadius: 10, boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -2px rgba(37, 99, 235, 0.1)", fontSize: "14px", border: "none", width: "100%" }}
                        >
                          <Send size={16} style={{ marginRight: 4 }}/> {savingFollowUp ? "Recording..." : "Record Follow-Up"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* 3. Previous Follow-Ups Timeline (Right Column) */}
                <div className="eq-card" style={{ background: "#f8fafc", border: "1px dashed #cbd5e1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                      <History size={18} color="#0f172a" /> Follow-Up History & Timeline
                    </h3>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a", background: "#e2e8f0", padding: "4px 12px", borderRadius: 100, border: "1px solid #cbd5e1" }}>
                      {detailData.followUps?.length || 0} Records
                    </span>
                  </div>

                  {!detailData.followUps || detailData.followUps.length === 0 ? (
                    <div style={{ padding: "50px 20px", textAlign: "center", background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                      <div style={{ background: "#f1f5f9", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                        <MessageSquare size={28} color="#94a3b8" />
                      </div>
                      <div style={{ fontWeight: 800, color: "#334155", fontSize: "15px" }}>No Follow-Ups Recorded Yet</div>
                      <div style={{ fontSize: "13px", color: "#64748b", marginTop: 6, maxWidth: 250, margin: "6px auto 0" }}>Record the first conversation note on the left to begin client interaction tracking.</div>
                    </div>
                  ) : (
                    <div className="timeline-container">
                      {detailData.followUps.map((item, idx) => (
                        <div key={item.id || idx} className="timeline-item">
                          <div className={`timeline-dot ${item.status ? 'status-change' : ''}`} />
                          <div className="timeline-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#475569" }}>
                                  {(item.actorMembership?.user?.name || "S").charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 800, fontSize: "13.5px", color: "#0f172a" }}>
                                  {item.actorMembership?.user?.name || "Staff Member"}
                                </span>
                                {item.status && (
                                  <span className="status-pill" style={{ background: getStatusColor(item.status).bg, color: getStatusColor(item.status).text, fontSize: "10px", padding: "2px 8px" }}>
                                    {mapStatusToUi(item.status)}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                <Clock size={12}/> {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>

                            <div style={{ fontSize: "14px", color: "#334155", lineHeight: 1.6, fontWeight: 500, background: "#f8fafc", padding: "12px 14px", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                              {item.note}
                            </div>

                            {item.dueAt && (
                              <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, fontSize: "12px", fontWeight: 700, color: "#0f172a", background: "#f1f5f9", padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                                <CalendarClock size={14} color="#64748b" /> Reminder: {new Date(item.dueAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      )}"""

content = content[:start_idx] + new_layout + content[end_idx:]

css_add = """        @media (max-width: 900px) {
          .eq-detail-grid { grid-template-columns: 1fr !important; }
        }
"""
content = content.replace("</style>", css_add + "      </style>")

with open('src/pages/owner/EnquiriesPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
