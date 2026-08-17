import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Search, Briefcase, Plus, Filter, Trash2, Calendar, ShoppingBag, CreditCard, TicketPercent, CheckCircle, Tag, CheckSquare, Settings2, Clock3, FlaskConical } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useSalonSettings } from "../../context/SalonSettingsContext";
import { downloadFromApi } from "../../utils/download";
import PosReceipt from "../../components/PosReceipt";

import CustomSelect from "../../components/CustomSelect";

const toAmount = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const clampMoneyInput = (value, max = Number.POSITIVE_INFINITY) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const [whole = "", ...fractionParts] = cleaned.split(".");
  const normalized = fractionParts.length ? `${whole}.${fractionParts.join("")}` : whole;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return "";
  const capped = Number.isFinite(max) ? Math.min(parsed, Math.max(0, max)) : parsed;
  return String(Number(capped.toFixed(2)));
};

export default function AppointmentCheckoutModal({ appointment, onClose, onComplete }) {
  const { auth } = useAuth();
  const { formatMoney } = useSalonSettings();
  
  const [form, setForm] = useState({
    items: appointment.items?.map(s => {
      const staffUserSalonId = s.assignedStaff?.[0]?.userSalonId || null;
      const staffName = s.assignedStaff?.[0]?.userSalon?.user?.name || null;
      return {
        ...s,
        id: undefined, // ensure we create new items for the invoice or let backend handle
        itemType: s.productId ? "PRODUCT" : "SERVICE",
        name: s.service?.name || s.product?.name || "Item",
        staffUserSalonId,
        staffName,
        qty: 1,
        unitPrice: Number(s.service?.price || s.product?.sellingPrice || 0),
        originalUnitPrice: Number(s.service?.price || s.product?.sellingPrice || 0),
        discountPct: 0,
        discountAmt: 0,
        taxPct: Number(s.service?.taxRate || s.product?.taxRate || 0)
      };
    }) || [],
    notes: appointment.notes || ""
  });
  
  const [paymentDraft, setPaymentDraft] = useState({ online: "", offline: "" });
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [consumableOverrides, setConsumableOverrides] = useState({});
  const [status, setStatus] = useState({ error: "", success: "" });
  const [isCompleting, setIsCompleting] = useState(false);
  const [billInvoice, setBillInvoice] = useState(null); // For receipt popup
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageSearch, setPackageSearch] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membershipSearch, setMembershipSearch] = useState("");
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [membershipDraft, setMembershipDraft] = useState({ staffId: "", price: "", validityDays: "", online: "", offline: "", remark: "", membershipPlanId: "", customServices: [], customProducts: [] });
  const [memServiceSearch, setMemServiceSearch] = useState("");
  const [memProductSearch, setMemProductSearch] = useState("");
  const [packageDraft, setPackageDraft] = useState({ staffId: "", price: "", validityDays: "", online: "", offline: "", remark: "", packageId: "CUSTOM", customServices: [], customProducts: [] });
  const [pkgServiceSearch, setPkgServiceSearch] = useState("");
  const [pkgProductSearch, setPkgProductSearch] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState(null);
  const [createdInvoice, setCreatedInvoice] = useState(null);

  const [showGcModal, setShowGcModal] = useState(false);
  const [gcSearch, setGcSearch] = useState("");
  const [gcModalGc, setGcModalGc] = useState(null);
  const [gcDraft, setGcDraft] = useState({ staffId: "", price: "", validityDays: "30", purchaseDate: new Date().toISOString().slice(0,10) });

  // Catalog States
  const [posTab, setPosTab] = useState("service");
  const [posGender, setPosGender] = useState(() => appointment?.customer?.gender?.toUpperCase() || "FEMALE");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [posContext, setPosContext] = useState({ services: [], products: [], serviceCategories: [], productCategories: [], staffUsers: [] });

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const [ctxRes, catRes, prodCatRes, pkgRes, memRes, gcRes] = await Promise.all([
          api.get(`/owner/pos/context?branchId=${appointment.branchId || ""}`),
          api.get("/owner/service-categories"),
          api.get("/owner/inventory/categories"),
          api.get("/owner/packages"),
          api.get("/owner/memberships"),
          api.get("/owner/gift-cards")
        ]);
        setPosContext({
          services: ctxRes.data.services || [],
          products: ctxRes.data.products || [],
          staffUsers: ctxRes.data.staffUsers || [],
          serviceCategories: catRes.data.data || catRes.data || [],
          productCategories: prodCatRes.data.data || prodCatRes.data || [],
          packages: pkgRes.data || [],
          memberships: memRes.data || [],
          giftCards: gcRes.data || []
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchContext();
  }, [appointment.branchId]);

  const serviceTileGroups = useMemo(() => {
    if (posTab !== "service") return [];
    let list = posContext.services || [];
    if (posGender) list = list.filter((service) => !service.gender || ["UNISEX", "BOTH", "ALL"].includes(service.gender.toUpperCase()) || service.gender.toUpperCase() === posGender);
    if (search) list = list.filter((service) => service.name.toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter) {
      const matchedCat = posContext.serviceCategories?.find(
        (cat) => cat.name.toLowerCase() === categoryFilter.toLowerCase()
      );
      const childCategoryIds = matchedCat?.children?.map((child) => child.id) || [];
      list = list.filter((service) => {
        const sCatName = service.category?.name || "";
        const sCatId = service.categoryId || service.category?.id || "";
        return (
          sCatName.toLowerCase() === categoryFilter.toLowerCase() ||
          childCategoryIds.includes(sCatId)
        );
      });
    }

    const grouped = {};
    list.forEach((service) => {
      const category = service.category?.name || "Other";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(service);
    });
    return Object.entries(grouped).map(([title, items]) => ({ title, items }));
  }, [posContext.services, posGender, search, categoryFilter, posTab]);

  const productTileGroups = useMemo(() => {
    if (posTab !== "product") return [];
    let list = posContext.products || [];
    // Note: Products usually don't have gender, so we don't filter products by posGender here, 
    // but the UI will still show the Female/Male buttons as requested by the user.
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter) list = list.filter((p) => p.category?.name?.toLowerCase() === categoryFilter.toLowerCase());

    const grouped = {};
    list.forEach((product) => {
      const category = product.category?.name || "Other";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(product);
    });
    return Object.entries(grouped).map(([title, items]) => ({ title, items }));
  }, [posContext.products, search, categoryFilter, posTab]);

  const addItem = (item, type) => {
    setForm(prev => {
      const existing = prev.items.find(i => (type === 'service' && i.serviceId === item.id) || (type === 'product' && i.productId === item.id));
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i => i === existing ? { ...i, qty: Number(i.qty) + 1 } : i)
        };
      }
      return {
        ...prev,
        items: [...prev.items, {
          itemType: type.toUpperCase(),
          serviceId: type === 'service' ? item.id : undefined,
          productId: type === 'product' ? item.id : undefined,
          service: type === 'service' ? item : undefined,
          product: type === 'product' ? item : undefined,
          name: item.name,
          staffUserSalonId: "",
          staffName: "",
          qty: 1,
          unitPrice: Number(item.price || item.sellingPrice || 0),
          originalUnitPrice: Number(item.price || item.sellingPrice || 0),
          discountPct: 0,
          discountAmt: 0,
          taxPct: Number(item.taxRate || 0)
        }]
      };
    });
  };

  const removeItem = (index) => {
    setForm(prev => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };

  const updateItemStaff = (index, staffId) => {
    const staff = posContext.staffUsers.find(s => s.id === staffId);
    setForm(prev => {
      const newItems = [...prev.items];
      newItems[index].staffUserSalonId = staffId;
      newItems[index].staffName = staff?.user?.name || "";
      return { ...prev, items: newItems };
    });
  };

  const getItemBasePrice = (item) => {
    const original = toAmount(item.originalUnitPrice, NaN);
    if (Number.isFinite(original) && original > 0) return original;
    return toAmount(item.unitPrice, 0);
  };

  const applyItemDiscountPatch = (item, patch = {}) => {
    const basePrice = getItemBasePrice(item);
    const discountPct = Math.max(0, toAmount(
      Object.prototype.hasOwnProperty.call(patch, "discountPct") ? patch.discountPct : item.discountPct,
      0
    ));
    const discountAmt = Math.max(0, toAmount(
      Object.prototype.hasOwnProperty.call(patch, "discountAmt") ? patch.discountAmt : item.discountAmt,
      0
    ));
    const discountedPrice = Math.max(0, basePrice - ((basePrice * discountPct) / 100) - discountAmt);
    return {
      ...item,
      ...patch,
      originalUnitPrice: basePrice,
      discountPct,
      discountAmt,
      unitPrice: Number(discountedPrice.toFixed(2))
    };
  };

  const handleAddMembershipToCart = () => {
    if (!selectedMembership) return;
    if (!membershipDraft.staffId) {
      alert("Please select a staff member to assign the membership");
      return;
    }
    const staff = posContext.staffUsers.find(s => s.id === membershipDraft.staffId);
    setForm(prev => {
      return {
        ...prev,
        items: [...prev.items, {
          itemType: "MEMBERSHIP",
          membershipPlanId: selectedMembership.id,
          name: selectedMembership.name,
          staffUserSalonId: membershipDraft.staffId || "",
          staffName: staff?.user?.name || "",
          qty: 1,
          unitPrice: Number(membershipDraft.price || 0),
          originalUnitPrice: Number(membershipDraft.price || 0),
          discountPct: 0,
          discountAmt: 0,
          taxPct: 0,
          isCustom: false,
          remark: membershipDraft.remark || ""
        }]
      };
    });
    // add payment to draft
    setPaymentDraft(prev => ({
      online: String(Number(prev.online || 0) + Number(membershipDraft.online || 0)),
      offline: String(Number(prev.offline || 0) + Number(membershipDraft.offline || 0))
    }));
    setShowMembershipModal(false);
    setSelectedMembership(null);
    setMembershipDraft({ staffId: "", price: "", validityDays: "", online: "", offline: "", remark: "", membershipPlanId: "", customServices: [], customProducts: [] });
    setMemServiceSearch("");
    setMemProductSearch("");
  };
  
  const handlePackageServiceAdd = (srv) => {
    if(!packageDraft.customServices.find(s => s.id === srv.id)) {
      setPackageDraft({...packageDraft, customServices: [...packageDraft.customServices, { ...srv, qty: 1 }]});
    }
    setPkgServiceSearch("");
  };
  const handlePackageProductAdd = (prd) => {
    if(!packageDraft.customProducts.find(p => p.id === prd.id)) {
      setPackageDraft({...packageDraft, customProducts: [...packageDraft.customProducts, prd]});
    }
    setPkgProductSearch("");
  };


  const handleAddPackageToCart = () => {
    if (!selectedPackage && packageDraft.packageId !== "CUSTOM") return;
    if (!packageDraft.staffId) {
      alert("Please select a staff member to assign the package");
      return;
    }
    const staff = posContext.staffUsers.find(s => s.id === packageDraft.staffId);
    setForm(prev => {
      return {
        ...prev,
        items: [...prev.items, {
          itemType: "PACKAGE",
          packageId: selectedPackage ? selectedPackage.id : "CUSTOM",
            name: selectedPackage ? selectedPackage.name : "Custom Package",
            staffUserSalonId: packageDraft.staffId || "",
            staffName: staff?.user?.name || "",
            qty: 1,
            unitPrice: Number(packageDraft.price || 0),
            originalUnitPrice: Number(packageDraft.price || 0),
            discountPct: 0,
            discountAmt: 0,
            taxPct: 0,
            isCustom: !selectedPackage,
            validityDays: !selectedPackage ? Number(packageDraft.validityDays || 0) : undefined,
            customServices: !selectedPackage ? packageDraft.customServices : [],
            customProducts: !selectedPackage ? packageDraft.customProducts : [],
            remark: packageDraft.remark || ""
        }]
      };
    });
    // add payment to draft
    setPaymentDraft(prev => ({
      online: String(Number(prev.online || 0) + Number(packageDraft.online || 0)),
      offline: String(Number(prev.offline || 0) + Number(packageDraft.offline || 0))
    }));
    setShowPackageModal(false);
    setSelectedPackage(null);
    setPackageDraft({ staffId: "", price: "", validityDays: "", online: "", offline: "", remark: "", packageId: "CUSTOM", customServices: [], customProducts: [] });
    setPkgServiceSearch("");
    setPkgProductSearch("");
  };

  const handleAddGcToCart = () => {
    if (!gcModalGc) return;
    if (!gcDraft.staffId) {
      alert("Please select a staff member to assign the gift card");
      return;
    }
    const staff = posContext.staffUsers.find(s => s.id === gcDraft.staffId);
    setForm(prev => {
      return {
        ...prev,
        items: [...prev.items, {
          itemType: "GIFT_CARD",
          giftCardId: gcModalGc.id,
          name: gcModalGc.name,
          staffUserSalonId: gcDraft.staffId || "",
          staffName: staff?.user?.name || "",
          qty: 1,
          unitPrice: Number(gcDraft.price || 0),
          originalUnitPrice: Number(gcDraft.price || 0),
          discountPct: 0,
          discountAmt: 0,
          taxPct: 0,
          isCustom: false,
          validityDays: Number(gcDraft.validityDays || 0),
          remark: gcDraft.remark || ""
        }]
      };
    });
    setPaymentDraft(prev => ({
      online: String(Number(prev.online || 0) + Number(gcDraft.online || 0)),
      offline: String(Number(prev.offline || 0) + Number(gcDraft.offline || 0))
    }));
    setShowGcModal(false);
    setGcModalGc(null);
    setGcDraft({ staffId: "", price: "", validityDays: "30", purchaseDate: new Date().toISOString().slice(0,10), online: "", offline: "" });
  };
  const { tax, total, balance } = useMemo(() => {
    let t = 0;
    let totalTax = 0;
    form.items.forEach(item => {
      const qty = Number(item.qty || 1);
      const price = Number(item.unitPrice || 0);
      const sub = price * qty;
      const taxRate = Number(item.taxPct || 0);
      const itemTax = (sub * taxRate) / 100;
      t += sub + itemTax;
      totalTax += itemTax;
    });
    
    const paid = Number(paymentDraft.online || 0) + Number(paymentDraft.offline || 0);
    const grandTotal = Math.max(0, t - toAmount(invoiceDiscount, 0));
    return { tax: totalTax, total: grandTotal, balance: Math.max(0, grandTotal - paid) };
  }, [form.items, paymentDraft, invoiceDiscount]);

  const applyInvoiceDiscount = () => {
    const nextValue = window.prompt("Enter invoice discount amount", String(toAmount(invoiceDiscount, 0)));
    if (nextValue === null) return;
    const parsed = Math.max(0, toAmount(nextValue, 0));
    setInvoiceDiscount(parsed);
    setStatus({ error: "", success: `Discount set to ${formatMoney(parsed)}.` });
  };

  const handleComplete = async (action) => {
    setStatus({ error: "", success: "" });

    // Direct Validation: Check if services have assigned staff
    const unassignedService = form.items.find(item => item.itemType === "SERVICE" && !item.staffUserSalonId);
    if (unassignedService) {
      setStatus({ error: `Please assign a staff member to "${unassignedService.name}".`, success: "" });
      return;
    }

    if (form.items.length === 0) {
      setStatus({ error: "Please add at least one item to the bill.", success: "" });
      return;
    }

    // Payment amount validation — at least one of Online or Offline must be > 0
    const totalPaid = Number(paymentDraft.online || 0) + Number(paymentDraft.offline || 0);
    if (totalPaid <= 0) {
      setStatus({ error: "⚠️ Please enter a payment amount first. Enter an amount in either Online or Offline.", success: "" });
      return;
    }

    setIsCompleting(true);
    try {
      let activeInvoiceId = appointment.convertedInvoiceId;

      if (!activeInvoiceId) {
        // 1. Ensure appointment is COMPLETED
        await api.patch(`/owner/appointments/${appointment.id}/status`, { status: "COMPLETED" });
        
        // 2. Convert to Invoice (this creates the base invoice from original items)
        const convertRes = await api.post(`/owner/appointments/${appointment.id}/convert-to-invoice`, { consumableOverrides });
        activeInvoiceId = convertRes.data.id;
      }

      // 3. Apply items (products & services), payments and notes
      const additionalPayments = [];
      if (Number(paymentDraft.online) > 0) additionalPayments.push({ mode: "ONLINE", amount: Number(paymentDraft.online) });
      if (Number(paymentDraft.offline) > 0) additionalPayments.push({ mode: "CASH", amount: Number(paymentDraft.offline) });

      // Always patch the invoice with the latest form.items so products, changed services, and packages are saved!
      const invoiceUpdateRes = await api.patch(`/owner/invoices/${activeInvoiceId}`, {
        notes: form.notes,
        discount: Number(invoiceDiscount || 0),
        additionalPayments,
        consumableOverrides,
        items: form.items.map(item => ({
          itemType: item.itemType,
          serviceId: item.itemType === 'SERVICE' ? (item.serviceId || null) : null,
          productId: item.itemType === 'PRODUCT' ? (item.productId || null) : null,
          packageId: item.itemType === 'PACKAGE' ? (item.packageId || null) : null,
          membershipPlanId: item.itemType === 'MEMBERSHIP' ? (item.membershipPlanId || null) : null,
          serviceName: item.name,
          staffUserSalonId: item.staffUserSalonId || null,
          staffName: item.staffName || null,
          qty: Number(item.qty || 1),
          unitPrice: Number(item.unitPrice || 0),
          discountPct: Number(item.discountPct || 0),
          discountAmt: Number(item.discountAmt || 0),
          taxPct: Number(item.taxPct || 0),
          isCustom: item.isCustom,
          validityDays: item.validityDays,
          customServices: item.customServices || []
        }))
      });

      setCreatedInvoice(invoiceUpdateRes.data);
      if (action === "VIEW") {
        setBillInvoice(invoiceUpdateRes.data);
        setShowShareModal(true);
      } else {
        onComplete(activeInvoiceId);
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to generate invoice and complete appointment.";
      setStatus({ error: errMsg, success: "" });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCloseBill = () => {
    setBillInvoice(null);
    if (appointment.convertedInvoiceId || billInvoice) {
      onComplete(billInvoice?.id || appointment.convertedInvoiceId);
    } else {
      onClose();
    }
  };

  const settingsSalonName = posContext?.settings?.advancedSettings?.genericSettings?.salonName || "";
  const salonName = settingsSalonName || auth?.membership?.salon?.name || auth?.membership?.salonName || "Salon";
  const salonPhone = auth?.membership?.salon?.phone || "";
  const salonAddress = auth?.membership?.salon?.address || appointment?.branch?.address || appointment?.branch?.name || "Main branch";

  if (billInvoice) {
    return (
      <div className="premium-modal-overlay" style={{ zIndex: 9999, background: "rgba(0,0,0,0.6)", position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PosReceipt 
          invoice={billInvoice} 
          salonName={salonName}
          salonAddress={salonAddress}
          salonPhone={salonPhone}
          onClose={handleCloseBill} 
          onPrint={() => window.print()}
          onDownload={() => downloadFromApi(`/owner/invoices/${billInvoice.id}/pdf`, { fallbackFilename: `invoice-${billInvoice.invoiceNumber || billInvoice.id}.pdf` })}
        />

        {showShareModal && createdInvoice && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", padding: "0px", borderRadius: 12, width: 450, boxShadow: "none", overflow: "hidden" }}>
              {shareError && (
                <div style={{ background: "#ff5c5c", color: "white", padding: "20px", display: "flex", alignItems: "flex-start", gap: "16px", position: "relative" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>Error</div>
                    <div style={{ fontSize: "14px", lineHeight: "1.4" }}>{shareError}</div>
                  </div>
                  <button onClick={() => setShareError(null)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", position: "absolute", top: "16px", right: "16px" }}>
                    <X size={20} />
                  </button>
                </div>
              )}
              
              <div style={{ padding: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, color: "#0f172a", fontSize: "20px", fontWeight: 700 }}>Share Invoice</h3>
                  <button onClick={() => { setShowShareModal(false); setShareError(null); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}>
                    <X size={20} />
                  </button>
                </div>

                <p style={{ color: "#64748b", fontSize: "14px", marginBottom: 24 }}>Share appointment confirmation with your customer</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button onClick={() => {
                    let invoiceDetails = `Hello ${createdInvoice.customer?.name || 'Valued Customer'}!\nThank you for visiting ${salonName}.\n\n*Invoice Details*\nInvoice #: ${createdInvoice.invoiceNumber || 'N/A'}\n\n*Items:*\n`;
                    if (createdInvoice.items && Array.isArray(createdInvoice.items)) {
                      createdInvoice.items.forEach(item => {
                        invoiceDetails += `- ${item.qty || 1}x ${item.itemName} @ ${formatMoney(item.price)}\n`;
                      });
                    }
                    invoiceDetails += `\nSubtotal: ${formatMoney(createdInvoice.subtotal)}\n`;
                    if (Number(createdInvoice.discount) > 0) invoiceDetails += `Discount: -${formatMoney(createdInvoice.discount)}\n`;
                    if (Number(createdInvoice.tax) > 0) invoiceDetails += `Tax: ${formatMoney(createdInvoice.tax)}\n`;
                    invoiceDetails += `*Grand Total: ${formatMoney(createdInvoice.total)}*\n\nWe hope to see you again soon!`;
                    
                    const text = encodeURIComponent(invoiceDetails);
                    const phone = createdInvoice.customer?.phone ? `+91${createdInvoice.customer.phone.replace(/\D/g, '')}` : '';
                    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank');
                  }} disabled={shareLoading} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "#25d366", color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontWeight: 700, fontSize: "14px", cursor: "pointer", opacity: shareLoading ? 0.7 : 1 }}>
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    Share via WhatsApp Web
                  </button>
                  
                  <button onClick={async () => {
                    setShareLoading(true);
                    setShareError(null);
                    try {
                      await api.post(`/owner/invoices/${createdInvoice.id}/share-whatsapp`);
                      setShowShareModal(false);
                      alert("WhatsApp message sent successfully");
                    } catch (err) {
                      if (err.response?.status === 402) {
                        setShareError(err.response.data.message || "Insufficient credits");
                      } else {
                        setShareError(err.response?.data?.message || "Failed to send WhatsApp message");
                      }
                    } finally {
                      setShareLoading(false);
                    }
                  }} disabled={shareLoading} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "1.5px solid #25d366", background: "white", color: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontWeight: 700, fontSize: "14px", cursor: "pointer", opacity: shareLoading ? 0.7 : 1 }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {shareLoading ? "Sending..." : "Send via WhatsApp API"}
                  </button>

                  <button onClick={async () => {
                    setShareLoading(true);
                    setShareError(null);
                    try {
                      await api.post(`/owner/invoices/${createdInvoice.id}/share-sms`);
                      setShowShareModal(false);
                      alert("SMS sent successfully");
                    } catch (err) {
                      if (err.response?.status === 402) {
                        setShareError(err.response.data.message || "Insufficient SMS credits");
                      } else {
                        setShareError(err.response?.data?.message || "Failed to send SMS message");
                      }
                    } finally {
                      setShareLoading(false);
                    }
                  }} disabled={shareLoading} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "1.5px solid #2563eb", background: "white", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontWeight: 700, fontSize: "14px", cursor: "pointer", opacity: shareLoading ? 0.7 : 1 }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    {shareLoading ? "Sending..." : "Send via SMS"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return createPortal(
    <div className="premium-modal-overlay" onClick={onClose} style={{ zIndex: 99999, background: "rgba(0,0,0,0.6)", position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="pos-dashboard-detail-modal" style={{ maxWidth: "1200px", width: "95vw", maxHeight: "90vh", background: "#f8fafc", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", boxShadow: "none" }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header Strip */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "12px", background: "white", borderBottom: "1px solid #e2e8f0" }}>
          <span style={{ color: "#f43f5e", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.5px" }}>Update Appointment (CHECKOUT)</span>
          <button type="button" onClick={onClose} style={{ position: "absolute", right: "16px", background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
        </div>

        {/* Changed grid layout to make left panel narrower (1fr 2.8fr or 300px min) */}
        <div className="pos-detail-split-pane" style={{ padding: "12px", overflowY: "auto", display: "grid", gridTemplateColumns: "minmax(260px, 1fr) 2.8fr", gap: "16px" }}>
          
          {/* Left Panel - Categories & Services / Products */}
          <div className="pos-detail-left" style={{ background: "#f1f5f9", borderRadius: "8px", padding: "10px", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "calc(90vh - 80px)", overflowY: "hidden" }}>
            
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "4px", flex: "1 0 auto" }}>
                <button onClick={() => setPosGender("FEMALE")} style={{ padding: "6px 10px", borderRadius: "6px", border: posGender === "FEMALE" ? "none" : "1px solid #cbd5e1", background: posGender === "FEMALE" ? "#3b82f6" : "white", color: posGender === "FEMALE" ? "white" : "#334155", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>Female</button>
                <button onClick={() => setPosGender("MALE")} style={{ padding: "6px 10px", borderRadius: "6px", border: posGender === "MALE" ? "none" : "1px solid #cbd5e1", background: posGender === "MALE" ? "#3b82f6" : "white", color: posGender === "MALE" ? "white" : "#334155", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>Male</button>
              </div>
              <div style={{ flex: "1 1 100%" }}>
                <input type="text" placeholder={`Search ${posTab === "service" ? "Service" : "Product"}`} value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "6px 12px", borderRadius: "20px", border: "1px solid #cbd5e1", width: "100%", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            
            <div className="no-scrollbar" style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "4px", whiteSpace: "nowrap" }}>
              <button onClick={() => setCategoryFilter("")} style={{ flexShrink: 0, padding: "6px 10px", borderRadius: "6px", border: !categoryFilter ? "2px solid #3b82f6" : "1px solid #cbd5e1", background: !categoryFilter ? "#eff6ff" : "white", color: !categoryFilter ? "#1d4ed8" : "#334155", fontWeight: !categoryFilter ? 700 : 600, fontSize: "0.7rem", cursor: "pointer" }}>ALL</button>
              {(posTab === "service" ? posContext.serviceCategories : posContext.productCategories).map(cat => (
                <button key={cat.id} onClick={() => setCategoryFilter(cat.name)} style={{ flexShrink: 0, padding: "6px 10px", borderRadius: "6px", border: categoryFilter === cat.name ? "2px solid #3b82f6" : "1px solid #cbd5e1", background: categoryFilter === cat.name ? "#eff6ff" : "white", color: categoryFilter === cat.name ? "#1d4ed8" : "#334155", fontWeight: categoryFilter === cat.name ? 700 : 600, fontSize: "0.7rem", cursor: "pointer" }}>{cat.name.toUpperCase()}</button>
              ))}
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {posTab === "service" && serviceTileGroups.map((group) => (
                <div key={group.title}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "0.8rem", fontWeight: 800 }}>{group.title}</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    {group.items.map((service) => (
                      <div key={service.id} onClick={() => addItem(service, "service")} style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "6px", cursor: "pointer", background: "white", transition: "all 0.2s", boxShadow: "none" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; }}>
                        <div style={{ fontWeight: 600, fontSize: "0.7rem", color: "#1e293b", lineHeight: "1.2" }}>{service.name}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                          <span style={{ color: "#94a3b8", fontSize: "0.6rem", textDecoration: "line-through" }}>{service.originalPrice ? service.originalPrice : ""}</span>
                          <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "0.75rem" }}>{service.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {posTab === "product" && productTileGroups.map((group) => (
                <div key={group.title}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "0.8rem", fontWeight: 800 }}>{group.title}</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    {group.items.map((product) => (
                      <div key={product.id} onClick={() => addItem(product, "product")} style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "6px", cursor: "pointer", background: "white", transition: "all 0.2s", boxShadow: "none" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; }}>
                        <div style={{ fontWeight: 600, fontSize: "0.7rem", color: "#1e293b", lineHeight: "1.2" }}>{product.name}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                          <span style={{ color: "#94a3b8", fontSize: "0.6rem", textDecoration: "line-through" }}>{product.costPrice ? product.costPrice : ""}</span>
                          <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "0.75rem" }}>{product.sellingPrice}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {posTab === "product" && productTileGroups.length === 0 && (
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "12px", textAlign: "center" }}>No products found.</div>
              )}
            </div>
          </div>

          {/* Right Panel - Cart & Checkout */}
          <div className="pos-detail-right" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            
            {/* Top Tabs */}
            <div className="no-scrollbar" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
              <button onClick={() => setPosTab("service")} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: "6px", border: posTab === "service" ? "2px solid #3b82f6" : "1px solid #e2e8f0", background: posTab === "service" ? "#eff6ff" : "white", color: posTab === "service" ? "#1d4ed8" : "#64748b", fontWeight: posTab === "service" ? 700 : 600, fontSize: "0.75rem", whiteSpace: "nowrap", cursor: "pointer" }}>Add Service</button>
              <button onClick={() => setPosTab("product")} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: "6px", border: posTab === "product" ? "2px solid #3b82f6" : "1px solid #e2e8f0", background: posTab === "product" ? "#eff6ff" : "white", color: posTab === "product" ? "#1d4ed8" : "#64748b", fontWeight: posTab === "product" ? 700 : 600, fontSize: "0.75rem", whiteSpace: "nowrap", cursor: "pointer" }}>Add Product</button>
              <button onClick={() => setShowPackageModal(true)} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "white", fontWeight: 600, color: "#1e293b", fontSize: "0.75rem", whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}>Add Package</button>
              <button onClick={() => setShowGcModal(true)} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "white", fontWeight: 600, color: "#1e293b", fontSize: "0.75rem", whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}>Add GiftCard</button>
              <button style={{ flexShrink: 0, padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "white", fontWeight: 600, color: "#1e293b", fontSize: "0.75rem", whiteSpace: "nowrap", cursor: "pointer" }} onClick={() => setShowMembershipModal(true)}>Add Membership</button>
            </div>

            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "12px", display: "flex", flexDirection: "column", flex: 1, overflowY: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", marginBottom: "8px" }}>
                <strong style={{ fontSize: "0.85rem" }}>Checkout Bill</strong>
                <span style={{ color: "#475569", fontWeight: 600, fontSize: "0.75rem" }}>{new Date(appointment.startAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")} 📅</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", rowGap: "4px", fontSize: "0.7rem", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "40%" }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Guest:</span>
                  <span style={{ fontWeight: 700, background: "#f8fafc", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appointment.customer?.name || "Walk-in"}</span>
                </div>
                <div style={{ width: "20%" }}><span style={{ color: "#64748b" }}>DOB:</span> <span style={{ fontWeight: 600, color: "#1e293b" }}>NA</span></div>
                <div style={{ width: "30%" }}><span style={{ color: "#64748b" }}>Phone:</span> <span style={{ fontWeight: 600, color: "#1e293b" }}>{appointment.customer?.phone || "NA"}</span></div>
              </div>

              {status.error && (
                <div style={{ margin: "4px 0", padding: "8px 10px", borderRadius: 6, background: "#fee2e2", color: "#991b1b", fontSize: "0.75rem", fontWeight: 600, border: "1px solid #fecaca" }}>
                  {status.error}
                </div>
              )}

              <div style={{ overflowX: "auto", flex: 1 }}>
                <div style={{ minWidth: "600px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 0.5fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr", gap: "8px", padding: "8px 0", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase" }}>
                    <div>Name</div>
                    <div>Staff</div>
                    <div>Qty</div>
                    <div>Price</div>
                    <div>Sub T.</div>
                    <div>Disc%</div>
                    <div>Disc</div>
                    <div>Total</div>
                    <div>Time</div>
                    <div></div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {form.items.map((item, index) => {
                      const qty = Number(item.qty || 1);
                      const price = Number(item.unitPrice || 0);
                      const subTotal = price * qty;
                      const basePrice = getItemBasePrice(item);
                      const discountPct = toAmount(item.discountPct, 0);
                      const discountAmt = toAmount(item.discountAmt, 0);
                      const rowDiscountValue = ((basePrice * discountPct) / 100) + discountAmt;
                      const rowDiscountTotal = rowDiscountValue * qty;
                      return (
                        <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 0.5fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr", gap: "8px", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.7rem", alignItems: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ fontWeight: 600, color: "#1e293b" }}>{item.name || "Item"}</div>
                            {item.itemType === 'SERVICE' && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "3px" }}>
                                {posContext.services.find(s => s.id === item.serviceId)?.consumables?.map((c, i) => {
                                  const overrideKey = `${item.serviceId}:${c.productId}`;
                                  const currentVal = consumableOverrides[overrideKey] !== undefined ? consumableOverrides[overrideKey] : c.reqdQty;
                                  const unit = c.product?.secondaryUnit || c.product?.unit || 'pcs';
                                  return (
                                    <div key={i} style={{ fontSize: "0.65rem", color: "#334155", display: "flex", alignItems: "center", gap: "4px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", width: "fit-content" }}>
                                      <span style={{ color: "#2563eb", fontWeight: 600 }}>🧪 {c.product?.name}:</span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={currentVal}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setConsumableOverrides(prev => ({ ...prev, [overrideKey]: val }));
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ width: "42px", padding: "1px 3px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.65rem", textAlign: "center", fontWeight: 700, background: "#fff" }}
                                        title="Edit quantity of consumable used for this client"
                                      />
                                      <span style={{ fontWeight: 600, color: "#64748b" }}>{unit}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          
                          {/* Staff Selection Dropdown */}
                          <div>
                            {item.itemType === 'PRODUCT' ? (
                              <span style={{ color: "#94a3b8" }}>N/A</span>
                            ) : (
                              <CustomSelect 
                                value={item.staffUserSalonId || ""} 
                                onChange={(e) => updateItemStaff(index, e.target.value)}
                                style={{ width: "100%", padding: "4px", borderRadius: "4px", border: item.staffUserSalonId ? "1px solid #cbd5e1" : "1px solid #ef4444", fontSize: "0.7rem", outline: "none", background: item.staffUserSalonId ? "white" : "#fef2f2" }}
                              >
                                <option value="" disabled>Unassigned</option>
                                {posContext.staffUsers.map(staff => (
                                  <option key={staff.id} value={staff.id}>{staff.user?.name}</option>
                                ))}
                              </CustomSelect>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center" }}>
                             <input type="number" min="1" value={qty} onChange={(e) => {
                               const n = Number(e.target.value) || 1;
                               setForm(p => {
                                 const cp = [...p.items];
                                 cp[index].qty = n;
                                 return { ...p, items: cp };
                               });
                             }} style={{ width: "35px", padding: "2px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.7rem", textAlign: "center" }} />
                          </div>
                          <div style={{ color: "#16a34a", fontWeight: 600 }}>{basePrice}</div>
                          <div style={{ color: "#16a34a", fontWeight: 600 }}>{subTotal}</div>
                          <div>
                            <input
                              type="number"
                              min="0"
                              value={discountPct}
                              onChange={(e) => {
                                const nextPct = Math.max(0, toAmount(e.target.value, 0));
                                setForm((prev) => {
                                  const cp = [...prev.items];
                                  cp[index] = applyItemDiscountPatch(cp[index], { discountPct: nextPct });
                                  return { ...prev, items: cp };
                                });
                              }}
                              style={{ width: "45px", padding: "2px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.7rem", textAlign: "center" }}
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              min="0"
                              value={discountAmt}
                              onChange={(e) => {
                                const nextAmt = Math.max(0, toAmount(e.target.value, 0));
                                setForm((prev) => {
                                  const cp = [...prev.items];
                                  cp[index] = applyItemDiscountPatch(cp[index], { discountAmt: nextAmt });
                                  return { ...prev, items: cp };
                                });
                              }}
                              style={{ width: "50px", padding: "2px", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.7rem", textAlign: "center" }}
                            />
                          </div>
                          <div style={{ color: "#16a34a", fontWeight: 600 }}>{subTotal}</div>
                          <div style={{ color: "#64748b", fontSize: "0.65rem" }}>09:00 AM</div>
                          <button onClick={() => removeItem(index)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", justifyContent: "center" }}><Trash2 size={14} /></button>
                        </div>
                      );
                    })}
                    {form.items.length === 0 && (
                      <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "0.75rem" }}>
                        No items added yet. Select from the left panel.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 0 0 0", borderTop: "1px solid #e2e8f0", marginTop: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.85rem" }}>Grand Total</span>
                  <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "1rem" }}>{total.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Bottom Actions & Payment */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input 
                  type="text" 
                  style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "0.75rem" }}
                  placeholder="Add Appointment Instruction (Optional)"
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                />
                <button onClick={applyInvoiceDiscount} style={{ padding: "6px 10px", borderRadius: "20px", border: "1px solid var(--accent, #3b82f6)", background: "white", color: "var(--accent, #3b82f6)", fontWeight: 600, fontSize: "0.7rem", whiteSpace: "nowrap" }}>Apply Discount</button>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>
                Invoice Discount: <span style={{ color: "#0f172a" }}>{formatMoney(toAmount(invoiceDiscount, 0))}</span>
              </div>

              {(() => {
                const noPay = Number(paymentDraft.online || 0) + Number(paymentDraft.offline || 0) <= 0;
                const borderColor = noPay ? "#ef4444" : "#e2e8f0";
                const bgColor = noPay ? "#fff1f2" : "#f8fafc";
                return (
                  <div style={{ background: bgColor, borderRadius: "8px", border: `1px solid ${borderColor}`, padding: "10px", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <h4 style={{ margin: 0, color: "#334155", fontSize: "0.75rem", textTransform: "uppercase" }}>Payment Details</h4>
                      {noPay && <span style={{ fontSize: "0.7rem", color: "#ef4444", fontWeight: 700 }}>⚠️ Amount is required!</span>}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginBottom: "4px" }}>Online</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "white", padding: "0 8px", borderRadius: "6px", border: noPay ? "1px solid #fca5a5" : "1px solid #cbd5e1", height: "32px" }}>
                          <div style={{ color: "#10b981", fontSize: "0.8rem" }}>📱</div>
                          <input type="number" min="0" step="0.01" inputMode="decimal" value={paymentDraft.online} onFocus={() => { setPaymentDraft((prev) => ({ ...prev, online: String(Math.max(0, total - toAmount(prev.offline, 0))) })); setStatus({ error: "", success: "" }); }} onChange={(e) => { setPaymentDraft((prev) => ({ ...prev, online: clampMoneyInput(e.target.value, Math.max(0, total - toAmount(prev.offline, 0))) })); setStatus({ error: "", success: "" }); }} max={Math.max(0, total - Number(paymentDraft.offline || 0))} placeholder="0.0" style={{ border: "none", outline: "none", width: "100%", height: "100%", padding: 0, margin: 0, background: "transparent", fontWeight: 600, fontSize: "0.8rem" }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginBottom: "4px" }}>Offline</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "white", padding: "0 8px", borderRadius: "6px", border: noPay ? "1px solid #fca5a5" : "1px solid #cbd5e1", height: "32px" }}>
                          <div style={{ color: "#10b981", fontSize: "0.8rem" }}>💵</div>
                          <input type="number" min="0" step="0.01" inputMode="decimal" value={paymentDraft.offline} onFocus={() => { setPaymentDraft((prev) => ({ ...prev, offline: String(Math.max(0, total - toAmount(prev.online, 0))) })); setStatus({ error: "", success: "" }); }} onChange={(e) => { setPaymentDraft((prev) => ({ ...prev, offline: clampMoneyInput(e.target.value, Math.max(0, total - toAmount(prev.online, 0))) })); setStatus({ error: "", success: "" }); }} max={Math.max(0, total - Number(paymentDraft.online || 0))} placeholder="0.0" style={{ border: "none", outline: "none", width: "100%", height: "100%", padding: 0, margin: 0, background: "transparent", fontWeight: 600, fontSize: "0.8rem" }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginBottom: "4px" }}>Balance</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f1f5f9", padding: "0 8px", borderRadius: "6px", border: "1px solid #cbd5e1", height: "32px" }}>
                          <div style={{ color: "#10b981", fontSize: "0.8rem" }}>💳</div>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.8rem" }}>{balance.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }} onClick={onClose}>
                  Cancel
                </button>
                <button 
                  style={{ 
                    padding: "8px 16px", borderRadius: "6px", border: "none", 
                    background: (Number(paymentDraft.online||0) + Number(paymentDraft.offline||0)) > 0 ? "#f43f5e" : "#94a3b8", 
                    color: "white", fontWeight: 600, fontSize: "0.75rem", 
                    cursor: (Number(paymentDraft.online||0) + Number(paymentDraft.offline||0)) > 0 ? "pointer" : "not-allowed", 
                    transition: "all 0.2s",
                    opacity: isCompleting ? 0.7 : 1
                  }} 
                  onClick={() => handleComplete("VIEW")} 
                  disabled={isCompleting}
                >
                  {isCompleting ? "Processing..." : "Generate Bill"}
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>

      {showGcModal && (
        <div className="premium-modal-overlay" onClick={() => setShowGcModal(false)} style={{ zIndex: 10000, background: "rgba(0,0,0,0.5)", position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: "12px", width: "900px", maxWidth: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "none" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>Add Gift Card</h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 8px" }}>
                  <input type="text" placeholder="Search For Card" value={gcSearch} onChange={(e) => setGcSearch(e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.8rem", width: "160px" }} />
                  <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}><Search size={16} /></span>
                </div>
                <button onClick={() => setShowGcModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}><X size={16} /></button>
              </div>
            </div>

            <div style={{ padding: "20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px", flexShrink: 0, minHeight: "170px" }} className="no-scrollbar">
                {(posContext.giftCards || []).filter(g => !gcSearch || g.code?.toLowerCase().includes(gcSearch.toLowerCase()) || "gift card".includes(gcSearch.toLowerCase())).map(gc => {
                  const isSelected = gcModalGc?.id === gc.id;
                  return (
                    <div 
                      key={gc.id} 
                      onClick={() => {
                        setGcModalGc({ id: gc.id, name: gc.code || "Gift Card" });
                        setGcDraft(prev => ({ ...prev, price: String(gc.amount||0), validityDays: String(gc.validityDays||30) }));
                      }}
                      style={{ 
                        flexShrink: 0, width: "300px", minHeight: "150px", padding: "16px", borderRadius: "8px", 
                        background: isSelected ? "#fce7f3" : "#f8fafc", 
                        border: isSelected ? "1px solid #f43f5e" : "1px solid #e2e8f0", 
                        cursor: "pointer", transition: "all 0.2s" 
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#1d4ed8", fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase" }}>{gc.code || "GIFT CARD"}</div>
                      <div style={{ color: "#475569", fontSize: "0.75rem", marginBottom: "4px" }}>Fee: {formatMoney(gc.amount||0)}</div>
                      <div style={{ color: "#475569", fontSize: "0.75rem", marginBottom: "12px" }}>Validity: {gc.validityDays || 30} Days</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Name</div>
                  <div style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "0.75rem", color: "#0f172a", fontWeight: 600, height: "36px", display: "flex", alignItems: "center" }}>
                    {gcModalGc ? gcModalGc.name : ""}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Validity</div>
                  <input type="number" value={gcDraft.validityDays} onChange={(e) => setGcDraft({...gcDraft, validityDays: e.target.value})} placeholder="Enter Validity" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.75rem", outline: "none", height: "36px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Price</div>
                  <input type="number" value={gcDraft.price} onChange={(e) => setGcDraft({...gcDraft, price: e.target.value})} placeholder="Enter Price" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.75rem", outline: "none", height: "36px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Staff</div>
                  <CustomSelect value={gcDraft.staffId} onChange={(e) => setGcDraft({...gcDraft, staffId: e.target.value})} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.75rem", outline: "none", height: "36px", boxSizing: "border-box", background: "white" }}>
                    <option value="" disabled>Select Staff</option>
                    {posContext.staffUsers.map(s => <option key={s.id} value={s.id}>{s.user?.name}</option>)}
                  </CustomSelect>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>Payment Details:</div>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>Balance</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", width: "120px", background: "white" }}>
                      <span>💰</span>
                      <input type="text" readOnly value={Math.max(0, toAmount(gcDraft.price, 0) - (toAmount(gcDraft.online, 0) + toAmount(gcDraft.offline, 0))).toFixed(2)} style={{ border: "none", outline: "none", width: "100%", fontSize: "0.8rem", borderBottom: "1px solid #e2e8f0", color: "var(--accent, #3b82f6)", fontWeight: 600 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>Online</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", width: "120px", background: "white" }}>
                      <span>💻</span>
                      <input type="number" min="0" step="0.01" inputMode="decimal" max={Math.max(0, toAmount(gcDraft.price, 0) - toAmount(gcDraft.offline, 0))} value={gcDraft.online} onFocus={() => { setGcDraft((prev) => ({ ...prev, online: String(Math.max(0, toAmount(prev.price, 0) - toAmount(prev.offline, 0))) })); }} onChange={(e) => setGcDraft((prev) => ({ ...prev, online: clampMoneyInput(e.target.value, Math.max(0, toAmount(prev.price, 0) - toAmount(prev.offline, 0))) }))} placeholder="0.0" style={{ border: "none", outline: "none", width: "100%", fontSize: "0.8rem", borderBottom: "1px solid #e2e8f0", color: "#10b981" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>Offline</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", width: "120px", background: "white" }}>
                      <input type="number" min="0" step="0.01" inputMode="decimal" max={Math.max(0, toAmount(gcDraft.price, 0) - toAmount(gcDraft.online, 0))} value={gcDraft.offline} onFocus={() => { setGcDraft((prev) => ({ ...prev, offline: String(Math.max(0, toAmount(prev.price, 0) - toAmount(prev.online, 0))) })); }} onChange={(e) => setGcDraft((prev) => ({ ...prev, offline: clampMoneyInput(e.target.value, Math.max(0, toAmount(prev.price, 0) - toAmount(prev.online, 0))) }))} placeholder="0.0" style={{ border: "none", outline: "none", width: "100%", fontSize: "0.8rem", borderBottom: "1px solid #e2e8f0", color: "#10b981", marginLeft: "24px" }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#f8fafc", borderRadius: "0 0 12px 12px" }}>
              <button onClick={() => setShowGcModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAddGcToCart} disabled={!gcModalGc || !gcDraft.staffId} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: (gcModalGc && gcDraft.staffId) ? "#3b82f6" : "#94a3b8", color: "white", fontWeight: 600, fontSize: "0.8rem", cursor: (gcModalGc && gcDraft.staffId) ? "pointer" : "not-allowed", transition: "all 0.2s" }}>Add Gift Card</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Package Modal */}
            {showMembershipModal && (
        <div className="premium-modal-overlay" onClick={() => setShowMembershipModal(false)} style={{ zIndex: 10000, background: "rgba(0,0,0,0.5)", position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: "12px", width: "900px", maxWidth: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "none" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>Add memberships</h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 8px" }}>
                  <input type="text" placeholder="Search For Membership" value={membershipSearch} onChange={(e) => setMembershipSearch(e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.8rem", width: "160px" }} />
                  <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}><Search size={16} /></span>
                </div>
                <button onClick={() => setShowMembershipModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}><X size={16} /></button>
              </div>
            </div>

            <div style={{ padding: "20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Memberships List */}
              <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px", flexShrink: 0, minHeight: "170px" }} className="no-scrollbar">
                {(posContext.memberships || []).filter(p => !membershipSearch || p.name.toLowerCase().includes(membershipSearch.toLowerCase())).map(pkg => {
                  const isSelected = selectedMembership?.id === pkg.id;
                  return (
                    <div 
                      key={pkg.id} 
                      onClick={() => {
                        setSelectedMembership(pkg);
                        setMembershipDraft(prev => ({ ...prev, price: pkg.price || pkg.monthlyPrice || "", validityDays: pkg.validityDays || "" }));
                      }}
                      style={{ 
                        flexShrink: 0, width: "300px", minHeight: "150px", padding: "16px", borderRadius: "8px", 
                        background: isSelected ? "#fce7f3" : "#f8fafc", 
                        border: isSelected ? "1px solid #f43f5e" : "1px solid #e2e8f0", 
                        cursor: "pointer", transition: "all 0.2s" 
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#1d4ed8", fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase" }}>{pkg.name}</div>
                      <div style={{ color: "#475569", fontSize: "0.75rem", marginBottom: "4px" }}>Fee: {formatMoney(pkg.price || pkg.monthlyPrice)}</div>
                      <div style={{ color: "#475569", fontSize: "0.75rem", marginBottom: "12px" }}>Validity: {pkg.validityDays || 30} Days</div>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.75rem", marginBottom: "6px" }}>Services:</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {(pkg.services || []).map((s, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", color: "#475569", fontSize: "0.7rem" }}>
                            <span>{s.service?.name || "Service"}</span>
                            <span>{s.sessions}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Details Form */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Name</div>
                  <div style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "0.75rem", color: "#0f172a", fontWeight: 600, height: "36px", display: "flex", alignItems: "center" }}>
                    {selectedMembership ? selectedMembership.name : ""}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Validity</div>
                  <input type="number" value={membershipDraft.validityDays} onChange={(e) => setMembershipDraft({...membershipDraft, validityDays: e.target.value})} placeholder="Enter Validity" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.75rem", outline: "none", height: "36px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Price</div>
                  <input type="number" value={membershipDraft.price} onChange={(e) => setMembershipDraft({...membershipDraft, price: e.target.value})} placeholder="Enter Price" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.75rem", outline: "none", height: "36px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Staff</div>
                  <CustomSelect value={membershipDraft.staffId} onChange={(e) => setMembershipDraft({...membershipDraft, staffId: e.target.value})} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.75rem", outline: "none", height: "36px", boxSizing: "border-box", background: "white" }}>
                    <option value="" disabled>Select Staff</option>
                    {posContext.staffUsers.map(s => <option key={s.id} value={s.id}>{s.user?.name}</option>)}
                  </CustomSelect>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Purchase date</div>
                  <div style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "0.75rem", color: "#475569", height: "36px", display: "flex", alignItems: "center" }}>
                    {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")}
                  </div>
                </div>
              </div>


              {/* Payment Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>Payment Details:</div>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>Balance</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", width: "120px", background: "white" }}>
                      <span>💰</span>
                      <input type="text" readOnly value={Math.max(0, toAmount(membershipDraft.price, 0) - (toAmount(membershipDraft.online, 0) + toAmount(membershipDraft.offline, 0))).toFixed(2)} style={{ border: "none", outline: "none", width: "100%", fontSize: "0.8rem", borderBottom: "1px solid #e2e8f0", color: "var(--accent, #3b82f6)", fontWeight: 600 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>Online</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", width: "120px", background: "white" }}>
                      <span>💻</span>
                      <input type="number" min="0" step="0.01" inputMode="decimal" max={Math.max(0, toAmount(membershipDraft.price, 0) - toAmount(membershipDraft.offline, 0))} value={membershipDraft.online} onFocus={() => { setMembershipDraft((prev) => ({ ...prev, online: String(Math.max(0, toAmount(prev.price, 0) - toAmount(prev.offline, 0))) })); }} onChange={(e) => setMembershipDraft((prev) => ({ ...prev, online: clampMoneyInput(e.target.value, Math.max(0, toAmount(prev.price, 0) - toAmount(prev.offline, 0))) }))} placeholder="0.0" style={{ border: "none", outline: "none", width: "100%", fontSize: "0.8rem", borderBottom: "1px solid #e2e8f0", color: "#10b981" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>Offline</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", width: "120px", background: "white" }}>
                      <input type="number" min="0" step="0.01" inputMode="decimal" max={Math.max(0, toAmount(membershipDraft.price, 0) - toAmount(membershipDraft.online, 0))} value={membershipDraft.offline} onFocus={() => { setMembershipDraft((prev) => ({ ...prev, offline: String(Math.max(0, toAmount(prev.price, 0) - toAmount(prev.online, 0))) })); }} onChange={(e) => setMembershipDraft((prev) => ({ ...prev, offline: clampMoneyInput(e.target.value, Math.max(0, toAmount(prev.price, 0) - toAmount(prev.online, 0))) }))} placeholder="0.0" style={{ border: "none", outline: "none", width: "100%", fontSize: "0.8rem", borderBottom: "1px solid #e2e8f0", color: "#10b981", marginLeft: "24px" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Remark */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>Remark:</div>
                <textarea value={membershipDraft.remark} onChange={(e) => setMembershipDraft({...membershipDraft, remark: e.target.value})} style={{ width: "100%", minHeight: "60px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.75rem", boxSizing: "border-box" }}></textarea>
              </div>

            </div>

            {/* Footer Buttons */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#f8fafc", borderRadius: "0 0 12px 12px" }}>
              <button onClick={() => setShowMembershipModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAddMembershipToCart} disabled={!selectedMembership && membershipDraft.membershipPlanId !== "CUSTOM"} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: (selectedMembership || membershipDraft.membershipPlanId === "CUSTOM") ? "#3b82f6" : "#94a3b8", color: "white", fontWeight: 600, fontSize: "0.8rem", cursor: (selectedMembership || membershipDraft.membershipPlanId === "CUSTOM") ? "pointer" : "not-allowed", transition: "all 0.2s" }}>Add Membership</button>
            </div>
          </div>
        </div>
      )}
      {showPackageModal && (
        <div className="premium-modal-overlay" onClick={() => setShowPackageModal(false)} style={{ zIndex: 10000, background: "rgba(0,0,0,0.5)", position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: "12px", width: "900px", maxWidth: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "none" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>Add packages</h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 8px" }}>
                  <input type="text" placeholder="Search For Package" value={packageSearch} onChange={(e) => setPackageSearch(e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.8rem", width: "160px" }} />
                  <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}><Search size={16} /></span>
                </div>
                <button onClick={() => setShowPackageModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}><X size={16} /></button>
              </div>
            </div>

            <div style={{ padding: "20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Packages List */}
              <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px", flexShrink: 0, minHeight: "170px" }} className="no-scrollbar">
                {(posContext.packages || []).filter(p => !packageSearch || p.name.toLowerCase().includes(packageSearch.toLowerCase())).map(pkg => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  return (
                    <div 
                      key={pkg.id} 
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setPackageDraft(prev => ({ 
                          ...prev, 
                          price: pkg.price || "", 
                          validityDays: pkg.validityDays || "",
                          customServices: (pkg.services || []).map(s => ({ ...s.service, qty: s.sessions || 1 }))
                        }));
                      }}
                      style={{ 
                        flexShrink: 0, width: "300px", minHeight: "150px", padding: "16px", borderRadius: "8px", 
                        background: isSelected ? "#fce7f3" : "#f8fafc", 
                        border: isSelected ? "1px solid #f43f5e" : "1px solid #e2e8f0", 
                        cursor: "pointer", transition: "all 0.2s" 
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#1d4ed8", fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase" }}>{pkg.name}</div>
                      <div style={{ color: "#475569", fontSize: "0.75rem", marginBottom: "4px" }}>Fee: {formatMoney(pkg.price)}</div>
                      <div style={{ color: "#475569", fontSize: "0.75rem", marginBottom: "12px" }}>Validity: {pkg.validityDays} Days</div>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.75rem", marginBottom: "6px" }}>Services:</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {(pkg.services || []).map((s, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", color: "#475569", fontSize: "0.7rem" }}>
                            <span>{s.service?.name || "Service"}</span>
                            <span>{s.sessions}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div style={{ flexShrink: 0, width: "200px", minHeight: "150px", padding: "16px", borderRadius: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => setSelectedPackage(null)}>
                  <span style={{ fontWeight: 700, color: "var(--accent, #3b82f6)", fontSize: "0.85rem" }}>CUSTOM PACKAGE</span>
                </div>
              </div>

              {/* Details Form */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Name</div>
                  <div style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "0.75rem", color: "#0f172a", fontWeight: 600, height: "36px", display: "flex", alignItems: "center" }}>
                    {selectedPackage ? selectedPackage.name : "CUSTOM"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Validity</div>
                  <input type="number" value={packageDraft.validityDays} onChange={(e) => setPackageDraft({...packageDraft, validityDays: e.target.value})} placeholder="Enter Validity" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.75rem", outline: "none", height: "36px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Price</div>
                  <input type="number" value={packageDraft.price} onChange={(e) => setPackageDraft({...packageDraft, price: e.target.value})} placeholder="Enter Price" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.75rem", outline: "none", height: "36px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Staff</div>
                  <CustomSelect value={packageDraft.staffId} onChange={(e) => setPackageDraft({...packageDraft, staffId: e.target.value})} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.75rem", outline: "none", height: "36px", boxSizing: "border-box", background: "white" }}>
                    <option value="" disabled>Select Staff</option>
                    {posContext.staffUsers.map(s => <option key={s.id} value={s.id}>{s.user?.name}</option>)}
                  </CustomSelect>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Purchase date</div>
                  <div style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "0.75rem", color: "#475569", height: "36px", display: "flex", alignItems: "center" }}>
                    {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")}
                  </div>
                </div>
              </div>

              {/* Add Services & Products */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {packageDraft.customServices?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "112px", width: "100%", maxWidth: "500px" }}>
                    <div style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 600, marginBottom: "4px" }}>Selected services</div>
                    {packageDraft.customServices.map(s => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 600, flex: 1 }}>{s.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <input 
                            type="number" 
                            min="1" 
                            value={s.qty || 1} 
                            onChange={(e) => {
                              const newQty = Number(e.target.value) || 1;
                              setPackageDraft(prev => ({
                                ...prev,
                                customServices: prev.customServices.map(x => x.id === s.id ? { ...x, qty: newQty } : x)
                              }));
                            }}
                            style={{ width: "60px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", textAlign: "center" }}
                          />
                          <button onClick={() => setPackageDraft({...packageDraft, customServices: packageDraft.customServices.filter(x => x.id !== s.id)})} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
                            X
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                  <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 600, width: "100px" }}>Add services</span>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 12px", flex: 1 }}>
                    <input type="text" value={pkgServiceSearch} onChange={e => setPkgServiceSearch(e.target.value)} placeholder="Search Service By Category Or Name" style={{ border: "none", outline: "none", width: "100%", fontSize: "0.75rem", background: "transparent" }} />
                    <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}><Search size={16} /></span>
                  </div>
                  {pkgServiceSearch.trim().length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: "112px", right: 0, background: "white", border: "1px solid #e2e8f0", borderRadius: "6px", zIndex: 10, maxHeight: "200px", overflowY: "auto", boxShadow: "none" }}>
                      {((typeof context !== 'undefined' ? context.services : null) || (typeof posContext !== 'undefined' ? posContext.services : null) || [])
                        .filter(s => s.name.toLowerCase().includes(pkgServiceSearch.toLowerCase()))
                        .map(s => (
                          <div key={s.id} onClick={() => handlePackageServiceAdd(s)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>{s.name}</div>
                        ))
                      }
                    </div>
                  )}
                </div>

                {packageDraft.customProducts?.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingLeft: "112px" }}>
                    {packageDraft.customProducts.map(p => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px", background: "#dcfce7", color: "#166534", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 600 }}>
                        {p.name}
                        <span style={{ cursor: "pointer", color: "#15803d" }} onClick={() => setPackageDraft({...packageDraft, customProducts: packageDraft.customProducts.filter(x => x.id !== p.id)})}>&times;</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                  <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 600, width: "100px" }}>Add products</span>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 12px", flex: 1 }}>
                    <input type="text" value={pkgProductSearch} onChange={e => setPkgProductSearch(e.target.value)} placeholder="Search Product By Category Or Name" style={{ border: "none", outline: "none", width: "100%", fontSize: "0.75rem", background: "transparent" }} />
                    <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}><Search size={16} /></span>
                  </div>
                  {pkgProductSearch.trim().length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: "112px", right: 0, background: "white", border: "1px solid #e2e8f0", borderRadius: "6px", zIndex: 10, maxHeight: "200px", overflowY: "auto", boxShadow: "none" }}>
                      {((typeof context !== 'undefined' ? context.products : null) || (typeof posContext !== 'undefined' ? posContext.products : null) || [])
                        .filter(p => p.name.toLowerCase().includes(pkgProductSearch.toLowerCase()))
                        .map(p => (
                          <div key={p.id} onClick={() => handlePackageProductAdd(p)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>{p.name}</div>
                        ))
                      }
                    </div>
                  )}
                </div>   {/* closes "Add products" row */}
              </div>     {/* closes "Add Services & Products" flex column */}

              {/* Payment Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>Payment Details:</div>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>Balance</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", width: "120px", background: "white" }}>
                      <span>💰</span>
                      <input type="text" readOnly value={Math.max(0, toAmount(packageDraft.price, 0) - (toAmount(packageDraft.online, 0) + toAmount(packageDraft.offline, 0))).toFixed(2)} style={{ border: "none", outline: "none", width: "100%", fontSize: "0.8rem", borderBottom: "1px solid #e2e8f0", color: "var(--accent, #3b82f6)", fontWeight: 600 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>Online</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", width: "120px", background: "white" }}>
                      <span>💻</span>
                      <input type="number" min="0" step="0.01" inputMode="decimal" max={Math.max(0, toAmount(packageDraft.price, 0) - toAmount(packageDraft.offline, 0))} value={packageDraft.online} onFocus={() => { setPackageDraft((prev) => ({ ...prev, online: String(Math.max(0, toAmount(prev.price, 0) - toAmount(prev.offline, 0))) })); }} onChange={(e) => setPackageDraft((prev) => ({ ...prev, online: clampMoneyInput(e.target.value, Math.max(0, toAmount(prev.price, 0) - toAmount(prev.offline, 0))) }))} placeholder="0.0" style={{ border: "none", outline: "none", width: "100%", fontSize: "0.8rem", borderBottom: "1px solid #e2e8f0", color: "#10b981" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>Offline</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", width: "120px", background: "white" }}>
                      <input type="number" min="0" step="0.01" inputMode="decimal" max={Math.max(0, toAmount(packageDraft.price, 0) - toAmount(packageDraft.online, 0))} value={packageDraft.offline} onFocus={() => { setPackageDraft((prev) => ({ ...prev, offline: String(Math.max(0, toAmount(prev.price, 0) - toAmount(prev.online, 0))) })); }} onChange={(e) => setPackageDraft((prev) => ({ ...prev, offline: clampMoneyInput(e.target.value, Math.max(0, toAmount(prev.price, 0) - toAmount(prev.online, 0))) }))} placeholder="0.0" style={{ border: "none", outline: "none", width: "100%", fontSize: "0.8rem", borderBottom: "1px solid #e2e8f0", color: "#10b981", marginLeft: "24px" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Remark */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>Remark:</div>
                <textarea value={packageDraft.remark} onChange={(e) => setPackageDraft({...packageDraft, remark: e.target.value})} style={{ width: "100%", minHeight: "60px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.75rem", boxSizing: "border-box" }}></textarea>
              </div>

            </div>

            {/* Footer Buttons */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#f8fafc", borderRadius: "0 0 12px 12px" }}>
              <button onClick={() => setShowPackageModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", color: "#475569", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAddPackageToCart} disabled={!selectedPackage} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: selectedPackage ? "#3b82f6" : "#94a3b8", color: "white", fontWeight: 600, fontSize: "0.8rem", cursor: selectedPackage ? "pointer" : "not-allowed", transition: "all 0.2s" }}>Add Package</button>
            </div>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
}

