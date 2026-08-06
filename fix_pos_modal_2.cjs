const fs = require('fs');
let content = fs.readFileSync('src/pages/owner/PosPage.jsx', 'utf8');

// Replace padding:"12px 16px" with padding:"8px 12px" globally
content = content.replace(/padding:\s*["']12px 16px["']/g, 'padding:"8px 12px"');

// Reduce font sizes for those fields from 1rem or 0.95rem to 0.85rem
content = content.replace(/padding:"8px 12px",(.*?)fontSize:"0.95rem"/g, 'padding:"8px 12px",$1fontSize:"0.85rem"');
content = content.replace(/padding:"8px 12px",(.*?)fontSize:"1rem"/g, 'padding:"8px 12px",$1fontSize:"0.85rem"');

// Fix close buttons styles across all modals to be consistent and not tiny
// Search for `background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#94a3b8"` and replace with `background:"#f1f5f9", border:"none", width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#64748b", transition:"background 0.2s"`
content = content.replace(/background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#94a3b8"/g, 'background:"#f1f5f9", border:"none", width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#64748b", transition:"background 0.2s"');

// Wait, the close button hover effects in inline styles are missing. Let's add them.
// We already have `onMouseEnter={e => e.currentTarget.style.background="#e2e8f0"} onMouseLeave={e => e.currentTarget.style.background="#f1f5f9"}` in the package modal close button, let's inject it into the other close buttons if they don't have it.
content = content.replace(/<button onClick=\{\(\) => setShowGcModal\(false\)\} style=\{\{ background:"#f1f5f9"/g, '<button onClick={() => setShowGcModal(false)} onMouseEnter={e => e.currentTarget.style.background="#e2e8f0"} onMouseLeave={e => e.currentTarget.style.background="#f1f5f9"} style={{ background:"#f1f5f9"');
content = content.replace(/<button onClick=\{\(\) => setShowMemModal\(false\)\} style=\{\{ background:"#f1f5f9"/g, '<button onClick={() => setShowMemModal(false)} onMouseEnter={e => e.currentTarget.style.background="#e2e8f0"} onMouseLeave={e => e.currentTarget.style.background="#f1f5f9"} style={{ background:"#f1f5f9"');


// Update other "Cancel" and "Confirm" buttons globally to be smaller (like in Package Modal)
// For Gift Card modal
content = content.replace(/padding:"10px 24px", background:"#fff", border:"1px solid #cbd5e1", borderRadius:8, fontWeight:700, cursor:"pointer", color:"#475569"/g, 'padding:"8px 20px", background:"#fff", border:"1px solid #cbd5e1", borderRadius:6, fontWeight:600, cursor:"pointer", color:"#475569", fontSize:"0.85rem"');
content = content.replace(/padding:"10px 24px", background:"#2563eb", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:\(gcModalGc && gcDraft.staffId && !submittingGc\)\?"pointer":"not-allowed", opacity:\(gcModalGc && gcDraft.staffId && !submittingGc\)\?1:0.6/g, 'padding:"8px 20px", background:"#2563eb", color:"#fff", border:"none", borderRadius:6, fontWeight:600, cursor:(gcModalGc && gcDraft.staffId && !submittingGc)?"pointer":"not-allowed", opacity:(gcModalGc && gcDraft.staffId && !submittingGc)?1:0.6, fontSize:"0.85rem"');

// For Membership modal
content = content.replace(/padding:"12px 28px", background:"#fff", border:"1px solid #cbd5e1", borderRadius:8, fontWeight:700, cursor:"pointer", color:"#475569", fontSize: "0.95rem"/g, 'padding:"8px 20px", background:"#fff", border:"1px solid #cbd5e1", borderRadius:6, fontWeight:600, cursor:"pointer", color:"#475569", fontSize: "0.85rem"');
content = content.replace(/padding:"12px 28px", background:"#8b5cf6", color:"#fff", border:"none", borderRadius:8, fontWeight:800, cursor:\(memDraftCanSubmit && !submittingMem\)\?"pointer":"not-allowed", opacity:\(memDraftCanSubmit && !submittingMem\)\?1:0.6, fontSize: "0.95rem"/g, 'padding:"8px 20px", background:"#8b5cf6", color:"#fff", border:"none", borderRadius:6, fontWeight:700, cursor:(memDraftCanSubmit && !submittingMem)?"pointer":"not-allowed", opacity:(memDraftCanSubmit && !submittingMem)?1:0.6, fontSize: "0.85rem"');


fs.writeFileSync('src/pages/owner/PosPage.jsx', content);
console.log('Fixed padding and font sizes.');
