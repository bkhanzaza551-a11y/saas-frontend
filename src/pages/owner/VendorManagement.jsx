import { useEffect, useMemo, useState } from "react";
import { Search, Plus, ChevronLeft, Save, Trash2, MapPin, Building, User, Phone, Mail, FileText, CheckCircle2 } from "lucide-react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";

const INDIAN_CITIES = [
  "Agra", "Ahmedabad", "Ajmer", "Akola", "Aligarh", "Allahabad (Prayagraj)", "Alwar", "Ambala", "Amravati", "Amritsar", "Anantapur", "Asansol", "Aurangabad", "Bareilly", "Belgaum", "Bengaluru (Bangalore)", "Bhagalpur", "Bharatpur", "Bhilai", "Bhilwara", "Bhimavaram", "Bhopal", "Bhubaneswar", "Bikaner", "Bilaspur", "Bokaro", "Chandigarh", "Chennai", "Coimbatore", "Cuttack", "Darbhanga", "Davangere", "Dehradun", "Delhi", "Dhanbad", "Dhule", "Dibrugarh", "Durgapur", "Eluru", "Erode", "Faridabad", "Firozabad", "Gandhinagar", "Gaya", "Ghaziabad", "Gorakhpur", "Guntur", "Gurugram (Gurgaon)", "Guwahati", "Gwalior", "Haldwani", "Haridwar", "Hisar", "Hubli-Dharwad", "Hyderabad", "Imphal", "Indore", "Jabalpur", "Jaipur", "Jalandhar", "Jalgaon", "Jammu", "Jamnagar", "Jamshedpur", "Jhansi", "Jodhpur", "Kakinada", "Kanpur", "Karimnagar", "Karnal", "Kochi (Cochin)", "Kolhapur", "Kolkata", "Kollam", "Kota", "Kozhikode", "Kurnool", "Latur", "Lucknow", "Ludhiana", "Madurai", "Malegaon", "Mangaluru", "Mathura", "Meerut", "Moradabad", "Mumbai", "Muzaffarnagar", "Muzaffarpur", "Mysuru (Mysore)", "Nagercoil", "Nagpur", "Nanded", "Nashik", "Navi Mumbai", "Nellore", "Noida", "Panaji (Panjim)", "Panihat", "Panipat", "Pathankot", "Patiala", "Patna", "Puducherry", "Pune", "Raipur", "Rajahmundry", "Rajkot", "Ranchi", "Rohtak", "Rourkela", "Salem", "Sangli", "Satara", "Saharanpur", "Shillong", "Shimla", "Siliguri", "Solapur", "Srinagar", "Surat", "Thane", "Thiruvananthapuram", "Thrissur", "Tiruchirappalli", "Tirunelveli", "Tirupati", "Tirupur", "Udaipur", "Ujjain", "Vadodara", "Varanasi", "Vasai-Virar", "Vijayawada", "Visakhapatnam", "Warangal"
];

const emptyVendor = {
  name: "",
  firmName: "",
  phone: "",
  alternateMobile: "",
  email: "",
  gstNumber: "",
  address: "",
  area: "",
  landmark: "",
  city: "",
  pincode: "",
  notes: "",
  isActive: true
};

const normalizeDisplayPhone = (value) => {
  if (!value) return "";
  let digits = String(value).replace(/\D/g, "");
  if (digits.startsWith("0091")) digits = digits.slice(4);
  else if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.startsWith("91") && digits.length >= 12) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
};

const toApiPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return "";
  return `+91${digits}`;
};

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: "0.9rem",
  boxSizing: "border-box",
  background: "white",
  outline: "none",
  transition: "border-color 0.2s"
};

const labelStyle = {
  fontSize: "0.8rem",
  fontWeight: 700,
  color: "#475569",
  marginBottom: 4,
  display: "block"
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column",
  marginBottom: 6
};

function Toggle({ checked, onChange, activeLabel = "Active Vendor", inactiveLabel = "Inactive Vendor" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: checked ? "#16a34a" : "#64748b" }}>
        {checked ? activeLabel : inactiveLabel}
      </span>
      <button
        type="button"
        onClick={onChange}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          background: checked ? "#16a34a" : "#cbd5e1",
          position: "relative",
          cursor: "pointer",
          transition: "background 0.25s ease"
        }}
        aria-checked={checked}
        role="switch"
      >
        <span style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          transition: "left 0.25s ease"
        }} />
      </button>
    </div>
  );
}

function PhoneInput({ label, required, value, onChange, placeholder, error }) {
  const digits = value.replace(/\D/g, "");
  return (
    <div style={formGroupStyle}>
      <label style={labelStyle}>{label} {required && <span style={{ color: "#ef4444" }}>*</span>}</label>
      <div style={{ display: "flex", border: `1px solid ${error ? "#ef4444" : "#cbd5e1"}`, borderRadius: 8, overflow: "hidden", background: "white" }}>
        <span style={{ padding: "9px 12px", background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: "0.9rem", borderRight: "1px solid #cbd5e1", display: "flex", alignItems: "center" }}>
          +91
        </span>
        <input
          type="tel"
          maxLength={10}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder={placeholder || "XXXXXXXXXX"}
          style={{ flex: 1, border: "none", padding: "9px 12px", fontSize: "0.9rem", outline: "none", background: "transparent" }}
        />
      </div>
      {error && <span style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 4 }}>{error}</span>}
    </div>
  );
}

function TextInput({ label, required, value, onChange, placeholder, type = "text", multiline = false, error }) {
  return (
    <div style={formGroupStyle}>
      <label style={labelStyle}>{label} {required && <span style={{ color: "#ef4444" }}>*</span>}</label>
      {multiline ? (
        <textarea 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder} 
          style={{ ...inputStyle, borderColor: error ? "#ef4444" : "#cbd5e1", minHeight: 68, resize: "vertical" }} 
        />
      ) : (
        <input 
          type={type} 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder} 
          style={{ ...inputStyle, borderColor: error ? "#ef4444" : "#cbd5e1" }} 
        />
      )}
      {error && <span style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 4 }}>{error}</span>}
    </div>
  );
}

function SearchableCitySelect({ label, required, value, onChange, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || "");

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const filtered = useMemo(() => {
    if (!query.trim()) return INDIAN_CITIES.slice(0, 15);
    const q = query.toLowerCase();
    return INDIAN_CITIES.filter(c => c.toLowerCase().includes(q)).slice(0, 15);
  }, [query]);

  return (
    <div style={formGroupStyle}>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search city (e.g. Delhi, Kolkata)..."
          style={{
            ...inputStyle,
            borderColor: error ? "#ef4444" : "#cbd5e1"
          }}
        />
        {isOpen && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            marginTop: 4,
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 50,
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
          }}>
            {filtered.map(city => (
              <div
                key={city}
                style={{
                  padding: "9px 12px",
                  fontSize: 13,
                  cursor: "pointer",
                  color: "#0f172a",
                  fontWeight: city === value ? 700 : 400,
                  background: city === value ? "#eff6ff" : "white",
                  borderBottom: "1px solid #f1f5f9"
                }}
                onClick={() => {
                  setQuery(city);
                  onChange(city);
                  setIsOpen(false);
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = city === value ? "#eff6ff" : "white"}
              >
                {city}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: "9px 12px", fontSize: 12, color: "#64748b" }}>
                Custom City: "{query}"
              </div>
            )}
          </div>
        )}
      </div>
      {error && <span style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 4 }}>{error}</span>}
    </div>
  );
}

export default function VendorManagement({ branches = [], selectedBranchId = null, formatMoney }) {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [form, setForm] = useState(emptyVendor);
  const [formErrors, setFormErrors] = useState({});
  const [mode, setMode] = useState("list");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [vendorItems, setVendorItems] = useState([]);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [itemPrice, setItemPrice] = useState("");

  useEffect(() => {
    loadVendors();
    api.get("/owner/inventory/products").then(res => setProducts(res.data || [])).catch(console.error);
  }, [selectedBranchId]);

  const loadVendors = async () => {
    try {
      const res = await api.get("/owner/purchases/vendors", { params: { branchId: selectedBranchId || undefined } });
      setVendors(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredVendors = useMemo(() => {
    if (!search.trim()) return vendors;
    const q = search.toLowerCase();
    return vendors.filter(v =>
      (v.name || "").toLowerCase().includes(q) ||
      (v.firmName || "").toLowerCase().includes(q) ||
      (v.phone || "").includes(q)
    );
  }, [vendors, search]);

  const filteredProducts = useMemo(() => {
    if (!itemSearch.trim()) return [];
    const q = itemSearch.toLowerCase();
    const existingIds = new Set(vendorItems.map(vi => vi.productId));
    return products
      .filter(p =>
        !existingIds.has(p.id) &&
        (p.name || "").toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [products, itemSearch, vendorItems]);

  const resetForm = () => {
    setForm(emptyVendor);
    setFormErrors({});
  };

  const handleCreate = () => {
    resetForm();
    setSelectedVendor(null);
    setMode("create");
    setStatus({ error: "", success: "" });
  };

  const handleSelect = (vendor) => {
    setSelectedVendor(vendor);
    setForm({
      name: vendor.name || "",
      firmName: vendor.firmName || "",
      phone: normalizeDisplayPhone(vendor.phone || ""),
      alternateMobile: normalizeDisplayPhone(vendor.alternateMobile || ""),
      email: vendor.email || "",
      gstNumber: vendor.gstNumber || "",
      address: vendor.address || "",
      area: vendor.area || "",
      landmark: vendor.landmark || "",
      city: vendor.city || "",
      pincode: vendor.pincode || "",
      notes: vendor.notes || "",
      isActive: vendor.isActive !== false
    });
    setFormErrors({});
    setMode("edit");
    setStatus({ error: "", success: "" });
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Vendor Name is required";
    if (!form.firmName?.trim()) errs.firmName = "Firm Name is required";
    
    const phoneDigits = (form.phone || "").replace(/\D/g, "");
    if (!phoneDigits) errs.phone = "Mobile number is required";
    else if (phoneDigits.length !== 10) errs.phone = "Mobile number must be 10 digits";

    if (form.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) errs.email = "Invalid email format";
    }

    if (form.gstNumber?.trim()) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(form.gstNumber.trim().toUpperCase())) {
        errs.gstNumber = "Invalid GST format (e.g. 22AAAAA0000A1Z5)";
      }
    }

    if (!form.address?.trim()) errs.address = "Address is required";
    if (!form.city?.trim()) errs.city = "City is required";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: "", success: "" });

    if (!validateForm()) {
      setStatus({ error: "Please fix form validation errors highlighted below.", success: "" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        branchId: selectedBranchId || null,
        phone: toApiPhone(form.phone),
        alternateMobile: form.alternateMobile ? toApiPhone(form.alternateMobile) : ""
      };
      if (selectedVendor) {
        await api.patch(`/owner/purchases/vendors/${selectedVendor.id}`, payload);
        setStatus({ success: "Vendor updated successfully!", error: "" });
      } else {
        await api.post("/owner/purchases/vendors", payload);
        setStatus({ success: "Vendor created successfully!", error: "" });
      }
      await loadVendors();
      if (!selectedVendor) {
        resetForm();
      }
    } catch (error) {
      setStatus({ error: formatApiError(error), success: "" });
    } finally {
      setLoading(false);
    }
  };

  const loadVendorItems = async (vendorId) => {
    try {
      const res = await api.get(`/owner/purchases/vendors/${vendorId}/items`);
      setVendorItems(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenItems = (vendor) => {
    setSelectedVendor(vendor);
    setMode("items");
    setItemSearch("");
    setSelectedProduct(null);
    setItemPrice("");
    loadVendorItems(vendor.id);
  };

  const handleAddItem = async () => {
    if (!selectedProduct) return;
    try {
      await api.post(`/owner/purchases/vendors/${selectedVendor.id}/items`, {
        productId: selectedProduct.id,
        price: Number(itemPrice || 0),
        isActive: true
      });
      setItemSearch("");
      setSelectedProduct(null);
      setItemPrice("");
      await loadVendorItems(selectedVendor.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateItem = async (item) => {
    try {
      await api.patch(`/owner/purchases/vendor-items/${item.id}`, {
        price: Number(item.price || 0),
        isActive: item.isActive
      });
      await loadVendorItems(selectedVendor.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm("Delete this vendor item?")) return;
    try {
      await api.delete(`/owner/purchases/vendor-items/${item.id}`);
      await loadVendorItems(selectedVendor.id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 140px)", background: "#f8fafc", borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
      {/* LEFT SIDEBAR */}
      <div style={{ width: 300, background: "white", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                placeholder="Search By Firm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", paddingLeft: 32, border: "1px solid #cbd5e1", borderRadius: 8, fontSize: "0.85rem", boxSizing: "border-box" }}
              />
              <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "#94a3b8" }} />
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="cpn-btn cpn-btn-primary"
            style={{ width: "100%", fontSize: 13, padding: "9px 12px", justifyContent: "center" }}
          >
            <Plus size={16} /> Create Vendor
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              onClick={() => handleSelect(vendor)}
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #f1f5f9",
                cursor: "pointer",
                background: selectedVendor?.id === vendor.id ? "#eff6ff" : "white",
                borderLeft: selectedVendor?.id === vendor.id ? "3px solid #2563eb" : "3px solid transparent",
                transition: "all 0.15s"
              }}
            >
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{vendor.firmName || vendor.name}</div>
              <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: 2 }}>{vendor.name}</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>{vendor.phone || "No phone"}</div>
            </div>
          ))}
          {filteredVendors.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
              No vendors found.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "#f8fafc" }}>
        {mode === "list" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
            <Building size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Vendor Management</div>
            <div style={{ fontSize: "0.85rem" }}>Select a vendor from the left sidebar to view or edit details, or create a new vendor.</div>
          </div>
        )}

        {(mode === "create" || mode === "edit") && (
          <div style={{ maxWidth: 860, margin: "0 auto", background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a", fontWeight: 700 }}>
                  {mode === "create" ? "Create New Vendor" : "Update Vendor Profile"}
                </h2>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Fill vendor details, contact info, GST, and address.</div>
              </div>
              <Toggle
                checked={form.isActive}
                onChange={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              />
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              {status.error && <div style={{ color: "#991b1b", padding: "10px 14px", background: "#fef2f2", borderRadius: 8, fontSize: "0.85rem", marginBottom: 16, border: "1px solid #fee2e2" }}>{status.error}</div>}
              {status.success && <div style={{ color: "#166534", padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, fontSize: "0.85rem", marginBottom: 16, border: "1px solid #dcfce7" }}>{status.success}</div>}

              {/* Vendor Basic Info Card */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #f1f5f9", marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <User size={16} color="#2563eb" /> Vendor Basic Details
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px 16px" }}>
                  <TextInput label="Vendor Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Rajesh Kumar" error={formErrors.name} />
                  <TextInput label="Firm / Company Name" required value={form.firmName} onChange={(v) => setForm({ ...form, firmName: v })} placeholder="e.g. Apex Cosmetics Traders" error={formErrors.firmName} />

                  <PhoneInput
                    label="Mobile Number"
                    required
                    value={form.phone}
                    onChange={(v) => setForm({ ...form, phone: v })}
                    placeholder="XXXXXXXXXX"
                    error={formErrors.phone}
                  />
                  <TextInput label="Email Address" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="vendor@example.com" error={formErrors.email} />
                  <TextInput label="GST Number" value={form.gstNumber} onChange={(v) => setForm({ ...form, gstNumber: v })} placeholder="e.g. 22AAAAA0000A1Z5" error={formErrors.gstNumber} />
                </div>
              </div>

              {/* Address & Location Card */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #f1f5f9", marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={16} color="#2563eb" /> Location & Address Details
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px 16px" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <TextInput label="Full Street Address" required value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Shop / Building / Street Address..." multiline error={formErrors.address} />
                  </div>

                  <TextInput label="Area / Sector" value={form.area} onChange={(v) => setForm({ ...form, area: v })} placeholder="e.g. Commercial Belt" />
                  <TextInput label="Landmark" value={form.landmark} onChange={(v) => setForm({ ...form, landmark: v })} placeholder="e.g. Near City Bank" />

                  <SearchableCitySelect label="City" required value={form.city} onChange={(v) => setForm({ ...form, city: v })} error={formErrors.city} />
                  <TextInput label="Pincode" value={form.pincode} onChange={(v) => setForm({ ...form, pincode: v })} placeholder="e.g. 110001" />

                  <div style={{ gridColumn: "1 / -1" }}>
                    <TextInput label="Notes / Comments" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Internal notes for this vendor..." multiline />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
                {mode === "edit" && (
                  <button type="button" onClick={() => handleOpenItems(selectedVendor)} className="cpn-btn cpn-btn-secondary" style={{ fontSize: 13, padding: "8px 18px" }}>
                    Manage Vendor Items
                  </button>
                )}
                <button type="button" onClick={() => setMode("list")} className="cpn-btn cpn-btn-secondary" style={{ fontSize: 13, padding: "8px 18px" }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="cpn-btn cpn-btn-primary" style={{ fontSize: 13, padding: "8px 24px", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Saving..." : mode === "create" ? "Create Vendor" : "Update Vendor"}
                </button>
              </div>
            </form>
          </div>
        )}

        {mode === "items" && (
          <div style={{ maxWidth: 860, margin: "0 auto", background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12, background: "#fff" }}>
              <button onClick={() => setMode("edit")} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <ChevronLeft size={20} />
              </button>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a", fontWeight: 700 }}>Vendor Supplied Items</h2>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{selectedVendor?.firmName || selectedVendor?.name}</div>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <label style={labelStyle}>Product</label>
                  <input
                    placeholder="Search item by name..."
                    value={itemSearch}
                    onChange={(e) => { setItemSearch(e.target.value); setSelectedProduct(null); }}
                    style={inputStyle}
                  />
                  {filteredProducts.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #cbd5e1", borderRadius: 8, marginTop: 4, maxHeight: 200, overflowY: "auto", zIndex: 10, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
                      {filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => { setSelectedProduct(p); setItemSearch(p.name); }}
                          style={{ padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ width: 120 }}>
                  <label style={labelStyle}>Supply Price (₹)</label>
                  <input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="0" style={inputStyle} />
                </div>
                <button
                  onClick={handleAddItem}
                  disabled={!selectedProduct}
                  className="cpn-btn cpn-btn-primary"
                  style={{ fontSize: 13, padding: "9px 18px", opacity: selectedProduct ? 1 : 0.6 }}
                >
                  Add Item
                </button>
              </div>

              <div className="table-container">
                <table className="data-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "12px 16px" }}>Sr.No.</th>
                      <th style={{ padding: "12px 16px" }}>Item Name</th>
                      <th style={{ padding: "12px 16px" }}>Supply Price</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 13 }}>{idx + 1}.</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{item.product?.name}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => {
                              const next = [...vendorItems];
                              next[idx].price = e.target.value;
                              setVendorItems(next);
                            }}
                            style={{ width: 90, padding: "5px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, fontWeight: 700 }}
                          />
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={item.isActive !== false}
                            onChange={(e) => {
                              const next = [...vendorItems];
                              next[idx].isActive = e.target.checked;
                              setVendorItems(next);
                            }}
                            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#2563eb" }}
                          />
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <button onClick={() => handleUpdateItem(item)} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: 6, cursor: "pointer", color: "#2563eb", marginRight: 8 }} title="Save Item">
                            <Save size={15} />
                          </button>
                          <button onClick={() => handleDeleteItem(item)} style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 6, padding: 6, cursor: "pointer", color: "#ef4444" }} title="Delete Item">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {vendorItems.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No items added for this vendor yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
                <button onClick={() => setMode("edit")} className="cpn-btn cpn-btn-secondary" style={{ fontSize: 13, padding: "8px 18px" }}>
                  Back to Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
