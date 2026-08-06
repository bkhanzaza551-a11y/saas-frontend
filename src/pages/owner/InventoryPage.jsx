import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useSalonSettings } from "../../context/SalonSettingsContext";
import { useBranch } from "../../context/BranchContext";
import { formatApiError } from "../../utils/apiError";
import PageLoader from "../../components/PageLoader";
import VendorManagement from "./VendorManagement";
import IndianPhoneInput from "../../components/IndianPhoneInput";
import { Package, Search, ShoppingCart, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Tag, Layers, RefreshCw, Users, FileText, Activity, Plus, Trash2, ChevronDown, Save, Upload, Download } from "lucide-react";
import "./InventoryPage.css";

const emptyCategory = { name: "", description: "", imageUrl: "", sortOrder: 0, isPublicVisible: true };
const emptyProduct = { branchId: "", categoryId: "", name: "", productType: "RETAIL", costPrice: 0, sellingPrice: 0, currentStock: 0, minStock: 0, sku: "", barcode: "", imageUrl: "", unit: "", secondaryUnit: "", unitConversion: "", favourite: false, discountType: "", discountValue: "" };
const emptyMovement = { productId: "", branchId: "", movementType: "STOCK_IN", quantity: 1, note: "" };
const emptyVendor = { name: "", phone: "", email: "", address: "", notes: "" };
const createEmptyPoItem = () => ({ productId: "", quantityOrdered: 1, unitCost: 0 });

const getInventoryTabFromPath = (path) => {
  if (path.includes("/low-stock")) return "Low Stock";
  if (path.includes("/approval")) return "Approval";
  if (path.includes("/reconciliation")) return "Stock Reconciliation";
  if (path.includes("/purchases/vendors")) return "Vendor Management";
  if (path.includes("/purchases/orders")) return "Purchase Order";
  return "Dashboard";
};

export default function InventoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { formatMoney } = useSalonSettings();
  const { selectedBranchId } = useBranch();

  const [activeTab, setActiveTab] = useState(() => getInventoryTabFromPath(location.pathname));
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [branches, setBranches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [poFilterStatus, setPoFilterStatus] = useState("Placed");
  const [poFromDate, setPoFromDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [poToDate, setPoToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedPoId, setSelectedPoId] = useState(null);
  const [tempPoItems, setTempPoItems] = useState([]);
  const [commentText, setCommentText] = useState("");

  const [reconciliationEdits, setReconciliationEdits] = useState({});
  const [reconSearch, setReconSearch] = useState("");
  const [reconCategoryId, setReconCategoryId] = useState("All");

  const getEditValue = (productId, field, defaultValue) => {
    if (reconciliationEdits[productId]?.[field] !== undefined) {
      return reconciliationEdits[productId][field];
    }
    return defaultValue;
  };

  const handleEditChange = (productId, field, val) => {
    setReconciliationEdits(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: val
      }
    }));
  };

  const handleSaveIndividualRecon = async (product) => {
    const edits = reconciliationEdits[product.id] || {};
    const adjustStock = edits.adjustStock !== undefined ? edits.adjustStock : (product.productType === "RETAIL" ? Number(product.currentStock || 0) : 0);
    const adjustConsumable = edits.adjustConsumable !== undefined ? edits.adjustConsumable : (product.productType === "CONSUMABLE" ? Number(product.currentStock || 0) : 0);
    
    // Choose physicalStock based on type
    const physicalStock = product.productType === "CONSUMABLE" ? adjustConsumable : adjustStock;
    const remark = edits.remark || "";
    
    const branchId = product.branchId || branches[0]?.id;
    if (!branchId) {
      setStatus({ error: "No branch ID found to perform reconciliation.", success: "" });
      return;
    }

    try {
      setLoading(true);
      await api.post("/owner/purchases/reconciliation", {
        branchId,
        note: remark || `Reconciliation for ${product.name}`,
        items: [
          {
            productId: product.id,
            physicalStock
          }
        ]
      });
      setStatus({ success: `Stock reconciled for ${product.name}!`, error: "" });
      // Remove edit for this product from state since it is saved
      setReconciliationEdits(prev => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
      loadAll();
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAllRecon = async (filteredReconProducts) => {
    const items = [];
    
    // Default to first branch or branch from first product
    const defaultBranchId = branches[0]?.id || (filteredReconProducts[0] && filteredReconProducts[0].branchId);
    if (!defaultBranchId) {
      setStatus({ error: "No branch ID found.", success: "" });
      return;
    }

    // Go through the filtered list of products
    for (const p of filteredReconProducts) {
      const edits = reconciliationEdits[p.id];
      if (edits) {
        const adjustStock = edits.adjustStock !== undefined ? edits.adjustStock : (p.productType === "RETAIL" ? Number(p.currentStock || 0) : 0);
        const adjustConsumable = edits.adjustConsumable !== undefined ? edits.adjustConsumable : (p.productType === "CONSUMABLE" ? Number(p.currentStock || 0) : 0);
        const physicalStock = p.productType === "CONSUMABLE" ? adjustConsumable : adjustStock;
        
        items.push({
          productId: p.id,
          physicalStock
        });
      }
    }

    if (items.length === 0) {
      setStatus({ error: "No stock adjustments modified to update.", success: "" });
      return;
    }

    try {
      setLoading(true);
      await api.post("/owner/purchases/reconciliation", {
        branchId: defaultBranchId,
        note: "Batch stock reconciliation update",
        items
      });
      setStatus({ success: "All stock levels reconciled successfully!", error: "" });
      setReconciliationEdits({});
      loadAll();
    } catch (err) {
      setStatus({ error: formatApiError(err), success: "" });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllRecon = () => {
    setReconciliationEdits({});
  };

  const handleExportReconCsv = (rows) => {
    const header = ["productId", "sku", "name", "productType", "adjustStock", "adjustConsumable", "remark"];
    const csvRows = rows.map((product) => {
      const actualStock = product.productType === "RETAIL" ? Number(product.currentStock || 0) : 0;
      const actualConsumable = product.productType === "CONSUMABLE" ? Number(product.currentStock || 0) : 0;
      const adjustStock = getEditValue(product.id, "adjustStock", actualStock);
      const adjustConsumable = getEditValue(product.id, "adjustConsumable", actualConsumable);
      const remark = getEditValue(product.id, "remark", "");
      return [
        product.id,
        product.sku || "",
        `"${String(product.name || "").replaceAll('"', '""')}"`,
        product.productType,
        adjustStock,
        adjustConsumable,
        `"${String(remark || "").replaceAll('"', '""')}"`
      ].join(",");
    });

    const blob = new Blob([[header.join(","), ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportReconCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const [, ...lines] = text.split(/\r?\n/).filter(Boolean);
    const nextEdits = {};

    lines.forEach((line) => {
      const cells = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map((cell) => cell.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) || [];
      const [productId, sku, name, , adjustStock, adjustConsumable, remark] = cells;
      const product = products.find((entry) => (
        (productId && entry.id === productId) ||
        (sku && entry.sku === sku) ||
        (name && entry.name?.toLowerCase() === name.toLowerCase())
      ));
      if (!product) return;
      nextEdits[product.id] = {
        adjustStock: adjustStock !== undefined && adjustStock !== "" ? Number(adjustStock) : getEditValue(product.id, "adjustStock", Number(product.currentStock || 0)),
        adjustConsumable: adjustConsumable !== undefined && adjustConsumable !== "" ? Number(adjustConsumable) : getEditValue(product.id, "adjustConsumable", Number(product.currentStock || 0)),
        remark: remark || getEditValue(product.id, "remark", "")
      };
    });

    setReconciliationEdits((prev) => ({ ...prev, ...nextEdits }));
    setStatus({ success: `${Object.keys(nextEdits).length} reconciliation rows imported.`, error: "" });
    event.target.value = "";
  };


  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: "", success: "" });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isPurchaseOrderModalOpen, setIsPurchaseOrderModalOpen] = useState(false);

  const [productForm, setProductForm] = useState(emptyProduct);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [movementForm, setMovementForm] = useState(emptyMovement);
  const [vendorForm, setVendorForm] = useState(emptyVendor);
  const [purchaseOrderForm, setPurchaseOrderForm] = useState({
    branchId: "",
    vendorId: "",
    notes: "",
    items: [createEmptyPoItem()]
  });
  const reconImportRef = useRef(null);

  const loadAll = async () => {
    try {
      const branchParams = selectedBranchId ? { branchId: selectedBranchId } : {};
      const [
        categoriesResponse,
        productsResponse,
        movementsResponse,
        lowStockResponse,
        branchesResponse,
        vendorsResponse,
        ordersResponse,
        topSellingResponse
      ] = await Promise.allSettled([
        api.get("/owner/inventory/categories", { params: branchParams }),
        api.get("/owner/inventory/products", { params: branchParams }),
        api.get("/owner/inventory/stock-movements", { params: branchParams }),
        api.get("/owner/inventory/low-stock", { params: branchParams }),
        api.get("/owner/branches"),
        api.get("/owner/purchases/vendors", { params: branchParams }),
        api.get("/owner/purchases/orders", { params: branchParams }),
        api.get("/owner/inventory/top-selling-items", { params: branchParams })
      ]);

      if (categoriesResponse.status === "fulfilled") setCategories(categoriesResponse.value.data);
      else console.error(categoriesResponse.reason);

      if (productsResponse.status === "fulfilled") setProducts(productsResponse.value.data);
      else console.error(productsResponse.reason);

      if (movementsResponse.status === "fulfilled") {
        const body = movementsResponse.value.data;
        setMovements(Array.isArray(body) ? body : (body?.data || []));
      }
      else console.error(movementsResponse.reason);

      if (lowStockResponse.status === "fulfilled") setLowStock(lowStockResponse.value.data);
      else console.error(lowStockResponse.reason);

      if (branchesResponse.status === "fulfilled") setBranches(branchesResponse.value.data);
      else console.error(branchesResponse.reason);

      if (vendorsResponse.status === "fulfilled") setVendors(vendorsResponse.value.data);
      else console.error(vendorsResponse.reason);

      if (ordersResponse.status === "fulfilled") setOrders(ordersResponse.value.data);
      else console.error(ordersResponse.reason);

      if (topSellingResponse.status === "fulfilled") setTopSelling(topSellingResponse.value.data);
      else console.error(topSellingResponse.reason);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [selectedBranchId]);

  useEffect(() => {
    setActiveTab(getInventoryTabFromPath(location.pathname));
    setIsPurchaseOrderModalOpen(location.pathname.includes("/admin/purchases/orders/create"));
  }, [location.pathname]);

  useEffect(() => {
    if (isProductModalOpen || isCategoryModalOpen || isMovementModalOpen || isVendorModalOpen || isPurchaseOrderModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isProductModalOpen, isCategoryModalOpen, isMovementModalOpen, isVendorModalOpen, isPurchaseOrderModalOpen]);

  const totalStock = products.reduce((acc, p) => acc + Number(p.currentStock || 0), 0);
  const activeItems = products.filter(p => p.isActive !== false).length;
  const pendingOrders = orders.filter(o => o.status === "DRAFT").length;
  const approvedOrders = orders.filter(o => o.status === "ORDERED" || o.status === "PARTIALLY_RECEIVED" || o.status === "RECEIVED").length;
  const rejectedOrders = orders.filter(o => o.status === "CANCELLED").length;
  const stockYetToBeReceived = orders.reduce((acc, order) => (
    acc + (order.items || []).reduce((itemAcc, item) => itemAcc + Math.max(Number(item.quantityOrdered || 0) - Number(item.quantityReceived || 0), 0), 0)
  ), 0);
  const poCounts = useMemo(() => {
    const dateFiltered = orders.filter(o => {
      const oDate = new Date(o.createdAt || o.orderedAt).toISOString().slice(0, 10);
      return oDate >= poFromDate && oDate <= poToDate;
    });
    return {
      Placed: dateFiltered.filter(o => o.status === "DRAFT" || o.status === "ORDERED").length,
      Approved: dateFiltered.filter(o => o.status === "ORDERED").length,
      Rejected: dateFiltered.filter(o => o.status === "CANCELLED").length,
      Partial_Settled: dateFiltered.filter(o => o.status === "PARTIALLY_RECEIVED").length,
      Settled: dateFiltered.filter(o => o.status === "RECEIVED").length,
      Cancelled: dateFiltered.filter(o => o.status === "CANCELLED").length,
      Total: dateFiltered.length
    };
  }, [orders, poFromDate, poToDate]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const oDate = new Date(o.createdAt || o.orderedAt).toISOString().slice(0, 10);
      const inDateRange = oDate >= poFromDate && oDate <= poToDate;
      if (!inDateRange) return false;

      if (poFilterStatus === "Placed") return o.status === "DRAFT" || o.status === "ORDERED";
      if (poFilterStatus === "Approved") return o.status === "ORDERED";
      if (poFilterStatus === "Rejected") return o.status === "CANCELLED";
      if (poFilterStatus === "Partial_Settled") return o.status === "PARTIALLY_RECEIVED";
      if (poFilterStatus === "Settled") return o.status === "RECEIVED";
      if (poFilterStatus === "Cancelled") return o.status === "CANCELLED";
      return true;
    });
  }, [orders, poFilterStatus, poFromDate, poToDate]);
  const draftOrders = useMemo(() => orders.filter(o => o.status === "DRAFT"), [orders]);

  useEffect(() => {
    if (draftOrders.length > 0 && !selectedPoId) {
      setSelectedPoId(draftOrders[0].id);
    }
  }, [draftOrders, selectedPoId]);

  const selectedOrder = useMemo(() => {
    return draftOrders.find(o => o.id === selectedPoId) || draftOrders[0] || null;
  }, [draftOrders, selectedPoId]);

  const filteredReconProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(reconSearch.toLowerCase()) || 
                            (p.sku && p.sku.toLowerCase().includes(reconSearch.toLowerCase())) ||
                            (p.barcode && p.barcode.toLowerCase().includes(reconSearch.toLowerCase()));
      const matchesCategory = reconCategoryId === "All" || p.categoryId === reconCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, reconSearch, reconCategoryId]);

  const mostUsedConsumables = useMemo(() => {
    const consumedMap = {};
    movements.forEach(m => {
      if (m.product?.productType === "CONSUMABLE" && m.quantity < 0) {
        if (!consumedMap[m.product.id]) {
          consumedMap[m.product.id] = { product: m.product, totalConsumed: 0, lastUsed: m.createdAt };
        }
        consumedMap[m.product.id].totalConsumed += Math.abs(m.quantity);
        if (new Date(m.createdAt) > new Date(consumedMap[m.product.id].lastUsed)) {
          consumedMap[m.product.id].lastUsed = m.createdAt;
        }
      }
    });
    return Object.values(consumedMap)
      .sort((a, b) => b.totalConsumed - a.totalConsumed)
      .slice(0, 5);
  }, [movements]);


  useEffect(() => {
    if (selectedOrder) {
      setTempPoItems(selectedOrder.items || []);
    } else {
      setTempPoItems([]);
    }
  }, [selectedOrder]);

  useEffect(() => {
    setPurchaseOrderForm((prev) => ({
      ...prev,
      branchId: prev.branchId || branches[0]?.id || "",
      vendorId: prev.vendorId || vendors[0]?.id || "",
      items: prev.items.map((item) => {
        if (!item.productId && products[0]?.id) {
          return {
            ...item,
            productId: products[0].id,
            unitCost: item.unitCost || Number(products[0].costPrice || 0)
          };
        }
        return item;
      })
    }));
  }, [branches, vendors, products]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/owner/inventory/products", { 
        ...productForm, 
const [productForm, setProductForm] = useState({ ...emptyProduct, discountType: "", discountValue: "" });
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [movementForm, setMovementForm] = useState(emptyMovement);
  const [vendorForm, setVendorForm] = useState(emptyVendor);
  const [purchaseOrderForm, setPurchaseOrderForm] = useState({
    branchId: "",
    vendorId: "",
    notes: "",
    items: [createEmptyPoItem()]
  });
  const reconImportRef = useRef(null);

  const loadAll = async () => {
    try {
      const branchParams = selectedBranchId ? { branchId: selectedBranchId } : {};
      const [
        categoriesResponse,
        productsResponse,
        movementsResponse,
        lowStockResponse,
        branchesResponse,
        vendorsResponse,
        ordersResponse,
        topSellingResponse
      ] = await Promise.allSettled([
        api.get("/owner/inventory/categories", { params: branchParams }),
        api.get("/owner/inventory/products", { params: branchParams }),
        api.get("/owner/inventory/stock-movements", { params: branchParams }),
        api.get("/owner/inventory/low-stock", { params: branchParams }),
        api.get("/owner/branches"),
        api.get("/owner/purchases/vendors", { params: branchParams }),
        api.get("/owner/purchases/orders", { params: branchParams }),
        api.get("/owner/inventory/top-selling-items", { params: branchParams })
      ]);

      if (categoriesResponse.status === "fulfilled") setCategories(categoriesResponse.value.data);
      else console.error(categoriesResponse.reason);

      if (productsResponse.status === "fulfilled") setProducts(productsResponse.value.data);
      else console.error(productsResponse.reason);

      if (movementsResponse.status === "fulfilled") {
        const body = movementsResponse.value.data;
        setMovements(Array.isArray(body) ? body : (body?.data || []));
      }
      else console.error(movementsResponse.reason);

      if (lowStockResponse.status === "fulfilled") setLowStock(lowStockResponse.value.data);
      else console.error(lowStockResponse.reason);

      if (branchesResponse.status === "fulfilled") setBranches(branchesResponse.value.data);
      else console.error(branchesResponse.reason);

      if (vendorsResponse.status === "fulfilled") setVendors(vendorsResponse.value.data);
      else console.error(vendorsResponse.reason);

      if (ordersResponse.status === "fulfilled") setOrders(ordersResponse.value.data);
      else console.error(ordersResponse.reason);

      if (topSellingResponse.status === "fulfilled") setTopSelling(topSellingResponse.value.data);
      else console.error(topSellingResponse.reason);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [selectedBranchId]);

  useEffect(() => {
    setActiveTab(getInventoryTabFromPath(location.pathname));
    setIsPurchaseOrderModalOpen(location.pathname.includes("/admin/purchases/orders/create"));
  }, [location.pathname]);

  useEffect(() => {
    if (isProductModalOpen || isCategoryModalOpen || isMovementModalOpen || isVendorModalOpen || isPurchaseOrderModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isProductModalOpen, isCategoryModalOpen, isMovementModalOpen, isVendorModalOpen, isPurchaseOrderModalOpen]);

  const totalStock = products.reduce((acc, p) => acc + Number(p.currentStock || 0), 0);
  const activeItems = products.filter(p => p.isActive !== false).length;
  const pendingOrders = orders.filter(o => o.status === "DRAFT").length;
  const approvedOrders = orders.filter(o => o.status === "ORDERED" || o.status === "PARTIALLY_RECEIVED" || o.status === "RECEIVED").length;
  const rejectedOrders = orders.filter(o => o.status === "CANCELLED").length;
  const stockYetToBeReceived = orders.reduce((acc, order) => (
    acc + (order.items || []).reduce((itemAcc, item) => itemAcc + Math.max(Number(item.quantityOrdered || 0) - Number(item.quantityReceived || 0), 0), 0)
  ), 0);
  const poCounts = useMemo(() => {
    const dateFiltered = orders.filter(o => {
      const oDate = new Date(o.createdAt || o.orderedAt).toISOString().slice(0, 10);
      return oDate >= poFromDate && oDate <= poToDate;
    });
    return {
      Placed: dateFiltered.filter(o => o.status === "DRAFT" || o.status === "ORDERED").length,
      Approved: dateFiltered.filter(o => o.status === "ORDERED").length,
      Rejected: dateFiltered.filter(o => o.status === "CANCELLED").length,
      Partial_Settled: dateFiltered.filter(o => o.status === "PARTIALLY_RECEIVED").length,
      Settled: dateFiltered.filter(o => o.status === "RECEIVED").length,
      Cancelled: dateFiltered.filter(o => o.status === "CANCELLED").length,
      Total: dateFiltered.length
    };
  }, [orders, poFromDate, poToDate]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const oDate = new Date(o.createdAt || o.orderedAt).toISOString().slice(0, 10);
      const inDateRange = oDate >= poFromDate && oDate <= poToDate;
      if (!inDateRange) return false;

      if (poFilterStatus === "Placed") return o.status === "DRAFT" || o.status === "ORDERED";
      if (poFilterStatus === "Approved") return o.status === "ORDERED";
      if (poFilterStatus === "Rejected") return o.status === "CANCELLED";
      if (poFilterStatus === "Partial_Settled") return o.status === "PARTIALLY_RECEIVED";
      if (poFilterStatus === "Settled") return o.status === "RECEIVED";
      if (poFilterStatus === "Cancelled") return o.status === "CANCELLED";
      return true;
    });
  }, [orders, poFilterStatus, poFromDate, poToDate]);
  const draftOrders = useMemo(() => orders.filter(o => o.status === "DRAFT"), [orders]);

  useEffect(() => {
    if (draftOrders.length > 0 && !selectedPoId) {
      setSelectedPoId(draftOrders[0].id);
    }
  }, [draftOrders, selectedPoId]);

  const selectedOrder = useMemo(() => {
    return draftOrders.find(o => o.id === selectedPoId) || draftOrders[0] || null;
  }, [draftOrders, selectedPoId]);

  const filteredReconProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(reconSearch.toLowerCase()) || 
                            (p.sku && p.sku.toLowerCase().includes(reconSearch.toLowerCase())) ||
                            (p.barcode && p.barcode.toLowerCase().includes(reconSearch.toLowerCase()));
      const matchesCategory = reconCategoryId === "All" || p.categoryId === reconCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, reconSearch, reconCategoryId]);

  const mostUsedConsumables = useMemo(() => {
    const consumedMap = {};
    movements.forEach(m => {
      if (m.product?.productType === "CONSUMABLE" && m.quantity < 0) {
        if (!consumedMap[m.product.id]) {
          consumedMap[m.product.id] = { product: m.product, totalConsumed: 0, lastUsed: m.createdAt };
        }
        consumedMap[m.product.id].totalConsumed += Math.abs(m.quantity);
        if (new Date(m.createdAt) > new Date(consumedMap[m.product.id].lastUsed)) {
          consumedMap[m.product.id].lastUsed = m.createdAt;
        }
      }
    });
    return Object.values(consumedMap)
      .sort((a, b) => b.totalConsumed - a.totalConsumed)
      .slice(0, 5);
  }, [movements]);


  useEffect(() => {
    if (selectedOrder) {
      setTempPoItems(selectedOrder.items || []);
    } else {
      setTempPoItems([]);
    }
  }, [selectedOrder]);

  useEffect(() => {
    setPurchaseOrderForm((prev) => ({
      ...prev,
      branchId: prev.branchId || branches[0]?.id || "",
      vendorId: prev.vendorId || vendors[0]?.id || "",
      items: prev.items.map((item) => {
        if (!item.productId && products[0]?.id) {
          return {
            ...item,
            productId: products[0].id,
            unitCost: item.unitCost || Number(products[0].costPrice || 0)
          };
        }
        return item;
      })
    }));
  }, [branches, vendors, products]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/owner/inventory/products", { 
        ...productForm, 
        branchId: selectedBranchId || undefined,
        costPrice: Number(productForm.costPrice), 
        sellingPrice: Number(productForm.sellingPrice), 
        currentStock: Number(productForm.currentStock), 
        minStock: Number(productForm.minStock), 
        unit: productForm.unit || null,
        secondaryUnit: productForm.secondaryUnit || null,
        unitConversion: productForm.unitConversion !== "" ? Number(productForm.unitConversion) : null,
                </div>
                <div className="sp-group">
                  <label className="sp-label">Product Image</label>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    {productForm.imageUrl && <img src={productForm.imageUrl} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "1px solid #e2e8f0" }} />}
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                      Choose Image
                      <input type="file" accept="image/*" hidden onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { setStatus({ error: "Image exceeds 2MB limit.", success: "" }); return; }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const img = new Image();
                          img.onload = () => {
                            if (img.width < 500 || img.height < 500) { setStatus({ error: `Image must be at least 500x500 pixels (current: ${img.width}x${img.height}).`, success: "" }); return; }
                            setProductForm(prev => ({ ...prev, imageUrl: ev.target.result }));
                          };
                          img.src = ev.target.result;
                        };
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                    {productForm.imageUrl && <button type="button" onClick={() => setProductForm(prev => ({ ...prev, imageUrl: "" }))} style={{ padding: "6px 10px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Remove</button>}
                  </div>
                </div>
              </div>
              <div style={{ padding: 24, borderTop: "1px solid #e2e8f0", background: "white" }}>
                <button type="submit" className="sp-btn">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="slide-panel-overlay" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="slide-panel" onClick={e => e.stopPropagation()}>
            <div className="sp-header">
              <button className="sp-close" onClick={() => setIsCategoryModalOpen(false)}><ArrowLeft size={18} /></button>
              <h3>Create Category</h3>
            </div>
            <form onSubmit={handleCategorySubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <div className="sp-body">
                {status.error && <div style={{ color: '#ef4444', padding: 12, background: '#fef2f2', borderRadius: 8, fontSize: '0.9rem' }}>{status.error}</div>}
                <div className="sp-group">
                  <label className="sp-label">Category Name</label>
                  <input className="sp-input" required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="E.g., Hair Care" />
                </div>
                <div className="sp-group">
                  <label className="sp-label">Description</label>
                  <textarea className="sp-input" rows="4" value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} placeholder="Short description" />
                </div>
              </div>
              <div style={{ padding: 24, borderTop: "1px solid #e2e8f0", background: "white" }}>
                <button type="submit" className="sp-btn">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMovementModalOpen && (
        <div className="slide-panel-overlay" onClick={() => setIsMovementModalOpen(false)}>
          <div className="slide-panel" onClick={e => e.stopPropagation()}>
            <div className="sp-header">
              <button className="sp-close" onClick={() => setIsMovementModalOpen(false)}><ArrowLeft size={18} /></button>
              <h3>Record Stock Movement</h3>
            </div>
            <form onSubmit={handleMovementSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <div className="sp-body">
                {status.error && <div style={{ color: '#ef4444', padding: 12, background: '#fef2f2', borderRadius: 8, fontSize: '0.9rem' }}>{status.error}</div>}
                <div className="sp-group">
                  <label className="sp-label">Product</label>
                  <select className="sp-input" required value={movementForm.productId} onChange={e => setMovementForm({...movementForm, productId: e.target.value})}>
                    <option value="">Select product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="sp-group">
                  <label className="sp-label">Movement Type</label>
                  <select className="sp-input" value={movementForm.movementType} onChange={e => setMovementForm({...movementForm, movementType: e.target.value})}>
                    <option value="STOCK_IN">Stock In</option>
                    <option value="STOCK_OUT">Stock Out</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                <div className="sp-group">
                  <label className="sp-label">Quantity</label>
                  <input type="number" className="sp-input" required value={movementForm.quantity} onChange={e => setMovementForm({...movementForm, quantity: e.target.value})} />
                </div>
              </div>
              <div style={{ padding: 24, borderTop: "1px solid #e2e8f0", background: "white" }}>
                <button type="submit" className="sp-btn">Save Movement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isVendorModalOpen && (
        <div className="slide-panel-overlay" onClick={() => setIsVendorModalOpen(false)}>
          <div className="slide-panel" onClick={e => e.stopPropagation()}>
            <div className="sp-header">
              <button className="sp-close" onClick={() => setIsVendorModalOpen(false)}><ArrowLeft size={18} /></button>
              <h3>Create Vendor</h3>
            </div>
            <form onSubmit={handleVendorSubmit} style={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: "hidden" }}>
              <div className="sp-body">
                {status.error && <div style={{ color: "#ef4444", padding: 12, background: "#fef2f2", borderRadius: 8, fontSize: "0.9rem" }}>{status.error}</div>}
                <div className="sp-group">
                  <label className="sp-label">Vendor Name</label>
                  <input className="sp-input" required value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} placeholder="Enter vendor name" />
                </div>
                <div className="sp-group">
                  <label className="sp-label">Phone</label>
                  <IndianPhoneInput value={vendorForm.phone} onChange={(phone) => setVendorForm(prev => ({ ...prev, phone }))} />
                </div>
                <div className="sp-group">
                  <label className="sp-label">Email</label>
                  <input className="sp-input" value={vendorForm.email} onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })} placeholder="vendor@example.com" />
                </div>
                <div className="sp-group">
                  <label className="sp-label">Address</label>
                  <textarea className="sp-input" rows="3" value={vendorForm.address} onChange={e => setVendorForm({ ...vendorForm, address: e.target.value })} placeholder="Vendor address" />
                </div>
                <div className="sp-group">
                  <label className="sp-label">Notes</label>
                  <textarea className="sp-input" rows="3" value={vendorForm.notes} onChange={e => setVendorForm({ ...vendorForm, notes: e.target.value })} placeholder="Internal notes" />
                </div>
              </div>
              <div style={{ padding: 24, borderTop: "1px solid #e2e8f0", background: "white" }}>
                <button type="submit" className="sp-btn">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPurchaseOrderModalOpen && (
        <div className="slide-panel-overlay" onClick={closePurchaseOrderModal}>
          <div className="slide-panel" onClick={e => e.stopPropagation()} style={{ width: 560 }}>
            <div className="sp-header">
              <button className="sp-close" onClick={closePurchaseOrderModal}><ArrowLeft size={18} /></button>
              <h3>Create Purchase Order</h3>
            </div>
            <form onSubmit={handlePurchaseOrderSubmit} style={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: "hidden" }}>
              <div className="sp-body">
                {status.error && <div style={{ color: "#ef4444", padding: 12, background: "#fef2f2", borderRadius: 8, fontSize: "0.9rem" }}>{status.error}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="sp-group">
                    <label className="sp-label">Branch</label>
                    <input className="sp-input" value={branches.find(b => b.id === selectedBranchId)?.name || "No branch selected"} disabled style={{ background: "#f8fafc" }} />
                  </div>
                  <div className="sp-group">
                    <label className="sp-label">Vendor</label>
                    <select className="sp-input" required value={purchaseOrderForm.vendorId} onChange={e => setPurchaseOrderForm({ ...purchaseOrderForm, vendorId: e.target.value })}>
                      <option value="">Select vendor</option>
                      {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="sp-group">
                  <label className="sp-label">Notes</label>
                  <textarea className="sp-input" rows="3" value={purchaseOrderForm.notes} onChange={e => setPurchaseOrderForm({ ...purchaseOrderForm, notes: e.target.value })} placeholder="PO notes" />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="sp-label" style={{ fontSize: "1rem" }}>Items</div>
                  <button type="button" onClick={addPoItemRow} style={{ border: "none", background: "transparent", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}>
                    + Add item
                  </button>
                </div>

                {purchaseOrderForm.items.map((item, index) => {
                  const selectedProduct = products.find((product) => product.id === item.productId);
                  return (
                    <div key={`${item.productId || "item"}-${index}`} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
                      <div className="sp-group">
                        <label className="sp-label">Product</label>
                        <select
                          className="sp-input"
                          required
                          value={item.productId}
                          onChange={(e) => {
                            const nextProduct = products.find((product) => product.id === e.target.value);
                            updatePoItem(index, "productId", e.target.value);
                            updatePoItem(index, "unitCost", Number(nextProduct?.costPrice || 0));
                          }}
                        >
                          <option value="">Select product</option>
                          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                        </select>
                      </div>
                      <div className="sp-group">
                        <label className="sp-label">Qty</label>
                        <input type="number" min="1" className="sp-input" required value={item.quantityOrdered} onChange={e => updatePoItem(index, "quantityOrdered", Number(e.target.value))} />
                      </div>
                      <div className="sp-group">
                        <label className="sp-label">Unit Cost</label>
                        <input type="number" min="0" step="0.01" className="sp-input" required value={item.unitCost} onChange={e => updatePoItem(index, "unitCost", Number(e.target.value))} />
                      </div>
                      <button type="button" onClick={() => removePoItemRow(index)} style={{ border: "none", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, width: 42, height: 42, cursor: "pointer" }} title="Remove item">
                        <Trash2 size={16} />
                      </button>
                      <div style={{ gridColumn: "1 / -1", fontSize: "0.85rem", color: "#64748b" }}>
                        Current cost: {formatMoney(selectedProduct?.costPrice || 0)} | Current stock: {selectedProduct?.currentStock || 0}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: 24, borderTop: "1px solid #e2e8f0", background: "white" }}>
                <button type="submit" className="sp-btn">Create Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



