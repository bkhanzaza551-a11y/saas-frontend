import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { 
  X, 
  ChevronLeft, 
  MapPin, 
  ShieldCheck, 
  Smartphone, 
  KeyRound, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Sparkles,
  Camera 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useBranch } from '../../context/BranchContext';
import PermissionButton from "../../components/PermissionButton";
import DigitOtpInput from "../../components/DigitOtpInput";
import "./ServiceHubPage.css";

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  const base = api.defaults.baseURL || "http://localhost:5050/api/v1";
  const root = base.replace(/\/api\/v1\/?$/, '');
  return `${root}${path.startsWith('/') ? '' : '/'}${path}`;
};
import IndianPhoneInput from "../../components/IndianPhoneInput";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { formatApiError } from "../../utils/apiError";
import { isValidIndianPhone } from "../../utils/phone";
import { ensureSingleFaceInImage, loadFaceVerificationModels } from "../../utils/faceVerification";
import CustomSelect from "../../components/CustomSelect";
import {

  clonePermissions,
  countGrantedActions,
  countGrantedModules,
  DEFAULT_PERMISSIONS,
  MODULE_GROUPS,
  PERMISSION_ACTIONS,
  resolveRoleLabel,
  ROLE_OPTIONS,
  ROLE_PRESETS
} from "./staffAccessConfig";

const makeEmptyForm = () => ({
  name: "",
  email: "",
  password: "",
  salonRole: "STAFF",
  roleTitle: "",
  phone: "",
  avatarUrl: "",
  profileNote: "",
  customRoleId: "",
  showInCatalog: false,
  attendanceEnabled: false,
  attendanceEnrollmentPhotoUrl: "",
  serviceIds: [],
  permissions: clonePermissions(DEFAULT_PERMISSIONS),
  joiningDate: "",
  designation: "",
  department: "",
  uanNumber: "",
  reportingToId: "",
  workingHours: "",
  workingHoursStart: "",
  workingHoursEnd: "",
  bankName: "",
  bankBranch: "",
  accountNumber: "",
  ifscCode: "",
  otpCode: ""
});

const moduleCatalog = MODULE_GROUPS.flatMap((group) => group.modules);

export default function UsersPage() {
  const navigate = useNavigate();
  const { selectedBranchId, branches } = useBranch();
  const [rows, setRows] = useState([]);
  const [services, setServices] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [designationOptions, setDesignationOptions] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(makeEmptyForm);
  const [tabFilter, setTabFilter] = useState("all");
  const [status, setStatus] = useState({ error: "", success: "", loading: true });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [branchForLocationModal, setBranchForLocationModal] = useState(null);
  const [staffOtpStep, setStaffOtpStep] = useState(1);
  const [resendStaffCountdown, setResendStaffCountdown] = useState(0);
  const [resendingStaffOtp, setResendingStaffOtp] = useState(false);
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [enrollmentCaptureBusy, setEnrollmentCaptureBusy] = useState(false);
  const [enrollmentCameraOpen, setEnrollmentCameraOpen] = useState(false);
  const [enrollmentCameraError, setEnrollmentCameraError] = useState("");
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const enrollmentVideoRef = useRef(null);
  const enrollmentCanvasRef = useRef(null);
  const enrollmentStreamRef = useRef(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  useEffect(() => {
    if (resendStaffCountdown > 0) {
      const timer = setTimeout(() => setResendStaffCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendStaffCountdown]);

  const handleResendStaffOtp = async () => {
    if (resendStaffCountdown > 0 || resendingStaffOtp) return;
    setResendingStaffOtp(true);
    setStatus((c) => ({ ...c, error: "" }));
    try {
      await api.post("/owner/users/send-staff-otp", { phone: form.phone });
      setStatus((c) => ({ ...c, success: `Fresh 6-digit OTP sent to ${form.phone}` }));
      setResendStaffCountdown(30);
    } catch (err) {
      setStatus((c) => ({ ...c, error: formatApiError(err, "Failed to resend verification code.") }));
    } finally {
      setResendingStaffOtp(false);
    }
  };

  const openEnrollmentCamera = async () => {
    setEnrollmentCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      enrollmentStreamRef.current = stream;
      setEnrollmentCameraOpen(true);
    } catch (err) {
      let msg = "Camera permission is required to capture enrollment selfie.";
      if (err?.name === "NotAllowedError") msg = "Camera permission denied. Please allow camera access in browser settings.";
      if (err?.name === "NotFoundError") msg = "No camera found. Please connect a camera.";
      if (err?.name === "NotReadableError") msg = "Camera is already in use by another application.";
      setEnrollmentCameraError(msg);
    }
  };

  const stopEnrollmentCamera = () => {
    if (enrollmentStreamRef.current) {
      enrollmentStreamRef.current.getTracks().forEach((t) => t.stop());
      enrollmentStreamRef.current = null;
    }
    setEnrollmentCameraOpen(false);
  };

  const captureEnrollmentFrame = async () => {
    const video = enrollmentVideoRef.current;
    const canvas = enrollmentCanvasRef.current;
    if (!video || !canvas) {
      setEnrollmentCameraError("Camera not ready. Please close and reopen the camera.");
      return;
    }
    setEnrollmentCaptureBusy(true);
    setEnrollmentCameraError("");
    try {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to access camera capture.");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("Failed to capture frame.");
      const file = new File([blob], "enrollment-selfie.jpg", { type: "image/jpeg" });
      const url = await uploadEnrollmentImage(file);
      stopEnrollmentCamera();
      setEnrollmentCameraError("");
      setForm((c) => ({ ...c, attendanceEnrollmentPhotoUrl: url, attendanceEnabled: true }));
      setStatus((s) => ({ ...s, success: "Enrollment selfie captured successfully.", error: "" }));
    } catch (err) {
      console.error("[Biometric] Capture failed:", err);
      setEnrollmentCameraError(formatApiError(err, "Could not capture enrollment selfie"));
    } finally {
      setEnrollmentCaptureBusy(false);
    }
  };

  useEffect(() => {
    if (enrollmentCameraOpen && enrollmentVideoRef.current && enrollmentStreamRef.current) {
      enrollmentVideoRef.current.srcObject = enrollmentStreamRef.current;
      enrollmentVideoRef.current.play().catch(() => {});
    }
  }, [enrollmentCameraOpen]);

  useEffect(() => () => stopEnrollmentCamera(), []);

  const uploadEnrollmentImage = async (file) => {
    if (!file) return "";
    console.log("[Biometric] Running face verification...");
    await ensureSingleFaceInImage(file);
    console.log("[Biometric] Face verified, uploading...");
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data?.url || "";
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setStatus((s) => ({ ...s, error: "", success: "" }));
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setForm((f) => ({ ...f, avatarUrl: response.data?.url || "" }));
      setStatus((s) => ({ ...s, success: "Profile image uploaded successfully." }));
    } catch (err) {
      setStatus((s) => ({ ...s, error: formatApiError(err, "Failed to upload profile image.") }));
    } finally {
      setAvatarUploading(false);
    }
  };

  const load = async (branchId = selectedBranchId) => {
    try {
      const [usersResponse, servicesResponse, rolesResponse, designationsResponse] = await Promise.all([
        api.get("/owner/users", { params: { includeArchived: "true", ...(branchId ? { branchId } : {}) } }),
        api.get("/owner/services", { params: branchId ? { branchId } : {} }),
        api.get("/owner/custom-roles"),
        api.get("/owner/designations")
      ]);
      setRows(usersResponse.data);
      setServices(servicesResponse.data);
      setCustomRoles(rolesResponse.data);
      setDesignationOptions(
        Array.isArray(designationsResponse.data)
          ? designationsResponse.data.filter((row) => row?.active !== false && row?.name).map((row) => row.name)
          : []
      );
    } catch {
      // Auth expired or network error — will redirect to login
    } finally {
      setStatus((current) => ({ ...current, loading: false }));
    }
  };

  useEffect(() => {
    let active = true;
    load();
    return () => { active = false; };
  }, [selectedBranchId]);

  useEffect(() => {
    loadFaceVerificationModels()
      .then(() => console.log("[Biometric] Face verification models loaded"))
      .catch((err) => console.error("[Biometric] Failed to load face models:", err));
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (tabFilter === "active" && row.isArchived) return false;
      if (tabFilter === "archived" && !row.isArchived) return false;
      if (!deferredQuery) return true;
      const haystack = [
        row.user?.name,
        row.user?.email,
        row.phone,
        row.roleTitle,
        row.customRole?.name,
        row.branch?.name,
        row.salonRole
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(deferredQuery);
    });
  }, [deferredQuery, rows, tabFilter]);

  const selectedRow = useMemo(() => {
    if (!filteredRows.length) return null;
    return filteredRows.find((row) => row.id === selectedId) || filteredRows[0];
  }, [filteredRows, selectedId]);

  useEffect(() => {
    if (!selectedRow) {
      setSelectedId("");
      setEditingId("");
      return;
    }
    if (!selectedId || !filteredRows.some((row) => row.id === selectedId)) {
      setSelectedId(selectedRow.id);
    }
    if (editingId !== selectedRow.id && !isCreateModalOpen) {
      startEdit(selectedRow);
    }
  }, [filteredRows, selectedId, selectedRow, isCreateModalOpen]);

  const filteredServices = useMemo(() => {
    if (!selectedBranchId) return services;
    return services.filter((service) => !service.branchId || service.branchId === selectedBranchId);
  }, [selectedBranchId, services]);

  const permissionSummary = useMemo(
    () => moduleCatalog.filter((module) => Array.isArray(form.permissions[module.key]) && form.permissions[module.key].length),
    [form.permissions]
  );

  const activeDirectoryStats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.user?.isActive).length,
    catalogVisible: rows.filter((row) => row.showInCatalog).length,
    branchScoped: rows.filter((row) => row.branchId).length
  }), [rows]);

  const resetForm = () => {
    setEditingId("");
    setForm(makeEmptyForm());
    setShowMobileDetail(false);
  };

  const applyRolePreset = (roleCode) => {
    const preset = clonePermissions(ROLE_PRESETS[roleCode] || DEFAULT_PERMISSIONS);
    setForm((current) => ({
      ...current,
      salonRole: roleCode,
      customRoleId: "",
      permissions: preset
    }));
  };

  const openAccessControl = () => {
    window.open("/admin/roles-permissions", "_blank", "noopener,noreferrer");
  };

  const startCreate = () => {
    const targetBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
    if (!targetBranch || targetBranch.latitude == null || targetBranch.longitude == null) {
      setBranchForLocationModal(targetBranch || null);
      setShowLocationModal(true);
      return;
    }

    resetForm();
    setStatus((current) => ({ ...current, error: "", success: "" }));
    const defaultStaff = customRoles.find((r) => r.name?.toLowerCase() === "staff") || customRoles[0];
    if (defaultStaff) {
      applyCustomRole(defaultStaff.id);
    }
    setIsCreateModalOpen(true);
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setSelectedId(row.id);
    setForm({
      name: row.user?.name || "",
      email: row.user?.email || "",
      password: "",
      salonRole: row.salonRole,
      roleTitle: row.roleTitle || "",
      phone: row.phone || "",
      avatarUrl: row.avatarUrl || "",
      profileNote: row.profileNote || "",
      branchId: row.branchId || "",
      customRoleId: row.customRoleId || "",
      showInCatalog: Boolean(row.showInCatalog),
      attendanceEnabled: Boolean(row.attendanceEnabled),
      attendanceEnrollmentPhotoUrl: row.attendanceEnrollmentPhotoUrl || "",
      serviceIds: Array.isArray(row.serviceAssignments) ? row.serviceAssignments.map((item) => item.serviceId) : [],
      permissions: clonePermissions(row.permissions || {}),
      joiningDate: row.joiningDate ? new Date(row.joiningDate).toISOString().split('T')[0] : "",
      designation: row.designation || "",
      department: row.department || "",
      uanNumber: row.uanNumber || "",
      reportingToId: row.reportingToId || "",
      workingHours: row.workingHours || "",
      workingHoursStart: row.workingHours ? row.workingHours.split(/\s*-\s*/)[0] || "" : "",
      workingHoursEnd: row.workingHours ? row.workingHours.split(/\s*-\s*/)[1] || "" : "",
      bankName: row.bankName || "",
      bankBranch: row.bankBranch || "",
      accountNumber: row.accountNumber || "",
      ifscCode: row.ifscCode || ""
    });
    setStatus((current) => ({ ...current, error: "", success: "" }));
  };

  const toggleServiceId = (serviceId) => {
    setForm((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(serviceId)
        ? current.serviceIds.filter((item) => item !== serviceId)
        : [...current.serviceIds, serviceId]
    }));
  };

  const applyCustomRole = (roleId) => {
    const role = customRoles.find((item) => item.id === roleId);
    let resolvedSalonRole = "STAFF";
    if (role) {
      const nameLower = (role.name || "").toLowerCase();
      if (nameLower.includes("owner")) resolvedSalonRole = "SALON_OWNER";
      else if (nameLower.includes("manager")) resolvedSalonRole = "MANAGER";
      else resolvedSalonRole = "STAFF";
    }
    setForm((current) => ({
      ...current,
      customRoleId: roleId,
      salonRole: resolvedSalonRole,
      roleTitle: role?.name || current.roleTitle,
      permissions: clonePermissions(role?.permissions || DEFAULT_PERMISSIONS)
    }));
  };

  const submitEdit = async (event) => {
    if (event) event.preventDefault();
    const targetId = editingId || selectedRow?.id;
    if (!targetId) {
      setStatus((current) => ({ ...current, error: "Please select a staff member first.", success: "" }));
      return;
    }

    setStatus((current) => ({ ...current, error: "", success: "" }));
    try {
      if (form.phone && !isValidIndianPhone(form.phone)) {
        return setStatus((current) => ({ ...current, error: "Enter a valid phone number (10-15 digits with optional country code)", success: "" }));
      }
      if (form.uanNumber && form.uanNumber.trim() && !/^\d{12}$/.test(form.uanNumber.trim())) {
        return setStatus((current) => ({ ...current, error: "UAN must be exactly 12 digits", success: "" }));
      }
      if (form.accountNumber && form.accountNumber.trim() && !/^\d{9,18}$/.test(form.accountNumber.trim())) {
        return setStatus((current) => ({ ...current, error: "Account number must be 9-18 digits", success: "" }));
      }
      if (form.ifscCode && form.ifscCode.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifscCode.trim())) {
        return setStatus((current) => ({ ...current, error: "Invalid IFSC code format (e.g. HDFC0001234)", success: "" }));
      }

      const payload = {
        salonRole: form.salonRole,
        roleTitle: form.roleTitle || undefined,
        phone: form.phone || undefined,
        avatarUrl: form.avatarUrl || undefined,
        profileNote: form.profileNote || undefined,
        branchId: form.branchId || selectedBranchId || branches[0]?.id || null,
        customRoleId: form.customRoleId || undefined,
        showInCatalog: Boolean(form.showInCatalog),
        attendanceEnabled: Boolean(form.attendanceEnabled),
        attendanceEnrollmentPhotoUrl: form.attendanceEnrollmentPhotoUrl || undefined,
        serviceIds: form.serviceIds,
        permissions: form.permissions,
        joiningDate: form.joiningDate || undefined,
        designation: form.designation || undefined,
        department: form.department || undefined,
        uanNumber: form.uanNumber ? form.uanNumber.trim() : undefined,
        reportingToId: form.reportingToId || undefined,
        workingHours: form.workingHours || undefined,
        bankName: form.bankName ? form.bankName.trim() : undefined,
        bankBranch: form.bankBranch ? form.bankBranch.trim() : undefined,
        accountNumber: form.accountNumber ? form.accountNumber.trim() : undefined,
        ifscCode: form.ifscCode ? form.ifscCode.trim().toUpperCase() : undefined
      };

      await api.patch(`/owner/users/${targetId}`, payload);
      setStatus((current) => ({ ...current, error: "", success: "Staff profile and settings saved successfully!" }));
      await load(selectedBranchId);
      setTimeout(() => setStatus((current) => ({ ...current, success: "" })), 4000);
    } catch (error) {
      setStatus((current) => ({ ...current, error: formatApiError(error, "Could not update staff settings"), success: "" }));
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus((current) => ({ ...current, error: "", success: "" }));
    try {
      if (!form.name?.trim()) return setStatus((current) => ({ ...current, error: "Name is required" }));
      if (form.name.trim().length < 2) return setStatus((current) => ({ ...current, error: "Name must be at least 2 characters" }));
      if (!form.email?.trim()) return setStatus((current) => ({ ...current, error: "Email is required" }));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setStatus((current) => ({ ...current, error: "Enter a valid email address" }));
      if (!form.password) return setStatus((current) => ({ ...current, error: "Password is required" }));
      if (form.password.length < 8) return setStatus((current) => ({ ...current, error: "Password must be at least 8 characters" }));
      if (form.password.length > 128) return setStatus((current) => ({ ...current, error: "Password must be at most 128 characters" }));
      if (!form.phone || !isValidIndianPhone(form.phone)) return setStatus((current) => ({ ...current, error: "Enter a valid phone number (10-15 digits) - Required for Staff OTP" }));
      if (form.uanNumber && form.uanNumber.trim() && !/^\d{12}$/.test(form.uanNumber.trim())) return setStatus((current) => ({ ...current, error: "UAN must be exactly 12 digits" }));
      if (form.accountNumber && form.accountNumber.trim() && !/^\d{9,18}$/.test(form.accountNumber.trim())) return setStatus((current) => ({ ...current, error: "Account number must be 9-18 digits" }));
      if (form.ifscCode && form.ifscCode.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifscCode.trim())) return setStatus((current) => ({ ...current, error: "Invalid IFSC code format (e.g. HDFC0001234)" }));
      if (!form.customRoleId) return setStatus((current) => ({ ...current, error: "Please select an access role (Owner, Manager, Staff, etc.)" }));

      const payload = {
        salonRole: form.salonRole,
        roleTitle: form.roleTitle || undefined,
        phone: form.phone || undefined,
        avatarUrl: form.avatarUrl || undefined,
        profileNote: form.profileNote || undefined,
        branchId: selectedBranchId || branches[0]?.id || null,
        customRoleId: form.customRoleId || undefined,
        showInCatalog: Boolean(form.showInCatalog),
        attendanceEnabled: Boolean(form.attendanceEnabled),
        attendanceEnrollmentPhotoUrl: form.attendanceEnrollmentPhotoUrl || undefined,
        serviceIds: form.serviceIds,
        permissions: form.permissions,
        joiningDate: form.joiningDate || undefined,
        designation: form.designation || undefined,
        department: form.department || undefined,
        uanNumber: form.uanNumber ? form.uanNumber.trim() : undefined,
        reportingToId: form.reportingToId || undefined,
        workingHours: form.workingHours || undefined,
        bankName: form.bankName ? form.bankName.trim() : undefined,
        bankBranch: form.bankBranch ? form.bankBranch.trim() : undefined,
        accountNumber: form.accountNumber ? form.accountNumber.trim() : undefined,
        ifscCode: form.ifscCode ? form.ifscCode.trim().toUpperCase() : undefined
      };
      
      setSubmittingStaff(true);
      if (staffOtpStep === 1) {
        await api.post("/owner/users/send-staff-otp", { phone: form.phone });
        setStatus((current) => ({ ...current, success: `Verification code sent to ${form.phone}`, error: "" }));
        setStaffOtpStep(2);
        setResendStaffCountdown(30);
        return;
      }

      if (!form.otpCode || form.otpCode.length < 6) {
        return setStatus((current) => ({ ...current, error: "Please enter the complete 6-digit OTP code." }));
      }

      await api.post("/owner/users/create-login", {
        ...payload,
        branchId: selectedBranchId || branches[0]?.id || undefined,
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        otpCode: form.otpCode,
        joiningDate: form.joiningDate || undefined,
        designation: form.designation || undefined,
        department: form.department || undefined,
        uanNumber: form.uanNumber ? form.uanNumber.trim() : undefined,
        reportingToId: form.reportingToId || undefined,
        workingHours: form.workingHours || undefined,
        bankName: form.bankName ? form.bankName.trim() : undefined,
        bankBranch: form.bankBranch ? form.bankBranch.trim() : undefined,
        accountNumber: form.accountNumber ? form.accountNumber.trim() : undefined,
        ifscCode: form.ifscCode ? form.ifscCode.trim().toUpperCase() : undefined
      });
      setStatus((current) => ({ ...current, success: "Staff account created successfully!" }));
      setIsCreateModalOpen(false);
      setStaffOtpStep(1);
      resetForm();
      await load(selectedBranchId);
    } catch (error) {
      setStatus((current) => ({ ...current, error: formatApiError(error, "Could not save staff user"), success: "" }));
    } finally {
      setSubmittingStaff(false);
    }
  };

  const toggleUserStatus = async (row) => {
    try {
      await api.patch(`/owner/users/${row.id}/status`, { isActive: !row.user.isActive });
      await load(selectedBranchId);
    } catch (err) {
      alert("Failed to update user status.");
    }
  };

  const archiveUser = async (row) => {
    try {
      await api.patch(`/owner/users/${row.id}/archive`);
      if (editingId === row.id) {
        resetForm();
      }
      await load(selectedBranchId);
    } catch (err) {
      alert("Failed to archive user.");
    }
  };

  const unarchiveUser = async (row) => {
    try {
      await api.patch(`/owner/users/${row.id}/unarchive`);
      await load(selectedBranchId);
    } catch (err) {
      alert("Failed to unarchive user.");
    }
  };

  const handleDirectorySelect = (rowId) => {
    startTransition(() => {
      setSelectedId(rowId);
      const row = filteredRows.find((r) => r.id === rowId);
      if (row) startEdit(row);
      setShowMobileDetail(true);
    });
  };

  return (
    <div className="page-shell users-page-shell" style={{ padding: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        .users-mobile-back-btn {
          display: none;
          align-items: center;
          gap: 6px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 700;
          color: #2563eb;
          cursor: pointer;
          margin-bottom: 12px;
          width: fit-content;
        }
        @media (max-width: 900px) {
          .users-page-shell {
            height: auto !important;
            min-height: calc(100vh - 70px) !important;
            overflow-y: auto !important;
          }
          .users-page-shell .hub-container {
            flex-direction: column !important;
            height: auto !important;
            min-height: auto !important;
            display: block !important;
          }
          .users-page-shell .hub-sidebar {
            width: 100% !important;
            border-right: none !important;
            height: auto !important;
            min-height: auto !important;
            display: flex !important;
          }
          .users-page-shell .hub-sidebar.users-hide-mobile {
            display: none !important;
          }
          .users-page-shell .hub-list {
            max-height: none !important;
            overflow-y: visible !important;
          }
          .users-page-shell .hub-items-col {
            width: 100% !important;
            padding: 0 !important;
            height: auto !important;
            display: block !important;
          }
          .users-page-shell .hub-items-col.users-hide-mobile {
            display: none !important;
          }
          .users-mobile-back-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
      {enrollmentCameraOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999999, padding: 20 }}>
          <div style={{ width: 'min(100%, 460px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={20} />
                </div>
                <div>
                  <div style={{ color: 'white', fontSize: 16, fontWeight: 750, letterSpacing: '-0.01em' }}>Biometric Selfie Enrollment</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 }}>Position face inside the oval and hold steady</div>
                </div>
              </div>
              <button type="button" onClick={stopEnrollmentCamera} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }} title="Close Camera">
                <X size={18} />
              </button>
            </div>
            
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#000', aspectRatio: '4/3', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <video ref={enrollmentVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ width: 190, height: 250, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.7)', boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }} />
              </div>
              <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', padding: '6px 14px', borderRadius: 999, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: 11.5, fontWeight: 600, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                <span>Live Camera Feed</span>
              </div>
            </div>
            
            <canvas ref={enrollmentCanvasRef} style={{ display: 'none' }} />
            
            {enrollmentCameraError && (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)', color: '#fca5a5', fontSize: 12.5, fontWeight: 500, lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{enrollmentCameraError}</span>
              </div>
            )}
            
            <button
              type="button"
              onClick={() => void captureEnrollmentFrame()}
              disabled={enrollmentCaptureBusy}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                background: enrollmentCaptureBusy ? '#64748b' : 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                color: 'white', fontSize: 14.5, fontWeight: 700, cursor: enrollmentCaptureBusy ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: enrollmentCaptureBusy ? 'none' : '0 4px 14px rgba(15, 118, 110, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              {enrollmentCaptureBusy ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Verifying & Uploading...</span>
                </>
              ) : (
                <>
                  <Camera size={18} />
                  <span>Capture & Verify Face</span>
                </>
              )}
            </button>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11.5, textAlign: 'center' }}>Photo will be validated for a single clear face before saving</div>
          </div>
        </div>
      )}
      {status.loading ? (
        <PageLoader title="Loading staff workspace" message="Pulling users, saved roles, branches, and services into one permission-controlled workspace." />
      ) : null}

      <div className="hub-container" style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Left Sidebar: Directory */}
        <div className={`hub-sidebar ${showMobileDetail ? "users-hide-mobile" : ""}`} style={{ width: 340, display: 'flex', flexDirection: 'column', background: 'white', borderRight: '1px solid #e2e8f0', paddingTop: 0 }}>
          <div className="hub-sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 600 }}>Team Directory</h3>
          </div>
          
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <PermissionButton
              className="btn-submit"
              style={{ width: '100%', marginBottom: 12, padding: '10px', fontSize: 14 }}
              module="staff"
              action="create"
              onClick={startCreate}
            >
              + New Staff
            </PermissionButton>
            <input
              type="text"
              className="hub-search-input"
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10 }}
              value={query}
              placeholder="Search staff..."
              onChange={(event) => setQuery(event.target.value)}
            />
            <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 3, borderRadius: 8 }}>
              <button
                type="button"
                onClick={() => setTabFilter("all")}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  background: tabFilter === "all" ? "#ffffff" : "transparent",
                  color: tabFilter === "all" ? "#0f172a" : "#64748b",
                  cursor: "pointer",
                  boxShadow: tabFilter === "all" ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                }}
              >
                All ({rows.length})
              </button>
              <button
                type="button"
                onClick={() => setTabFilter("active")}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  background: tabFilter === "active" ? "#ffffff" : "transparent",
                  color: tabFilter === "active" ? "#16a34a" : "#64748b",
                  cursor: "pointer",
                  boxShadow: tabFilter === "active" ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                }}
              >
                Active ({rows.filter(r => !r.isArchived).length})
              </button>
              <button
                type="button"
                onClick={() => setTabFilter("archived")}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  background: tabFilter === "archived" ? "#ffffff" : "transparent",
                  color: tabFilter === "archived" ? "#dc2626" : "#64748b",
                  cursor: "pointer",
                  boxShadow: tabFilter === "archived" ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                }}
              >
                Archived ({rows.filter(r => r.isArchived).length})
              </button>
            </div>
          </div>

          <div className="hub-list" style={{ flex: 1, overflowY: 'auto' }}>
            {filteredRows.map((row) => {
              const moduleCount = countGrantedModules(row.permissions || {});
              const isActive = selectedRow?.id === row.id;
              return (
                <div
                  key={row.id}
                  className={`hub-list-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleDirectorySelect(row.id)}
                  style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', background: isActive ? '#f1f5f9' : 'white' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ color: isActive ? '#2563eb' : '#0f172a' }}>{row.user?.name}</strong>
                    {row.isArchived ? (
                      <span style={{ fontSize: 10, background: '#fef2f2', color: '#dc2626', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>Archived</span>
                    ) : (
                      <span className={`staff-status-dot ${row.user?.isActive ? "live" : "muted"}`} style={{ width: 8, height: 8, borderRadius: '50%', background: row.user?.isActive ? '#10b981' : '#94a3b8' }} />
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                    {row.roleTitle || row.customRole?.name || resolveRoleLabel(row.salonRole)}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {row.branch?.name || "All branches"} • {moduleCount} enabled modules • {row.attendanceEnabled ? "Attendance Ready" : "Attendance Off"}
                  </div>
                </div>
              );
            })}
            {!filteredRows.length && !status.loading ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                No staff match this filter
              </div>
            ) : null}
          </div>
        </div>

        <div className={`hub-items-col ${!showMobileDetail ? "users-hide-mobile" : ""}`} style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
          {selectedRow ? (
            <>
              <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ padding: "14px 20px 0 20px" }}>
                  <button
                    type="button"
                    onClick={() => setShowMobileDetail(false)}
                    className="users-mobile-back-btn"
                  >
                    <ChevronLeft size={16} /> Back to Staff Directory
                  </button>
                </div>
                <div className="responsive-profile-header" style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {selectedRow.avatarUrl ? (
                      <img src={getImageUrl(selectedRow.avatarUrl)} alt="Avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e0e7ff', boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, border: '3px solid #e0e7ff', boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                        {(selectedRow.user?.name || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
                        {selectedRow.user?.name}
                        {selectedRow.isArchived ? (
                          <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid #fecaca' }}>ARCHIVED</span>
                        ) : selectedRow.user?.isActive ? (
                          <span style={{ fontSize: 11, background: '#ecfdf5', color: '#065f46', padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span> ACTIVE
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, background: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid #e2e8f0' }}>INACTIVE</span>
                        )}
                      </div>
                      <div style={{ color: '#64748b', fontSize: 13, fontWeight: 500, marginTop: 4 }}>{selectedRow.user?.email}</div>
                    </div>
                  </div>
                  <div className="responsive-profile-header-actions" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {!selectedRow.isArchived && (
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(selectedRow)}
                        style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: selectedRow.user?.isActive ? '1px solid #fecaca' : '1px solid #bbf7d0', background: selectedRow.user?.isActive ? '#fef2f2' : '#f0fdf4', color: selectedRow.user?.isActive ? '#dc2626' : '#16a34a', transition: 'all 0.15s ease' }}
                      >
                        {selectedRow.user?.isActive ? "Deactivate Login" : "Activate Login"}
                      </button>
                    )}
                    {selectedRow.isArchived ? (
                      <button 
                        type="button" 
                        onClick={() => unarchiveUser(selectedRow)}
                        style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid #86efac', background: '#f0fdf4', color: '#16a34a', transition: 'all 0.15s ease' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                        onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
                      >
                        Unarchive Profile
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => archiveUser(selectedRow)}
                        style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', transition: 'all 0.15s ease' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                      >
                        Archive Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="responsive-profile-padding" style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
                <div className="responsive-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                   <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                       <div style={{ background: '#f0fdf4', padding: 6, borderRadius: 8, color: '#16a34a' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                       <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Current Role</div>
                     </div>
                     <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{selectedRow.roleTitle || selectedRow.customRole?.name || resolveRoleLabel(selectedRow.salonRole)}</div>
                     <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{selectedRow.phone || "No phone added"}</div>
                   </div>
                   <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                       <div style={{ background: '#eff6ff', padding: 6, borderRadius: 8, color: '#2563eb' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
                       <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Page Access</div>
                     </div>
                     <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{countGrantedModules(selectedRow.permissions || {})} Modules</div>
                     <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{countGrantedActions(selectedRow.permissions || {})} switches enabled</div>
                   </div>
                   <div style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                       <div style={{ background: '#fef2f2', padding: 6, borderRadius: 8, color: '#dc2626' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
                       <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Services</div>
                     </div>
                     <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{selectedRow.serviceAssignments?.length || 0} Assigned</div>
                     <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{selectedRow.showInCatalog ? "Visible in catalog" : "Hidden from catalog"}</div>
                   </div>
                   {/* Joining Date Card */}
                   {selectedRow.joiningDate && (
                     <div style={{ background: 'linear-gradient(135deg, #fef9c3, #fef3c7)', padding: 20, borderRadius: 12, border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', gridColumn: '1 / -1' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                         <div style={{ background: '#fef3c7', padding: 6, borderRadius: 8, color: '#d97706' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
                         <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#92400e', fontWeight: 700, letterSpacing: '0.05em' }}>Joining Date</div>
                       </div>
                       <div style={{ fontSize: 18, fontWeight: 700, color: '#78350f' }}>
                         {new Date(selectedRow.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                       </div>
                       <div style={{ fontSize: 13, color: '#92400e', marginTop: 4 }}>
                         {Math.floor((new Date() - new Date(selectedRow.joiningDate)) / (1000 * 60 * 60 * 24 * 30))} months with the team
                       </div>
                     </div>
                   )}
                </div>

                <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 4px 16px rgba(15,23,42,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Edit Access & Settings</h3>
                    {status.success && <span style={{ color: '#10b981', fontSize: 13, fontWeight: 700, background: '#ecfdf5', padding: '4px 12px', borderRadius: 20, border: '1px solid #a7f3d0' }}>✓ {status.success}</span>}
                    {status.error && <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 700, background: '#fef2f2', padding: '4px 12px', borderRadius: 20, border: '1px solid #fecaca' }}>⚠️ {status.error}</span>}
                  </div>
                  
                  <form onSubmit={submitEdit} noValidate>
                    {/* Identity Section */}
                    <div style={{ marginBottom: 32 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: 10, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identity & Scope</h4>
                      
                      {/* PRIMARY: Custom role from Access Control */}
                      <div style={{ background: '#f0f7ff', border: '1px solid #bae6fd', borderRadius: 14, padding: 18, marginBottom: 24, boxShadow: '0 2px 8px rgba(37,99,235,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>🎯 Access Role (from Access Control)</span>
                              <span style={{ background: '#2563eb', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 12, letterSpacing: 0.5 }}>RECOMMENDED</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>
                              Roles created in <strong>Settings → Access Control</strong>. Pick one to auto-apply its full permission set.
                            </div>
                          </div>
                          <button type="button" onClick={openAccessControl} style={{ background: '#ffffff', border: '1px solid #2563eb', color: '#1d4ed8', padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s ease' }}>
                            + Create New Role
                          </button>
                        </div>
                        <CustomSelect
                          className="hub-input"
                          style={{ width: '100%', background: '#ffffff', fontSize: 13, fontWeight: 600, height: 42, borderRadius: 10, border: '1px solid #93c5fd' }}
                          value={form.customRoleId || ""}
                          onChange={(event) => applyCustomRole(event.target.value)}
                        >
                          <option value="">— No saved access role (use system role below) —</option>
                          {customRoles.length === 0 && (
                            <option value="" disabled>No custom roles yet — create one in Access Control</option>
                          )}
                          {customRoles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </CustomSelect>
                        {form.customRoleId && (() => {
                          const sel = customRoles.find((r) => r.id === form.customRoleId);
                          if (!sel) return null;
                          const grantedModules = Object.entries(sel.permissions || {}).filter(([, actions]) => Array.isArray(actions) && actions.length > 0).length;
                          return (
                            <div style={{ marginTop: 10, fontSize: 12, color: '#1e40af', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span>✓ Permissions loaded: <strong>{grantedModules}</strong> module{grantedModules === 1 ? "" : "s"}</span>
                              {sel.isSystemPreset && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 12, border: '1px solid #fde68a' }}>PRESET</span>}
                            </div>
                          );
                        })()}
                      </div>
                      
                      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
                        <div className="hub-form-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block', minHeight: 22, lineHeight: '22px' }}>System role (fallback)</label>
                          <CustomSelect className="hub-input" value={form.salonRole} onChange={(event) => applyRolePreset(event.target.value)} disabled={Boolean(form.customRoleId)} style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, background: form.customRoleId ? '#f1f5f9' : '#f8fafc' }}>
                            {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                          </CustomSelect>
                          <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>Auto-set when access role picked</div>
                        </div>
                        <div className="hub-form-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block', minHeight: 22, lineHeight: '22px' }}>Role title (Visible designation)</label>
                          <input type="text" className="hub-input" value={form.roleTitle} onChange={(event) => setForm({ ...form, roleTitle: event.target.value })} placeholder="e.g. Senior Stylist, Floor Manager" style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, background: '#f8fafc', boxSizing: 'border-box' }} />
                        </div>
                        <div className="hub-form-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block', minHeight: 22, lineHeight: '22px' }}>Phone Number</label>
                          <IndianPhoneInput required={false} value={form.phone} onChange={(phone) => setForm({ ...form, phone })} className="hub-input" inputStyle={{ padding: "0 14px", height: 42, borderRadius: 10, border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: 13, fontWeight: 600 }} />
                        </div>
                        <div className="hub-form-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block', minHeight: 22, lineHeight: '22px' }}>Profile Avatar</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 42 }}>
                            {form.avatarUrl ? (
                              <img src={getImageUrl(form.avatarUrl)} alt="Avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                            ) : (
                              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                              </div>
                            )}
                            <label style={{ fontSize: 12, fontWeight: 700, padding: '8px 14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0, background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                              {avatarUploading ? "Uploading..." : "Upload Image"}
                              <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={avatarUploading} style={{ display: 'none' }} />
                            </label>
                            {form.avatarUrl && (
                              <button type="button" onClick={() => setForm({...form, avatarUrl: ""})} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Remove</button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="hub-form-group" style={{ marginTop: 16 }}>
                        <div className="hub-toggle-group">
                          <input type="checkbox" checked={form.showInCatalog} onChange={(event) => setForm({ ...form, showInCatalog: event.target.checked })} />
                          <span>Show this staff member in salon catalog / expert listing</span>
                        </div>
                      </div>
                      <div style={{ marginTop: 20, padding: 16, border: '1px solid #dbeafe', borderRadius: 10, background: '#f8fbff' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 10 }}>Owner-side Attendance Biometric</div>
                        <div className="hub-toggle-group" style={{ marginBottom: 12 }}>
                          <input type="checkbox" checked={form.attendanceEnabled} onChange={(event) => setForm({ ...form, attendanceEnabled: event.target.checked })} />
                          <span>Enable selfie attendance for this staff account</span>
                        </div>
                        <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 8 }}>Enrollment Selfie</label>
                        {form.attendanceEnrollmentPhotoUrl ? (
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <img src={getImageUrl(form.attendanceEnrollmentPhotoUrl)} alt="Enrollment selfie" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '2px solid #22c55e' }} />
                            <div style={{ display: 'grid', gap: 6 }}>
                              <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Enrollment selfie captured</div>
                              <button type="button" className="secondary-button" style={{ fontSize: 12, padding: '6px 12px', width: 'fit-content', cursor: 'pointer' }} onClick={openEnrollmentCamera}>Retake</button>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={openEnrollmentCamera} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '28px 16px', borderRadius: 10, border: '2px dashed #93c5fd', background: '#eff6ff', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                              <circle cx="12" cy="13" r="3" />
                            </svg>
                            <div style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>Capture Enrollment Selfie</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Click to open live camera and capture staff face for biometric enrollment</div>
                          </button>
                        )}
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                          Staff can only use self check-in after owner enables attendance and captures an enrollment selfie.
                        </div>
                      </div>
                    </div>

                    {/* Services Section */}
                    <div style={{ marginBottom: 32 }}>
                      <h4 style={{ fontSize: 15, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 16 }}>Assigned Services</h4>
                      <div className="staff-chip-grid">
                        {filteredServices.map((service) => (
                          <label key={service.id} className={`staff-service-chip ${form.serviceIds.includes(service.id) ? "selected" : ""}`}>
                            <input
                              type="checkbox"
                              checked={form.serviceIds.includes(service.id)}
                              onChange={() => toggleServiceId(service.id)}
                            />
                            <span>{service.name}</span>
                            <small>{service.branch?.name || "Shared"}</small>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Employment & HR Details */}
                    <div style={{ marginBottom: 32 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: 10, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employment & HR Details</h4>
                      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
                        <div className="hub-form-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block', minHeight: 22, lineHeight: '22px' }}>Date of Joining</label>
                          <input type="date" className="hub-input" value={form.joiningDate} max={new Date().toISOString().split('T')[0]} onChange={(event) => setForm({ ...form, joiningDate: event.target.value })} style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, background: '#f8fafc', boxSizing: 'border-box' }} />
                        </div>

                        <div className="hub-form-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block', minHeight: 22, lineHeight: '22px' }}>Department</label>
                          <input type="text" className="hub-input" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} placeholder="e.g. Hair, Therapy, Admin" style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, background: '#f8fafc', boxSizing: 'border-box' }} />
                        </div>

                        <div className="hub-form-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block', minHeight: 22, lineHeight: '22px' }}>Working Hours</label>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", height: 42 }}>
                            <input type="time" className="hub-input" value={form.workingHoursStart || ""} onChange={e => {
                              const start = e.target.value;
                              const end = form.workingHoursEnd || "";
                              setForm({ ...form, workingHoursStart: start, workingHours: start && end ? `${start} - ${end}` : start || "" });
                            }} style={{ flex: 1, height: 42, padding: '0 10px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, background: '#f8fafc' }} />
                            <span style={{ color: "#64748b", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>to</span>
                            <input type="time" className="hub-input" value={form.workingHoursEnd || ""} onChange={e => {
                              const end = e.target.value;
                              const start = form.workingHoursStart || "";
                              setForm({ ...form, workingHoursEnd: end, workingHours: start && end ? `${start} - ${end}` : "" });
                            }} style={{ flex: 1, height: 42, padding: '0 10px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, background: '#f8fafc' }} />
                          </div>
                        </div>

                        <div className="hub-form-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block', minHeight: 22, lineHeight: '22px' }}>Reporting To</label>
                          <CustomSelect className="hub-input" value={form.reportingToId} onChange={(event) => setForm({ ...form, reportingToId: event.target.value })} style={{ width: "100%", height: 42, padding: '0 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, background: '#f8fafc' }}>
                            <option value="">None / Self</option>
                            {rows.map((r) => r.id !== selectedRow?.id && <option key={r.id} value={r.id}>{r.user?.name || r.phone}</option>)}
                          </CustomSelect>
                        </div>

                        <div className="hub-form-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block', minHeight: 22, lineHeight: '22px' }}>UAN Number</label>
                          <input type="text" className="hub-input" value={form.uanNumber} onChange={(event) => setForm({ ...form, uanNumber: event.target.value })} placeholder="12-digit UAN" maxLength={12} style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, background: '#f8fafc', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    </div>

                    {/* Bank & Payroll Details */}
                    <div style={{ marginBottom: 32 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: 10, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank & Payroll Details</h4>
                      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                        <div className="hub-form-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>Bank Name</label>
                          <input type="text" className="hub-input" value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} placeholder="e.g. HDFC Bank" maxLength={200} style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, background: '#f8fafc', boxSizing: 'border-box' }} />
                        </div>
                        <div className="hub-form-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>Branch Name</label>
                          <input type="text" className="hub-input" value={form.bankBranch} onChange={(event) => setForm({ ...form, bankBranch: event.target.value })} placeholder="Branch Area" maxLength={200} style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, background: '#f8fafc', boxSizing: 'border-box' }} />
                        </div>
                        <div className="hub-form-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>Account Number</label>
                          <input type="text" className="hub-input" value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value })} placeholder="Account No." maxLength={18} style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, background: '#f8fafc', boxSizing: 'border-box' }} />
                        </div>
                        <div className="hub-form-group">
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>IFSC / Routing Code</label>
                          <input type="text" className="hub-input" value={form.ifscCode} onChange={(event) => setForm({ ...form, ifscCode: event.target.value.toUpperCase() })} placeholder="IFSC Code" maxLength={11} style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, background: '#f8fafc', textTransform: 'uppercase', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
                      <button type="button" className="btn-cancel" onClick={() => startEdit(selectedRow)}>Revert Changes</button>
                      <button type="submit" className="btn-submit">Save Staff Settings</button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              Select a staff member from the directory to view details
            </div>
          )}
        </div>
      </div>

      {/* Location Required Modal */}
      {showLocationModal && (
        <div className="hub-modal-overlay" style={{ zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
          <div className="hub-modal-content" style={{ maxWidth: 440, width: '100%', padding: 0, textAlign: "center", borderRadius: 20, overflow: "hidden", boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', animation: 'scaleIn 0.2s ease-out' }}>
            <div style={{ background: "linear-gradient(to bottom, #fef2f2, #fff)", padding: "40px 24px 20px", display: "flex", flexDirection: "column", alignItems: "center", borderBottom: '1px solid #fee2e2' }}>
              <div style={{ width: 72, height: 72, borderRadius: 36, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: '0 0 0 8px #fee2e2' }}>
                <MapPin size={36} color="#ef4444" strokeWidth={2.5} />
              </div>
              <h3 style={{ margin: 0, fontSize: 22, color: "#1e293b", fontWeight: 800, letterSpacing: '-0.02em' }}>Branch Location Required</h3>
            </div>
            <div style={{ padding: "24px", background: "white" }}>
              <p style={{ margin: 0, color: "#475569", fontSize: 15, lineHeight: 1.6, padding: '0 10px' }}>
                Staff add karne se pehle apni branch (<strong style={{ color: "#0f172a", fontWeight: 700 }}>{branchForLocationModal?.name || "Main Branch"}</strong>) ki location map par set karna zaroori hai, taake staff attendance aur geofencing sahi se kaam kar sake.
              </p>
              <div style={{ display: "flex", gap: 14, marginTop: 32 }}>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: "2px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 700, cursor: "pointer", fontSize: 14, transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLocationModal(false);
                    navigate(`/admin/branches?editBranchId=${branchForLocationModal?.id || ""}&openLocation=true`);
                  }}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)'; }}
                >
                  Set Location Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Staff Modal */}
      {isCreateModalOpen && (
        <div className="hub-modal-overlay" onClick={() => setIsCreateModalOpen(false)} style={{ backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.65)', zIndex: 99999 }}>
          <div className="hub-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: staffOtpStep === 2 ? 460 : 640, borderRadius: 20, boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(226, 232, 240, 0.8)', overflow: 'hidden' }}>
            {staffOtpStep === 1 ? (
              <div className="hub-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "16px 22px", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 16, fontWeight: 750, color: "#0f172a", letterSpacing: "-0.01em" }}>Create New Staff Profile</div>
                <button type="button" onClick={() => { setIsCreateModalOpen(false); setStatus({}); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4, display: "flex", borderRadius: "50%" }}><X size={18} /></button>
              </div>
            ) : (
              <div className="hub-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "14px 20px", borderBottom: "1px solid #e2e8f0" }}>
                <button type="button" onClick={() => { setStaffOtpStep(1); setStatus({}); }} style={{ background: "none", border: "none", color: "#64748b", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                  <ArrowLeft size={16} /> Back to details
                </button>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>Phone Verification</span>
                <button type="button" onClick={() => { setIsCreateModalOpen(false); setStaffOtpStep(1); setStatus({}); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4, display: "flex", borderRadius: "50%" }}><X size={18} /></button>
              </div>
            )}
            
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
              {status.error && staffOtpStep === 1 && (
                <div className="form-error-banner" style={{ padding: '10px 16px', background: '#fef2f2', color: '#b91c1c', fontSize: 13, borderBottom: '1px solid #fecaca', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={15} color="#dc2626" />
                  <span>{status.error}</span>
                </div>
              )}
              
              <div className="hub-modal-body" style={{ overflowY: 'auto', flex: 1, padding: "22px 24px", ...(staffOtpStep === 2 ? { display: 'none' } : {}) }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <span>Full Name</span>
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>*</span>
                    </label>
                    <input type="text" required className="hub-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Doe" minLength={2} maxLength={200} />
                  </div>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <span>Email Address</span>
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>*</span>
                    </label>
                    <input type="email" required className="hub-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@example.com" maxLength={254} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <span>Password</span>
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>*</span>
                    </label>
                    <input type="password" required className="hub-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 8 chars" minLength={8} maxLength={128} />
                  </div>
                  <div className="hub-form-group">
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <span>Phone</span>
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>*</span>
                    </label>
                    <IndianPhoneInput required={true} value={form.phone} onChange={(phone) => setForm({ ...form, phone })} style={{ height: 42, border: "1px solid #cbd5e1" }} inputStyle={{ padding: "0 14px", height: "100%" }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, alignItems: 'start' }}>
                  <div className="hub-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 20, minHeight: 20, marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', margin: 0, whiteSpace: 'nowrap', display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span>Access Role</span>
                        <span style={{ color: "#dc2626", fontWeight: 700 }}>*</span>
                      </div>
                      <button type="button" onClick={openAccessControl} style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600, padding: 0, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8 }}>+ Create role</button>
                    </div>
                    <CustomSelect className="hub-input" value={form.customRoleId || ""} onChange={e => applyCustomRole(e.target.value)} style={{ width: "100%", "--select-height": "42px" }}>
                      <option value="">— Select access role —</option>
                      {customRoles.length === 0 && (
                        <option value="" disabled>No custom roles yet — create one in Settings → Access Control</option>
                      )}
                      {customRoles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </CustomSelect>
                  </div>
                  <div className="hub-form-group">
                    <div style={{ display: 'flex', alignItems: 'center', height: 20, minHeight: 20, marginBottom: 6 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', margin: 0, whiteSpace: 'nowrap', display: 'flex', flexDirection: 'row' }}>Role Title (Designation)</label>
                    </div>
                    <input type="text" className="hub-input" value={form.roleTitle} onChange={e => setForm({ ...form, roleTitle: e.target.value })} placeholder="e.g. Senior Stylist" style={{ width: "100%", height: 42, boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div className="hub-form-group" style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>Branch Assignment</label>
                  <div style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#334155", background: "#f8fafc", height: 42, display: 'flex', alignItems: 'center' }}>
                    {selectedBranchId ? (branches.find(b => b.id === selectedBranchId)?.name || "Selected Branch") : "All Branches"}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Auto-assigned from topbar branch selector</div>
                </div>

                <div className="hub-form-group" style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>Profile Avatar</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {form.avatarUrl ? (
                      <img src={getImageUrl(form.avatarUrl)} alt="Avatar" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </div>
                    )}
                    <label className="secondary-button" style={{ fontSize: 12, padding: '6px 12px', cursor: 'pointer', display: 'inline-block', margin: 0 }}>
                      {avatarUploading ? "Uploading..." : "Upload Image"}
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={avatarUploading} style={{ display: 'none' }} />
                    </label>
                    {form.avatarUrl && (
                      <button type="button" onClick={() => setForm({...form, avatarUrl: ""})} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', padding: 0 }}>Remove</button>
                    )}
                  </div>
                </div>

                <div className="hub-form-group" style={{ marginBottom: 16 }}>
                  <div className="hub-toggle-group">
                    <input type="checkbox" checked={form.showInCatalog} onChange={(event) => setForm({ ...form, showInCatalog: event.target.checked })} />
                    <span>Show this staff member in salon catalog / expert listing</span>
                  </div>
                </div>

                <div style={{ marginBottom: 16, padding: 16, border: '1px solid #dbeafe', borderRadius: 10, background: '#f8fbff' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 10 }}>Owner-side Attendance Biometric</div>
                  <div className="hub-form-group" style={{ marginBottom: 10 }}>
                    <div className="hub-toggle-group">
                      <input type="checkbox" checked={form.attendanceEnabled} onChange={(event) => setForm({ ...form, attendanceEnabled: event.target.checked })} />
                      <span>Enable selfie attendance for this staff account</span>
                    </div>
                  </div>
                  <div className="hub-form-group" style={{ marginBottom: 0 }}>
                    <label>Enrollment Selfie</label>
                    {form.attendanceEnrollmentPhotoUrl ? (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
                        <img src={getImageUrl(form.attendanceEnrollmentPhotoUrl)} alt="Enrollment selfie" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '2px solid #22c55e' }} />
                        <div style={{ display: 'grid', gap: 6 }}>
                          <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Enrollment selfie captured</div>
                          <button type="button" className="secondary-button" style={{ fontSize: 12, padding: '6px 12px', width: 'fit-content', cursor: 'pointer' }} onClick={openEnrollmentCamera}>Retake</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={openEnrollmentCamera} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '28px 16px', borderRadius: 10, border: '2px dashed #93c5fd', background: '#eff6ff', cursor: 'pointer', marginTop: 6, transition: 'border-color 0.2s' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                          <circle cx="12" cy="13" r="3" />
                        </svg>
                        <div style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>Capture Enrollment Selfie</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Click to open live camera and capture staff face for biometric enrollment</div>
                      </button>
                    )}
                  </div>
                </div>

                <h4 style={{ fontSize: 14, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, margin: '16px 0 12px' }}>Employment & HR Details</h4>
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="hub-form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>Date of Joining</label>
                    <input type="date" className="hub-input" value={form.joiningDate} max={new Date().toISOString().split('T')[0]} onChange={e => setForm({ ...form, joiningDate: e.target.value })} />
                  </div>
                  <div className="hub-form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>UAN Number</label>
                    <input type="text" className="hub-input" value={form.uanNumber} onChange={e => setForm({ ...form, uanNumber: e.target.value })} placeholder="12-digit UAN" pattern="\d{12}" maxLength={12} />
                  </div>
                  <div className="hub-form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>Working Hours</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input type="time" className="hub-input" value={form.workingHoursStart || ""} onChange={e => {
                        const start = e.target.value;
                        const end = form.workingHoursEnd || "";
                        setForm({ ...form, workingHoursStart: start, workingHours: start && end ? `${start} - ${end}` : start || "" });
                      }} style={{ flex: 1 }} />
                      <span style={{ color: "#64748b", fontSize: 13, flexShrink: 0 }}>to</span>
                      <input type="time" className="hub-input" value={form.workingHoursEnd || ""} onChange={e => {
                        const end = e.target.value;
                        const start = form.workingHoursStart || "";
                        setForm({ ...form, workingHoursEnd: end, workingHours: start && end ? `${start} - ${end}` : "" });
                      }} style={{ flex: 1 }} />
                    </div>
                  </div>
                  <div className="hub-form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>Reporting To</label>
                    <CustomSelect className="hub-input" value={form.reportingToId} onChange={e => setForm({ ...form, reportingToId: e.target.value })} style={{ width: "100%", "--select-height": "42px" }}>
                      <option value="">None / Self</option>
                      {rows.map((r) => <option key={r.id} value={r.id}>{r.user?.name || r.phone}</option>)}
                    </CustomSelect>
                  </div>
                  <div className="hub-form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>Department</label>
                    <input type="text" className="hub-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Hair, Therapy, Admin" />
                  </div>
                </div>

                <h4 style={{ fontSize: 14, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, margin: '16px 0 12px' }}>Bank & Payroll Details</h4>
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="hub-form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>Bank Name</label>
                    <input type="text" className="hub-input" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="e.g. HDFC Bank" maxLength={200} />
                  </div>
                  <div className="hub-form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>Branch Name</label>
                    <input type="text" className="hub-input" value={form.bankBranch} onChange={e => setForm({ ...form, bankBranch: e.target.value })} placeholder="Branch Area" maxLength={200} />
                  </div>
                  <div className="hub-form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>Account Number</label>
                    <input type="text" className="hub-input" value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} placeholder="Account No." pattern="\d{9,18}" maxLength={18} />
                  </div>
                  <div className="hub-form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>IFSC / Routing Code</label>
                    <input type="text" className="hub-input" value={form.ifscCode} onChange={e => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} placeholder="IFSC Code" pattern="[A-Z]{4}0[A-Z0-9]{6}" maxLength={11} style={{ textTransform: 'uppercase' }} />
                  </div>
                </div>

                <h4 style={{ fontSize: 14, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, margin: '16px 0 12px' }}>Assigned Services</h4>
                <div className="staff-chip-grid" style={{ marginBottom: 16 }}>
                  {filteredServices.map((service) => (
                    <label key={service.id} className={`staff-service-chip ${form.serviceIds.includes(service.id) ? "selected" : ""}`}>
                      <input
                        type="checkbox"
                        checked={form.serviceIds.includes(service.id)}
                        onChange={() => toggleServiceId(service.id)}
                      />
                      <span>{service.name}</span>
                      <small>{service.branch?.name || "Shared"}</small>
                    </label>
                  ))}
                </div>
              </div>

              {staffOtpStep === 2 && (
                <div className="hub-modal-body" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 28px 28px', textAlign: 'center' }}>
                  {/* Subtle Top Icon */}
                  <div style={{
                    width: 58,
                    height: 58,
                    borderRadius: "18px",
                    background: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
                    color: "#0f766e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    border: "1.5px solid #99f6e4",
                    boxShadow: "0 6px 16px -2px rgba(15, 118, 110, 0.15)"
                  }}>
                    <KeyRound size={26} strokeWidth={2.2} />
                  </div>

                  <h3 style={{ margin: "0 0 6px", fontSize: 21, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                    Verify Phone Number
                  </h3>
                  <p style={{ margin: "0 0 20px", fontSize: 13.5, color: "#64748b", lineHeight: "1.55", maxWidth: "340px" }}>
                    Enter the 6-digit verification code sent to <strong style={{ color: "#0f172a" }}>{form.phone}</strong>
                  </p>

                  {status.success && (
                    <div style={{
                      marginBottom: 18,
                      padding: "10px 14px",
                      background: "#ecfdf5",
                      color: "#065f46",
                      border: "1px solid #a7f3d0",
                      borderRadius: 10,
                      fontSize: 12.5,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      maxWidth: 360,
                      width: "100%",
                      boxSizing: "border-box"
                    }}>
                      <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                      <span>{status.success}</span>
                    </div>
                  )}

                  {status.error && (
                    <div style={{
                      marginBottom: 18,
                      padding: "10px 14px",
                      background: "#fef2f2",
                      color: "#b91c1c",
                      border: "1px solid #fecaca",
                      borderRadius: 10,
                      fontSize: 12.5,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      maxWidth: 360,
                      width: "100%",
                      boxSizing: "border-box"
                    }}>
                      <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                      <span>{status.error}</span>
                    </div>
                  )}

                  <div style={{ width: '100%', margin: "8px 0 4px" }}>
                    <DigitOtpInput
                      value={form.otpCode || ''}
                      onChange={(val) => {
                        setForm({ ...form, otpCode: val });
                        if (status.error) setStatus((c) => ({ ...c, error: "" }));
                      }}
                      length={6}
                      autoFocus={true}
                      error={Boolean(status.error)}
                      brandColor="#0f766e"
                    />
                  </div>

                  <div style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "#64748b" }}>
                    <span>Didn't receive the OTP?</span>
                    {resendStaffCountdown > 0 ? (
                      <span style={{ fontWeight: 700, color: "#0f766e" }}>Resend in {resendStaffCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendStaffOtp}
                        disabled={resendingStaffOtp}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#0f766e",
                          fontWeight: 700,
                          cursor: resendingStaffOtp ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: 0,
                          fontSize: 13,
                          textDecoration: "underline"
                        }}
                      >
                        {resendingStaffOtp ? (
                          <>
                            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw size={13} />
                            <span>Resend OTP</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="hub-modal-footer" style={{ background: "#f8fafc", padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: staffOtpStep === 2 ? "space-between" : "flex-end", alignItems: "center", gap: 12 }}>
                {staffOtpStep === 1 ? (
                  <>
                    <button type="button" className="btn-cancel" onClick={() => { setIsCreateModalOpen(false); setStaffOtpStep(1); setStatus({}); }} style={{ minHeight: 40, height: 40, padding: "8px 18px", borderRadius: 10, fontWeight: 600, fontSize: 13.5 }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={submittingStaff} className="btn-submit" style={{ minHeight: 40, height: 40, padding: "8px 22px", borderRadius: 10, fontWeight: 700, fontSize: 13.5, background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {submittingStaff ? (
                        <>
                          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <span>Send OTP & Continue →</span>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn-cancel" onClick={() => { setStaffOtpStep(1); setStatus({}); }} style={{ minHeight: 40, height: 40, padding: "8px 18px", borderRadius: 10, fontWeight: 600, fontSize: 13.5 }}>
                      ← Edit Details
                    </button>
                    <button
                      type="submit"
                      disabled={submittingStaff || !form.otpCode || form.otpCode.length < 6}
                      className="btn-submit"
                      style={{
                        minHeight: 40,
                        height: 40,
                        padding: "8px 24px",
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 13.5,
                        color: "#ffffff",
                        background: (!form.otpCode || form.otpCode.length < 6 || submittingStaff)
                          ? "#94a3b8"
                          : "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
                        cursor: (!form.otpCode || form.otpCode.length < 6 || submittingStaff) ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: (form.otpCode && form.otpCode.length === 6 && !submittingStaff)
                          ? "0 4px 14px rgba(15, 118, 110, 0.3)"
                          : "none"
                      }}
                    >
                      {submittingStaff ? (
                        <>
                          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                          <span>Creating Staff...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Verify & Create Staff</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


