const fs = require('fs');
let content = fs.readFileSync('src/pages/owner/PosPage.jsx', 'utf8');

// ==== PACKAGE MODAL CARDS ====
// Grid
content = content.replace(/minmax\(280px, 1fr\)\", gap:20/g, 'minmax(220px, 1fr)", gap:12');
// Card Padding
content = content.replace(/borderRadius:12, padding:\"20px\", cursor:\"pointer\"/g, 'borderRadius:12, padding:"14px", cursor:"pointer"');
// Package Name
content = content.replace(/fontSize:\"1\.05rem\", fontWeight:800, color:\"#4a044e\", marginBottom:12/g, 'fontSize:"0.9rem", fontWeight:800, color:"#4a044e", marginBottom:8');
// Separator
content = content.replace(/marginBottom: 12, paddingBottom: 12, borderBottom:/g, 'marginBottom: 8, paddingBottom: 8, borderBottom:');
// Fee & Validity
content = content.replace(/fontSize:\"0\.95rem\", fontWeight:700, color:\"#0f172a\"/g, 'fontSize:"0.85rem", fontWeight:700, color:"#0f172a"');
// Included Services padding
content = content.replace(/background: \"#f8fafc\", padding: \"6px 10px\"/g, 'background: "#f8fafc", padding: "4px 8px"');
// Included Services header
content = content.replace(/fontSize:\"0\.8rem\", fontWeight:700, color:\"#475569\", marginBottom:8/g, 'fontSize:"0.75rem", fontWeight:700, color:"#475569", marginBottom:4');

// CUSTOM Package Card
content = content.replace(/borderRadius:12, padding:20, cursor:\"pointer\", display:\"flex\", flexDirection:\"column\", alignItems:\"center\", justifyContent:\"center\", minHeight:200/g, 'borderRadius:12, padding:14, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:160');
content = content.replace(/width: 48, height: 48, borderRadius: \"50%\", background: pkgModalPkg\?\.id===\"CUSTOM\"\?\"#dbeafe\":\"#e2e8f0\", display: \"flex\", alignItems: \"center\", justifyContent: \"center\", marginBottom: 16, color: pkgModalPkg\?\.id===\"CUSTOM\"\?\"#2563eb\":\"#64748b\", fontSize: \"1\.5rem\"/g, 'width: 36, height: 36, borderRadius: "50%", background: pkgModalPkg?.id==="CUSTOM"?"#dbeafe":"#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, color: pkgModalPkg?.id==="CUSTOM"?"#2563eb":"#64748b", fontSize: "1.2rem"');
content = content.replace(/fontSize:\"1\.05rem\", fontWeight:800, color:pkgModalPkg\?\.id===\"CUSTOM\"\?\"#2563eb\":\"#475569\"/g, 'fontSize:"0.9rem", fontWeight:800, color:pkgModalPkg?.id==="CUSTOM"?"#2563eb":"#475569"');
content = content.replace(/fontSize: \"0\.85rem\", color: \"#64748b\", marginTop: 8, textAlign: \"center\"/g, 'fontSize: "0.75rem", color: "#64748b", marginTop: 4, textAlign: "center"');


// ==== GIFT CARD MODAL CARDS ====
// Grid
content = content.replace(/minmax\(250px, 1fr\)\", gap:16/g, 'minmax(200px, 1fr)", gap:12');
// Card Padding
content = content.replace(/borderRadius:12, padding:16, cursor:\"pointer\"/g, 'borderRadius:12, padding:12, cursor:"pointer"');
// GC Name
content = content.replace(/fontSize:\"0\.95rem\", fontWeight:700, color: \"var\(--accent, #3b82f6\)\", marginBottom:8/g, 'fontSize:"0.85rem", fontWeight:700, color: "var(--accent, #3b82f6)", marginBottom:4');
// GC Description
content = content.replace(/fontSize:\"0\.85rem\", color:\"#475569\", marginBottom:4/g, 'fontSize:"0.75rem", color:"#475569", marginBottom:2');

// CUSTOM GC Card
content = content.replace(/padding:16, cursor:\"pointer\", display:\"flex\", flexDirection:\"column\", alignItems:\"center\", justifyContent:\"center\", minHeight:140/g, 'padding:12, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:100');
content = content.replace(/width: 40, height: 40/g, 'width: 32, height: 32');
content = content.replace(/marginBottom: 12, color: gcModalGc\?\.id===\"CUSTOM\"\?\"#e879f9\":\"#64748b\", fontSize: \"1\.5rem\"/g, 'marginBottom: 8, color: gcModalGc?.id==="CUSTOM"?"#e879f9":"#64748b", fontSize: "1.2rem"');
content = content.replace(/fontSize:\"0\.95rem\", fontWeight:800/g, 'fontSize:"0.85rem", fontWeight:800');


// ==== MEMBERSHIP MODAL CARDS ====
// Grid (Wait, the grid for Membership was minmax(250px, 1fr), gap:16, let's use global replace from GC, but GC used different regex for grid, let's just do it directly)
// Note: minmax(250px, 1fr)", gap:16 is already replaced above if it matches exactly, but let's make sure.
content = content.replace(/minmax\(250px, 1fr\)\", gap:16, maxHeight:300/g, 'minmax(200px, 1fr)", gap:12, maxHeight:300');

// Card padding
content = content.replace(/borderRadius: 16,\s*padding: 20,\s*cursor: \"pointer\"/g, 'borderRadius: 12, padding: 14, cursor: "pointer"');
// Membership name
content = content.replace(/fontSize: \"1\.05rem\", fontWeight: 800, color: isSelected \? \"#1e40af\" : \"#0f172a\", textTransform: \"uppercase\"/g, 'fontSize: "0.9rem", fontWeight: 800, color: isSelected ? "#1e40af" : "#0f172a", textTransform: "uppercase"');
// Deal text
content = content.replace(/fontSize: \"0\.85rem\", color: \"#64748b\", fontWeight: 500, lineHeight: \"1\.4\"/g, 'fontSize: "0.75rem", color: "#64748b", fontWeight: 500, lineHeight: "1.3"');
content = content.replace(/paddingTop: 8 \}\}\s*>\s*<span style=\{\{ fontSize: \"0\.85rem\"/g, 'paddingTop: 8 }}> <span style={{ fontSize: "0.75rem"');


fs.writeFileSync('src/pages/owner/PosPage.jsx', content);
console.log('Cards resized!');
