import { useEffect, useState, useCallback, useRef } from "react";
import { X, Trash2, Edit2, Search, Plus, Package, ClipboardList } from "lucide-react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/apiError";
import { useSalonSettings } from "../../context/SalonSettingsContext";
import { useBranch } from "../../context/BranchContext";
import PageLoader from "../../components/PageLoader";
import "./ServiceHubPage.css";

const defaultProductForm = {
  name: "",
  categoryId: "",
  branchId: "",
  featured: false,
  favourite: false,
  isActive: true,
  targetGroup: "BOTH",
  hideFromCatalogue: false,
  costPrice: 0,
  sellingPrice: 0,
  salePrice: 0,
  currentStock: 0,
  nonDiscountable: false,
  discountType: null,
  discountValue: null,
  onFloor: 0,
  netWeight: "",
  sku: "",
  productType: "RETAIL",
  description: "",
  benefits: "",
  ingredients: "",
  usageInstructions: "",
  displayImages: [],
  variations: [],
  weight: "",
  length: "",
  width: "",
  height: "",
  unit: "",
  secondaryUnit: "",
  unitConversion: ""
};

export default function ProductCategoriesPage() {
  const { currencySymbol } = useSalonSettings();
  const { selectedBranchId, branches } = useBranch();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ ...defaultProductForm });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", sortOrder: 1, isPublicVisible: true });
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [status, setStatus] = useState({ error: "", success: "" });
  const [saving, setSaving] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameRef = useRef(null);
  const [stockModal, setStockModal] = useState({ open: false, product: null });
  const [stockForm, setStockForm] = useState({ currentStock: 0, minStock: 0, onFloor: 0, netWeight: "", unit: "", secondaryUnit: "", productType: "RETAIL" });
  const [stockSaving, setStockSaving] = useState(false);
  const [stockError, setStockError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const branchParams = selectedBranchId ? { branchId: selectedBranchId } : {};
      const [catRes, prodRes] = await Promise.all([
        api.get("/owner/inventory/categories", { params: branchParams }),
        api.get("/owner/inventory/products", { params: branchParams })
      ]);
      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to load"), success: "" });
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredCategories = categories.filter(c => selectedBranchId ? c.branchId === selectedBranchId || !c.branchId : true);

  const filteredProducts = products.filter(p => {
    const matchBranch = selectedBranchId ? (p.branchId === selectedBranchId || !p.branchId) : true;
    const matchCat = selectedCategory ? p.categoryId === selectedCategory.id : true;
    const matchQ = searchQ ? p.name.toLowerCase().includes(searchQ.toLowerCase()) || (p.sku || "").toLowerCase().includes(searchQ.toLowerCase()) : true;
    return matchBranch && matchCat && matchQ && p.isActive;
  });

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/owner/inventory/categories", { ...categoryForm, branchId: selectedBranchId });
      setStatus({ success: "Category saved", error: "" });
      setShowCategoryModal(false);
      setCategoryForm({ name: "", sortOrder: categories.length + 1, isPublicVisible: true });
      loadData();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to save category"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setSaving(true);
    try {
      await api.delete(`/owner/inventory/categories/${categoryToDelete.id}`);
      setStatus({ success: "Category deleted", error: "" });
      if (selectedCategory?.id === categoryToDelete.id) setSelectedCategory(null);
      loadData();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to delete category"), success: "" });
    } finally {
      setSaving(false);
      setCategoryToDelete(null);
    }
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({ ...defaultProductForm, categoryId: selectedCategory?.id || "", branchId: selectedBranchId || "" });
    setShowProductModal(true);
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name || "",
      categoryId: p.categoryId || "",
      branchId: p.branchId || "",
      featured: Boolean(p.featured),
      isActive: p.isActive !== false,
      targetGroup: p.targetGroup || "BOTH",
      hideFromCatalogue: Boolean(p.hideFromCatalogue),
      costPrice: Number(p.costPrice) || 0,
      sellingPrice: Number(p.sellingPrice) || 0,
      salePrice: Number(p.salePrice) || 0,
      currentStock: Number(p.currentStock) || 0,
      nonDiscountable: Boolean(p.nonDiscountable),
      discountType: p.discountType || null,
      discountValue: p.discountValue != null ? Number(p.discountValue) : null,
      onFloor: Number(p.onFloor) || 0,
      netWeight: p.netWeight != null ? Number(p.netWeight) : "",
      sku: p.sku || "",
      productType: p.productType || "RETAIL",
      description: p.description || "",
      benefits: p.benefits || "",
      ingredients: p.ingredients || "",
      usageInstructions: p.usageInstructions || "",
      displayImages: Array.isArray(p.displayImages) ? p.displayImages : [],
      variations: Array.isArray(p.variations) ? p.variations : [],
      weight: p.weight ?? "",
      length: p.length ?? "",
      width: p.width ?? "",
      height: p.height ?? "",
      unit: p.unit ?? "",
      secondaryUnit: p.secondaryUnit ?? "",
      unitConversion: p.unitConversion ?? "",
      favourite: Boolean(p.favourite)
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...productForm,
        branchId: productForm.branchId || selectedBranchId || null,
        costPrice: Number(productForm.costPrice),
        sellingPrice: Number(productForm.sellingPrice),
        salePrice: productForm.salePrice ? Number(productForm.salePrice) : null,
        currentStock: Number(productForm.currentStock),
        onFloor: Number(productForm.onFloor) || 0,
        netWeight: productForm.netWeight !== "" ? Number(productForm.netWeight) : null,
        featured: Boolean(productForm.featured),
        targetGroup: productForm.targetGroup || "BOTH",
        hideFromCatalogue: Boolean(productForm.hideFromCatalogue),
        nonDiscountable: Boolean(productForm.nonDiscountable),
        discountType: productForm.discountType || null,
        discountValue: productForm.discountValue ?? null,
        description: productForm.description || null,
        benefits: productForm.benefits || null,
        ingredients: productForm.ingredients || null,
        usageInstructions: productForm.usageInstructions || null,
        displayImages: Array.isArray(productForm.displayImages) ? productForm.displayImages : [],
        variations: Array.isArray(productForm.variations) ? productForm.variations : [],
        weight: productForm.weight !== "" ? Number(productForm.weight) : null,
        length: productForm.length !== "" ? Number(productForm.length) : null,
        width: productForm.width !== "" ? Number(productForm.width) : null,
        height: productForm.height !== "" ? Number(productForm.height) : null,
        unit: productForm.unit || null,
        secondaryUnit: productForm.secondaryUnit || null,
        unitConversion: productForm.unitConversion !== "" ? Number(productForm.unitConversion) : null,
        favourite: Boolean(productForm.favourite)
      };
      if (editingProduct) {
        await api.patch(`/owner/inventory/products/${editingProduct.id}`, payload);
      } else {
        await api.post("/owner/inventory/products", payload);
      }
      setStatus({ success: "Product saved", error: "" });
      setShowProductModal(false);
      loadData();
    } catch (err) {
      setStatus({ error: formatApiError(err, "Failed to save product"), success: "" });
    } finally {
      setSaving(false);
    }
  };

  const handlePriceFocus = (field) => {
    if (productForm[field] === 0) setProductForm(prev => ({ ...prev, [field]: "" }));
  };

  const handlePriceBlur = (field) => {
    if (productForm[field] === "") setProductForm(prev => ({ ...prev, [field]: 0 }));
  };

  const openStockModal = (p) => {
    setStockModal({ open: true, product: p });
    setStockForm({
      currentStock: Number(p.currentStock) || 0,
      minStock: Number(p.minStock) || 0,
      onFloor: Number(p.onFloor) || 0,
      netWeight: p.netWeight != null ? Number(p.netWeight) : "",
      unit: p.unit || "",
      secondaryUnit: p.secondaryUnit || "",
      productType: p.productType || "RETAIL"
    });
    setStockError("");
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!stockModal.product) return;
    setStockSaving(true);
    setStockError("");
    try {
      const payload = {
        currentStock: Number(stockForm.currentStock),
        minStock: Number(stockForm.minStock),
        onFloor: Number(stockForm.onFloor),
        netWeight: stockForm.netWeight !== "" ? Number(stockForm.netWeight) : null,
        unit: stockForm.unit || null,
        secondaryUnit: stockForm.secondaryUnit || null,
        productType: stockForm.productType
      };
      if (payload.onFloor > payload.currentStock) {
        setStockError("On floor cannot exceed total stock");
        setStockSaving(false);
        return;
      }
      if (stockForm.productType === "CONSUMABLE") {
        if (!stockForm.unit) {
          setStockError("Unit is required for consumable products");
          setStockSaving(false);
          return;
        }
        if (!stockForm.netWeight || Number(stockForm.netWeight) <= 0) {
          setStockError("Net weight is required and must be greater than 0 for consumable products");
          setStockSaving(false);
          return;
        }
      }
      await api.patch(`/owner/inventory/products/${stockModal.product.id}/stock-details`, payload);
      setStatus({ success: "Stock details updated", error: "" });
      setStockModal({ open: false, product: null });
      loadData();
    } catch (err) {
      setStockError(formatApiError(err, "Failed to update stock details"));
    } finally {
      setStockSaving(false);
    }
  };

  if (loading) return <PageLoader title="Loading products" />;

  return (
    <div className="responsive-page-layout" style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", overflow: "hidden" }}>
      {status.error && <div style={{ position: "fixed", top: 80, right: 24, background: "#fef2f2", color: "#dc2626", padding: "12px 20px", borderRadius: 8, fontSize: 14, zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 12, fontWeight: 500 }}>{status.error}<button onClick={() => setStatus({...status, error: ""})} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", display: "flex" }}><X size={16} /></button></div>}
      {status.success && <div style={{ position: "fixed", top: 80, right: 24, background: "#ecfdf5", color: "#059669", padding: "12px 20px", borderRadius: 8, fontSize: 14, zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 12, fontWeight: 500 }}>{status.success}<button onClick={() => setStatus({...status, success: ""})} style={{ background: "none", border: "none", color: "#059669", cursor: "pointer", display: "flex" }}><X size={16} /></button></div>}

      {/* Left Sidebar - Categories */}
      <div className="responsive-sidebar" style={{ width: 280, background: "#ffffff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "2px 0 8px rgba(0,0,0,0.02)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff" }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#0f172a" }}>Categories</h3>
          <button onClick={() => setShowCategoryModal(true)} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 4px rgba(59,130,246,0.2)", transition: "all 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="#2563eb"} onMouseLeave={e=>e.currentTarget.style.background="#3b82f6"}>
            <Plus size={16} /> New
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
          <div
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              background: !selectedCategory ? "#eff6ff" : "transparent",
              color: !selectedCategory ? "#1d4ed8" : "#475569",
              fontWeight: !selectedCategory ? 600 : 500,
              fontSize: 14,
              borderRadius: 8,
              marginBottom: 4,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}
            onMouseEnter={e => { if(selectedCategory) e.currentTarget.style.background = "#f8fafc" }}
            onMouseLeave={e => { if(selectedCategory) e.currentTarget.style.background = "transparent" }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: !selectedCategory ? "#3b82f6" : "#cbd5e1" }} />
            All Categories
          </div>
          {filteredCategories.map(cat => (
            <div
              key={cat.id}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                background: selectedCategory?.id === cat.id ? "#eff6ff" : "transparent",
                color: selectedCategory?.id === cat.id ? "#1d4ed8" : "#475569",
                fontWeight: selectedCategory?.id === cat.id ? 600 : 500,
                fontSize: 14,
                borderRadius: 8,
                marginBottom: 4,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
              onMouseEnter={e => { 
                if(selectedCategory?.id !== cat.id) e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.querySelector(".del-btn").style.opacity = "1";
              }}
              onMouseLeave={e => { 
                if(selectedCategory?.id !== cat.id) e.currentTarget.style.background = "transparent";
                e.currentTarget.querySelector(".del-btn").style.opacity = "0";
              }}
              onClick={() => setSelectedCategory(cat)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, overflow: "hidden" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: selectedCategory?.id === cat.id ? "#3b82f6" : "#cbd5e1", flexShrink: 0 }} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat.name}</span>
              </div>
              <button 
                className="del-btn"
                onClick={(e) => { e.stopPropagation(); setCategoryToDelete(cat); }}
                style={{ opacity: 0, background: "none", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", padding: 4, borderRadius: 4, transition: "all 0.2s", flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                title="Delete Category"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {filteredCategories.length === 0 && <div style={{ padding: "32px 16px", color: "#94a3b8", fontSize: 13, textAlign: "center" }}>No categories yet</div>}
        </div>
      </div>

      {/* Right Panel - Products */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f8fafc" }}>
        {/* Header */}
        <div className="responsive-header" style={{ padding: "20px 32px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#eff6ff", padding: 8, borderRadius: 8, color: "#3b82f6", display: "flex" }}><Package size={20} /></div>
            {selectedCategory ? selectedCategory.name : "All Products"}
          </h3>
          <div className="responsive-header-actions" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "#94a3b8" }} />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search products, SKU..."
                className="responsive-search-input"
                style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px 10px 36px", fontSize: 14, width: 260, outline: "none", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = "#cbd5e1"}
              />
            </div>
            <button onClick={openNewProduct} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.1)", transition: "all 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="#1e293b"} onMouseLeave={e=>e.currentTarget.style.background="#0f172a"}>
              <Plus size={18} /> Add Product
            </button>
          </div>
        </div>

        {/* Product List */}
        <div className="responsive-product-grid-container" style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {filteredProducts.length > 0 ? (
            <div className="responsive-product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {filteredProducts.map(p => (
                <div key={p.id} style={{ background: "#ffffff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: 16, transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.06)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.02)"; }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, overflow: "hidden" }}>
                      {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={24} color="#94a3b8" />}
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", lineHeight: 1.3 }}>
                        {p.name}
                        {p.featured && <span style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: 4, fontWeight: 700, display: "inline-flex", alignItems: "center", height: 18 }}>★ Featured</span>}
                        {Array.isArray(p.variations) && p.variations.length > 0 && <span style={{ fontSize: 10, background: "#dbeafe", color: "#1d4ed8", padding: "2px 6px", borderRadius: 4, fontWeight: 700, display: "inline-flex", alignItems: "center", height: 18 }}>Customisable</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>SKU: {p.sku || "N/A"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 16, marginTop: "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{currencySymbol}{Number(p.sellingPrice).toFixed(0)}</span>
                      {p.productType === "CONSUMABLE" && <span style={{ fontSize: 11, background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>Consumable</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openStockModal(p)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px", cursor: "pointer", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.borderColor = "#bfdbfe"; }} onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#334155"; e.currentTarget.style.borderColor = "#e2e8f0"; }} title="Update Stock Details">
                        <ClipboardList size={16} />
                      </button>
                      <button onClick={() => openEditProduct(p)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px", cursor: "pointer", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.borderColor = "#bfdbfe"; }} onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#334155"; e.currentTarget.style.borderColor = "#e2e8f0"; }} title="Edit Product">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "80px 40px", textAlign: "center", color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#ffffff", borderRadius: 16, border: "1px dashed #cbd5e1" }}>
              <div style={{ background: "#f1f5f9", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: "#94a3b8" }}><Package size={32} /></div>
              <h4 style={{ margin: "0 0 8px", fontSize: 18, color: "#0f172a" }}>No products found</h4>
              <p style={{ margin: 0, fontSize: 14 }}>There are no products in this category matching your search.</p>
              <button onClick={openNewProduct} style={{ marginTop: 24, background: "#fff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Add your first product</button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Category Confirmation Modal */}
      {categoryToDelete && (
        <div className="hub-modal-overlay" onClick={() => setCategoryToDelete(null)} style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
          <div className="hub-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, padding: 32, textAlign: 'center', borderRadius: 16, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
            <div style={{ width: 64, height: 64, background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#ef4444" }}>
              <Trash2 size={32} />
            </div>
            <h3 style={{ margin: "0 0 12px", color: "#0f172a", fontSize: 20, fontWeight: 800 }}>Delete Category?</h3>
            <p style={{ color: "#475569", fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>Are you sure you want to delete <strong style={{ color: "#0f172a" }}>"{categoryToDelete.name}"</strong>? This will permanently delete the category and may affect associated products.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              <button type="button" onClick={() => setCategoryToDelete(null)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"} onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}>Cancel</button>
              <button type="button" onClick={handleDeleteCategory} disabled={saving} style={{ flex: 1, padding: "12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "background 0.2s" }} onMouseEnter={e => { if(!saving) e.currentTarget.style.background = "#dc2626" }} onMouseLeave={e => { if(!saving) e.currentTarget.style.background = "#ef4444" }}>{saving ? "Deleting..." : "Yes, Delete"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="hub-modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="hub-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, borderRadius: 16 }}>
            <div className="hub-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>New Category</span>
              <button type="button" onClick={() => setShowCategoryModal(false)} style={{ background: "#f1f5f9", border: "none", cursor: "pointer", color: "#64748b", padding: 6, borderRadius: "50%", display: "flex" }} onMouseEnter={e=>e.currentTarget.style.background="#e2e8f0"} onMouseLeave={e=>e.currentTarget.style.background="#f1f5f9"}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveCategory} style={{ padding: "24px" }}>
              <div className="hub-form-group" style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Name *</label>
                <input type="text" required className="hub-input" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="e.g. Skin Care" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #f1f5f9", paddingTop: 20 }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} style={{ padding: "10px 20px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 600, color: "#475569", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: "10px 24px", background: "#2563eb", border: "none", borderRadius: 8, fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving..." : "Create Category"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="hub-modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="hub-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: 16 }}>
            <div className="hub-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                {editingProduct ? <Edit2 size={18} color="#3b82f6" /> : <Plus size={18} color="#3b82f6" />}
                {selectedCategory ? <span style={{ color: "#64748b" }}>{selectedCategory.name} / </span> : ""}{editingProduct ? "Edit Item" : "New Item"}
              </span>
              <button type="button" onClick={() => setShowProductModal(false)} style={{ background: "#e2e8f0", border: "none", cursor: "pointer", color: "#475569", padding: 6, borderRadius: "50%", display: "flex" }} onMouseEnter={e=>e.currentTarget.style.background="#cbd5e1"} onMouseLeave={e=>e.currentTarget.style.background="#e2e8f0"}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
              <div className="hub-modal-body" style={{ overflowY: "auto", flex: 1, padding: "24px 28px" }}>
                {/* Name, Featured, Active */}
                <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr", gap: 20, marginBottom: 24, alignItems: "end" }}>
                  <div className="hub-form-group" style={{ position: "relative" }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Name *</label>
                    <input
                      ref={nameRef}
                      type="text"
                      required
                      className="hub-input"
                      value={productForm.name}
                      onChange={e => {
                        const val = e.target.value;
                        setProductForm({...productForm, name: val});
                        if (val.length >= 2) {
                          const matches = products.filter(p => p.name.toLowerCase().includes(val.toLowerCase()) && p.name !== val).slice(0, 5);
                          setNameSuggestions(matches);
                          setShowSuggestions(matches.length > 0);
                        } else {
                          setShowSuggestions(false);
                        }
                      }}
                      onFocus={() => {
                        if (productForm.name.length >= 2) {
                          const matches = products.filter(p => p.name.toLowerCase().includes(productForm.name.toLowerCase()) && p.name !== productForm.name).slice(0, 5);
                          setNameSuggestions(matches);
                          setShowSuggestions(matches.length > 0);
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Product name"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                    />
                    {showSuggestions && nameSuggestions.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: 180, overflowY: "auto", marginTop: 4 }}>
                        {nameSuggestions.map(p => (
                          <div
                            key={p.id}
                            onMouseDown={() => {
                              setProductForm({...productForm, name: p.name, sellingPrice: Number(p.sellingPrice) || 0, costPrice: Number(p.costPrice) || 0, sku: p.sku || ""});
                              setShowSuggestions(false);
                            }}
                            style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={e => e.currentTarget.style.background = "white"}
                          >
                            <span style={{ fontWeight: 500, color: "#0f172a" }}>{p.name}</span>
                            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>{currencySymbol}{Number(p.sellingPrice || 0).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="hub-form-group" style={{ display: "flex", alignItems: "end", paddingBottom: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                      <input type="checkbox" checked={productForm.featured} onChange={e => setProductForm({...productForm, featured: e.target.checked})} style={{ width: 18, height: 18, accentColor: "#f59e0b" }} />
                      Featured
                    </label>
                  </div>
                  <div className="hub-form-group" style={{ display: "flex", alignItems: "end", paddingBottom: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                      <input type="checkbox" checked={productForm.isActive} onChange={e => setProductForm({...productForm, isActive: e.target.checked})} style={{ width: 18, height: 18, accentColor: "#2563eb" }} />
                      Active
                    </label>
                  </div>
                  <div className="hub-form-group" style={{ display: "flex", alignItems: "end", paddingBottom: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                      <input type="checkbox" checked={productForm.favourite} onChange={e => setProductForm({...productForm, favourite: e.target.checked})} style={{ width: 18, height: 18, accentColor: "#ec4899" }} />
                      Favourite
                    </label>
                  </div>
                </div>

                {/* Branch, Group + Hide from catalogue */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, padding: "16px 20px", border: "1px solid #f1f5f9", borderRadius: 12, background: "#f8fafc", gap: 16, flexWrap: "wrap" }}>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Current Stock</label>
                    <input type="number" className="hub-input" value={productForm.currentStock} onChange={e => { const val = e.target.value; setProductForm(prev => ({...prev, currentStock: val === "" ? "" : (parseFloat(val) || 0)})); }} onFocus={() => handlePriceFocus("currentStock")} onBlur={() => handlePriceBlur("currentStock")} style={{ width: 120, padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Target Group:</span>
                    <div style={{ display: "flex", gap: 16, background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      {[{ value: "BOTH", label: "Both" }, { value: "FEMALE", label: "Female" }, { value: "MALE", label: "Male" }].map(g => (
                        <label key={g.value} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 500, color: "#334155", cursor: "pointer" }}>
                          <input type="radio" name="targetGroup" value={g.value} checked={productForm.targetGroup === g.value} onChange={e => setProductForm({...productForm, targetGroup: e.target.value})} style={{ width: 16, height: 16, accentColor: "#2563eb" }} />
                          {g.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                    <input type="checkbox" checked={productForm.hideFromCatalogue} onChange={e => setProductForm({...productForm, hideFromCatalogue: e.target.checked})} style={{ width: 18, height: 18, accentColor: "#2563eb" }} />
                    Hide from catalogue
                  </label>
                </div>

                {/* Cost Price, Price, Sale Price, Non Discountable */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20, marginBottom: 24, alignItems: "end" }}>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Cost Price</label>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                      <span style={{ padding: "10px 12px", background: "#f8fafc", borderRight: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, color: "#64748b" }}>{currencySymbol}</span>
                      <input type="number" className="hub-input" value={productForm.costPrice} onChange={e => { const val = e.target.value; setProductForm(prev => ({...prev, costPrice: val === "" ? "" : (parseFloat(val) || 0)})); }} onFocus={() => handlePriceFocus("costPrice")} onBlur={() => handlePriceBlur("costPrice")} style={{ border: "none", flex: 1, padding: "10px", fontSize: 14 }} />
                    </div>
                  </div>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Selling Price *</label>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                      <span style={{ padding: "10px 12px", background: "#f8fafc", borderRight: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, color: "#64748b" }}>{currencySymbol}</span>
                      <input type="number" required className="hub-input" value={productForm.sellingPrice} onChange={e => { const val = e.target.value; setProductForm(prev => ({...prev, sellingPrice: val === "" ? "" : (parseFloat(val) || 0)})); }} onFocus={() => handlePriceFocus("sellingPrice")} onBlur={() => handlePriceBlur("sellingPrice")} style={{ border: "none", flex: 1, padding: "10px", fontSize: 14, fontWeight: 600 }} />
                    </div>
                  </div>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Sale Price</label>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                      <span style={{ padding: "10px 12px", background: "#f8fafc", borderRight: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, color: "#64748b" }}>{currencySymbol}</span>
                      <input type="number" className="hub-input" value={productForm.salePrice} onChange={e => { const val = e.target.value; setProductForm(prev => ({...prev, salePrice: val === "" ? "" : (parseFloat(val) || 0)})); }} onFocus={() => handlePriceFocus("salePrice")} onBlur={() => handlePriceBlur("salePrice")} style={{ border: "none", flex: 1, padding: "10px", fontSize: 14 }} />
                    </div>
                  </div>
                  <div className="hub-form-group" style={{ display: "flex", alignItems: "end", paddingBottom: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                      <input type="checkbox" checked={productForm.nonDiscountable} onChange={e => setProductForm({...productForm, nonDiscountable: e.target.checked})} style={{ width: 18, height: 18, accentColor: "#2563eb" }} />
                      No Discount
                    </label>
                  </div>
                </div>

                {/* Discount */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 24, alignItems: "end" }}>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Discount Type</label>
                    <select className="hub-input" value={productForm.discountType || ""} onChange={e => setProductForm({...productForm, discountType: e.target.value || null, discountValue: e.target.value ? productForm.discountValue || 0 : null})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}>
                      <option value="">No Discount</option>
                      <option value="FIX">Flat (₹)</option>
                      <option value="PERCENT">Percentage (%)</option>
                    </select>
                  </div>
                  {productForm.discountType && (
                    <div className="hub-form-group">
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Discount Value {productForm.discountType === "PERCENT" ? "(%)" : `(₹)`}</label>
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                        <span style={{ padding: "10px 12px", background: "#f8fafc", borderRight: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, color: "#64748b" }}>{productForm.discountType === "PERCENT" ? "%" : currencySymbol}</span>
                        <input type="number" min="0" max={productForm.discountType === "PERCENT" ? 100 : undefined} className="hub-input" value={productForm.discountValue ?? ""} onChange={e => setProductForm({...productForm, discountValue: e.target.value === "" ? null : parseFloat(e.target.value) || 0})} placeholder={productForm.discountType === "PERCENT" ? "e.g. 10" : "e.g. 50"} style={{ border: "none", flex: 1, padding: "10px", fontSize: 14, fontWeight: 600 }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Store SKU + Retail */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24, alignItems: "end" }}>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>SKU (Stock Keeping Unit)</label>
                    <input type="text" className="hub-input" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} placeholder="e.g. SHAMP-001" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontFamily: "monospace" }} />
                  </div>
                  <div className="hub-form-group" style={{ display: "flex", alignItems: "end", paddingBottom: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                      <input type="checkbox" checked={productForm.productType === "RETAIL"} onChange={e => setProductForm({...productForm, productType: e.target.checked ? "RETAIL" : "CONSUMABLE"})} style={{ width: 18, height: 18, accentColor: "#2563eb" }} />
                      Retail Product
                    </label>
                  </div>
                </div>

                {/* Category */}
                <div className="hub-form-group" style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Category</label>
                  <select className="hub-input" value={productForm.categoryId} onChange={e => setProductForm({...productForm, categoryId: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}>
                    <option value="">No Category</option>
                    {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Variations */}
                <div style={{ marginBottom: 24, padding: "20px", border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Variations</span>
                    <button type="button" onClick={() => setProductForm({...productForm, variations: [...productForm.variations, { name: "", price: 0, salePrice: 0, nonDiscountable: false, storeSku: "" }]})} style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="#dbeafe"} onMouseLeave={e=>e.currentTarget.style.background="#eff6ff"}>Add Variations</button>
                  </div>
                  {productForm.variations.map((v, idx) => (
                    <div key={idx} style={{ marginBottom: 16, background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Variation: {idx + 1}</span>
                        <button type="button" onClick={() => setProductForm({...productForm, variations: productForm.variations.filter((_, i) => i !== idx)})} style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Remove Variation"><X size={14} /></button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: 10, alignItems: "end" }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Name</label>
                          <input type="text" value={v.name} onChange={e => { const next = [...productForm.variations]; next[idx] = {...next[idx], name: e.target.value}; setProductForm({...productForm, variations: next}); }} placeholder="e.g. 10 gm" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Price</label>
                          <input type="number" value={v.price || ""} onChange={e => { const next = [...productForm.variations]; next[idx] = {...next[idx], price: parseFloat(e.target.value) || 0}; setProductForm({...productForm, variations: next}); }} placeholder="0" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Sale Price</label>
                          <input type="number" value={v.salePrice || ""} onChange={e => { const next = [...productForm.variations]; next[idx] = {...next[idx], salePrice: parseFloat(e.target.value) || 0}; setProductForm({...productForm, variations: next}); }} placeholder="0" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Non Discountable</label>
                          <button type="button" onClick={() => { const next = [...productForm.variations]; next[idx] = {...next[idx], nonDiscountable: !v.nonDiscountable}; setProductForm({...productForm, variations: next}); }} style={{ width: 48, height: 26, borderRadius: 13, border: "none", background: v.nonDiscountable ? "#2563eb" : "#cbd5e1", position: "relative", cursor: "pointer", transition: "background 0.25s", display: "flex", alignItems: "center" }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: v.nonDiscountable ? 24 : 2, transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
                          </button>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Store SKU</label>
                          <input type="text" value={v.storeSku || ""} onChange={e => { const next = [...productForm.variations]; next[idx] = {...next[idx], storeSku: e.target.value}; setProductForm({...productForm, variations: next}); }} placeholder="SKU" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {productForm.variations.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13, fontStyle: "italic" }}>No variations added.</div>}
                </div>

                {/* Description + Video Link */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Description <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 11 }}>(Optional)</span></label>
                    <textarea className="hub-input" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} placeholder="Detailed product description..." rows={4} style={{ width: "100%", resize: "vertical", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  </div>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Benefits <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 11 }}>(Optional)</span></label>
                    <textarea className="hub-input" value={productForm.benefits} onChange={e => setProductForm({...productForm, benefits: e.target.value})} placeholder="Key benefits..." rows={2} style={{ width: "100%", resize: "vertical", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  </div>
                </div>

                {/* Ingredients + Usage Instructions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Ingredients <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 11 }}>(Optional)</span></label>
                    <textarea className="hub-input" value={productForm.ingredients} onChange={e => setProductForm({...productForm, ingredients: e.target.value})} placeholder="List of ingredients..." rows={3} style={{ width: "100%", resize: "vertical", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  </div>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Usage Instructions <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 11 }}>(Optional)</span></label>
                    <textarea className="hub-input" value={productForm.usageInstructions} onChange={e => setProductForm({...productForm, usageInstructions: e.target.value})} placeholder="How to use this product..." rows={3} style={{ width: "100%", resize: "vertical", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  </div>
                </div>

                {/* Display Images */}
                <div style={{ padding: "20px", border: "1px dashed #cbd5e1", borderRadius: 12, background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <label style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Display Images</label>
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748b" }}>
                      <span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>Max Size: <b style={{ color: "#0f172a" }}>2MB</b></span>
                      <span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>Min Dimensions: <b style={{ color: "#0f172a" }}>500 x 500 px</b></span>
                      <span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>Format: <b style={{ color: "#0f172a" }}>JPG, PNG, WEBP</b></span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                    {(productForm.displayImages || []).map((img, idx) => (
                      <div key={idx} style={{ position: "relative", width: 100, height: 100, borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                        <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button type="button" onClick={() => setProductForm({...productForm, displayImages: productForm.displayImages.filter((_, i) => i !== idx)})} style={{ position: "absolute", top: 4, right: 4, background: "rgba(220, 38, 38, 0.9)", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="#b91c1c"} onMouseLeave={e=>e.currentTarget.style.background="rgba(220, 38, 38, 0.9)"}><X size={14} /></button>
                      </div>
                    ))}
                    <label style={{ width: 100, height: 100, borderRadius: 12, border: "2px dashed #94a3b8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", fontSize: 12, fontWeight: 600, gap: 8, transition: "all 0.2s", background: "#fff" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#3b82f6"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.color = "#64748b"; }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={18} /></div>
                      Add Image
                      <input type="file" accept="image/*" multiple hidden onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const maxSize = 2 * 1024 * 1024;
                        files.forEach(file => {
                          if (file.size > maxSize) {
                            setStatus({ error: `"${file.name}" exceeds 2MB limit. Please choose a smaller image.`, success: "" });
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const img = new Image();
                            img.onload = () => {
                              if (img.width < 500 || img.height < 500) {
                                setStatus({ error: `"${file.name}" must be at least 500x500 pixels (current: ${img.width}x${img.height}).`, success: "" });
                                return;
                              }
                              setProductForm(prev => ({...prev, displayImages: [...(prev.displayImages || []), ev.target.result]}));
                            };
                            img.src = ev.target.result;
                          };
                          reader.readAsDataURL(file);
                        });
                        e.target.value = "";
                      }} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="hub-modal-footer" style={{ borderTop: "1px solid #e2e8f0", padding: "16px 28px", display: "flex", justifyContent: "flex-end", gap: 12, background: "#f8fafc", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                <button type="button" onClick={() => setShowProductModal(false)} style={{ padding: "10px 24px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 600, color: "#475569", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: "10px 32px", background: "#0f172a", border: "none", borderRadius: 8, fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "background 0.2s" }} onMouseEnter={e=>{if(!saving) e.currentTarget.style.background="#1e293b"}} onMouseLeave={e=>{if(!saving) e.currentTarget.style.background="#0f172a"}}>{saving ? "Saving..." : "Save Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Stock Details Modal */}
      {stockModal.open && stockModal.product && (
        <div className="hub-modal-overlay" onClick={() => { setStockModal({ open: false, product: null }); }} style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
          <div className="hub-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580, borderRadius: 16, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Update Stock Details</span>
              <button type="button" onClick={() => { setStockModal({ open: false, product: null }); }} style={{ background: "#e2e8f0", border: "none", cursor: "pointer", color: "#475569", padding: 6, borderRadius: "50%", display: "flex" }} onMouseEnter={e=>e.currentTarget.style.background="#cbd5e1"} onMouseLeave={e=>e.currentTarget.style.background="#e2e8f0"}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveStock} style={{ padding: "24px 28px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 20 }}>{stockModal.product.name}</div>

              {stockError && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, fontWeight: 500 }}>{stockError}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Stock</label>
                  <input type="number" min="0" step="any" required value={stockForm.currentStock} onChange={e => setStockForm({...stockForm, currentStock: e.target.value === "" ? "" : parseFloat(e.target.value) || 0})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Min stock</label>
                  <input type="number" min="0" step="any" required value={stockForm.minStock} onChange={e => setStockForm({...stockForm, minStock: e.target.value === "" ? "" : parseFloat(e.target.value) || 0})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>On floor</label>
                  <input type="number" min="0" step="any" required value={stockForm.onFloor} onChange={e => setStockForm({...stockForm, onFloor: e.target.value === "" ? "" : parseFloat(e.target.value) || 0})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Net Weight {stockForm.productType === "CONSUMABLE" && <span style={{ color: "#dc2626" }}>*</span>}</label>
                  <input type="number" min="0" step="any" value={stockForm.netWeight} onChange={e => setStockForm({...stockForm, netWeight: e.target.value === "" ? "" : parseFloat(e.target.value) || ""})} placeholder="0" required={stockForm.productType === "CONSUMABLE"} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: stockForm.productType === "CONSUMABLE" && (!stockForm.netWeight || Number(stockForm.netWeight) <= 0) ? "1px solid #fca5a5" : "1px solid #cbd5e1", fontSize: 14, background: stockForm.productType === "CONSUMABLE" ? "#fffbeb" : "#fff" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Primary Unit {stockForm.productType === "CONSUMABLE" && <span style={{ color: "#dc2626" }}>*</span>}</label>
                  <select value={stockForm.unit} onChange={e => setStockForm({...stockForm, unit: e.target.value})} required={stockForm.productType === "CONSUMABLE"} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: stockForm.productType === "CONSUMABLE" && !stockForm.unit ? "1px solid #fca5a5" : "1px solid #cbd5e1", fontSize: 14, background: stockForm.productType === "CONSUMABLE" ? "#fffbeb" : "#fff", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
                    <option value="">Select Unit</option>
                    {["mg", "gm", "kg", "oz", "ltr", "ml", "sachet", "ox", "can", "pcs", "carton", "roll", "pkt", "box", "unit", "btl", "jar", "cane"].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6, display: "block" }}>Secondary Unit <span style={{ fontSize: 11, color: "#94a3b8" }}>(consumption unit)</span></label>
                  <select value={stockForm.secondaryUnit} onChange={e => setStockForm({...stockForm, secondaryUnit: e.target.value})} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "#fff", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
                    <option value="">Select Secondary Unit</option>
                    {["mg", "gm", "kg", "oz", "ltr", "ml", "sachet", "ox", "can", "pcs", "carton", "roll", "pkt", "box", "unit", "btl", "jar", "cane"].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div></div>
              </div>

              <div style={{ display: "flex", gap: 24, marginBottom: 24, padding: "16px 20px", border: "1px solid #f1f5f9", borderRadius: 12, background: "#f8fafc" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                  <span style={{ color: "#64748b" }}>Retail</span>
                  <button type="button" onClick={() => setStockForm({...stockForm, productType: stockForm.productType === "RETAIL" ? "CONSUMABLE" : "RETAIL"})} style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: stockForm.productType === "RETAIL" ? "#3b82f6" : "#cbd5e1", position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: stockForm.productType === "RETAIL" ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </button>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                  <span style={{ color: "#64748b" }}>Consumable</span>
                  <button type="button" onClick={() => setStockForm({...stockForm, productType: stockForm.productType === "CONSUMABLE" ? "RETAIL" : "CONSUMABLE"})} style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: stockForm.productType === "CONSUMABLE" ? "#3b82f6" : "#cbd5e1", position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: stockForm.productType === "CONSUMABLE" ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </button>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #f1f5f9", paddingTop: 20 }}>
                <button type="button" onClick={() => { setStockModal({ open: false, product: null }); }} style={{ padding: "10px 24px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, fontWeight: 600, color: "#475569", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>Close</button>
                <button type="submit" disabled={stockSaving} style={{ padding: "10px 32px", background: "#2563eb", border: "none", borderRadius: 8, fontWeight: 600, color: "#fff", cursor: stockSaving ? "not-allowed" : "pointer", opacity: stockSaving ? 0.7 : 1, transition: "background 0.2s" }} onMouseEnter={e=>{if(!stockSaving) e.currentTarget.style.background="#1d4ed8"}} onMouseLeave={e=>{if(!stockSaving) e.currentTarget.style.background="#2563eb"}}>{stockSaving ? "Saving..." : "Submit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
