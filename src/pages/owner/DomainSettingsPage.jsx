import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink, Trash2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/axios";

const STATUS_COLORS = {
  NONE: { bg: "bg-gray-100", text: "text-gray-600", label: "No Domain" },
  PENDING: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending Verification" },
  ACTIVE: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Active" },
  FAILED: { bg: "bg-red-100", text: "text-red-700", label: "Verification Failed" },
};

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  toast.success("Copied!");
}

export default function DomainSettingsPage() {
  const [domain, setDomain] = useState("");
  const [savedDomain, setSavedDomain] = useState("");
  const [status, setStatus] = useState("NONE");
  const [token, setToken] = useState("");
  const [cnameTarget, setCnameTarget] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/owner/domain/settings").then(({ data }) => {
      setSavedDomain(data.domain || "");
      setDomain(data.domain || "");
      setStatus(data.status || "NONE");
      setToken(data.verificationToken || "");
      setCnameTarget(data.cnameTarget || "cname.vercel-dns.com");
      setSlug(data.salon?.slug || "");
      setLoading(false);
    }).catch(() => { setLoading(false); toast.error("Failed to load domain settings"); });
  }, []);

  const handleSave = async () => {
    if (!domain.trim()) return toast.error("Enter a domain");
    setSaving(true);
    try {
      const { data } = await api.post("/owner/domain/set", { domain: domain.trim() });
      setSavedDomain(data.domain);
      setStatus(data.status);
      setToken(data.verificationToken);
      toast.success("Domain saved! Now configure DNS and verify.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save domain");
    } finally { setSaving(false); }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const { data } = await api.post("/owner/domain/verify");
      setStatus(data.status);
      if (data.status === "ACTIVE") toast.success("Domain verified! Your website is live.");
      else toast.error(data.message || "Verification failed");
    } catch (err) {
      setStatus("FAILED");
      toast.error(err.response?.data?.message || "Verification failed");
    } finally { setVerifying(false); }
  };

  const handleRemove = async () => {
    if (!confirm("Remove custom domain? Your site will revert to the default URL.")) return;
    try {
      await api.delete("/owner/domain/remove");
      setSavedDomain(""); setDomain(""); setStatus("NONE"); setToken("");
      toast.success("Domain removed");
    } catch { toast.error("Failed to remove domain"); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" /></div>;

  const statusInfo = STATUS_COLORS[status] || STATUS_COLORS.NONE;
  const defaultUrl = `https://salonnest.in/site/${slug}`;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-100 rounded-lg"><Globe className="h-5 w-5 text-pink-600" /></div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Custom Domain</h2>
          <p className="text-sm text-gray-500">Connect your own domain to your salon website</p>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">Status</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.text}`}>
            {status === "ACTIVE" ? <CheckCircle className="h-3.5 w-3.5" /> : status === "FAILED" ? <XCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            {statusInfo.label}
          </span>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Default URL</span>
            <button onClick={() => copyToClipboard(defaultUrl)} className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700"><Copy className="h-3 w-3" /> Copy</button>
          </div>
          <p className="text-sm font-mono text-gray-800 truncate">{defaultUrl}</p>
          {savedDomain && (
            <>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">Custom Domain</span>
                <a href={`https://${savedDomain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700"><ExternalLink className="h-3 w-3" /> Visit</a>
              </div>
              <p className="text-sm font-mono text-gray-800 truncate">https://{savedDomain}</p>
            </>
          )}
        </div>
      </div>

      {/* Domain Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{savedDomain ? "Update Domain" : "Add Custom Domain"}</h3>
        <div className="flex gap-2">
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="www.mysalon.com" className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500" />
          <button onClick={handleSave} disabled={saving || !domain.trim()} className="px-5 py-2.5 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        {savedDomain && status !== "ACTIVE" && (
          <button onClick={handleVerify} disabled={verifying} className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            <RefreshCw className={`h-4 w-4 ${verifying ? "animate-spin" : ""}`} />
            {verifying ? "Verifying..." : "Verify Domain"}
          </button>
        )}
        {savedDomain && (
          <button onClick={handleRemove} className="mt-3 flex items-center gap-2 px-4 py-2 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4" /> Remove Domain
          </button>
        )}
      </div>

      {/* DNS Setup Instructions */}
      <AnimatePresence>
        {savedDomain && status !== "ACTIVE" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">DNS Setup Instructions</h3>
              <p className="text-xs text-gray-500 mt-1">Add these records in your domain registrar (GoDaddy, Namecheap, etc.)</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Option 1: CNAME */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-blue-200 text-blue-800 text-xs font-bold rounded">OPTION 1</span>
                  <span className="text-sm font-medium text-blue-900">CNAME Record (Recommended)</span>
                </div>
                <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-blue-50 border-b border-blue-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-blue-700">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-blue-700">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-blue-700">Value</th>
                    </tr></thead>
                    <tbody><tr className="border-b border-gray-100">
                      <td className="px-3 py-2 font-mono text-blue-800">CNAME</td>
                      <td className="px-3 py-2 font-mono text-gray-800">
                        <span className="text-gray-500">@ or </span>{savedDomain.split(".")[0]}
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-800 flex items-center gap-2">
                        {cnameTarget}
                        <button onClick={() => copyToClipboard(cnameTarget)} className="text-pink-500 hover:text-pink-600"><Copy className="h-3 w-3" /></button>
                      </td>
                    </tr></tbody>
                  </table>
                </div>
              </div>
              {/* Option 2: A Record */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-bold rounded">OPTION 2</span>
                  <span className="text-sm font-medium text-gray-700">A Record</span>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Value</th>
                    </tr></thead>
                    <tbody><tr>
                      <td className="px-3 py-2 font-mono text-gray-800">A</td>
                      <td className="px-3 py-2 font-mono text-gray-800">@</td>
                      <td className="px-3 py-2 font-mono text-gray-800 flex items-center gap-2">
                        76.76.21.21
                        <button onClick={() => copyToClipboard("76.76.21.21")} className="text-pink-500 hover:text-pink-600"><Copy className="h-3 w-3" /></button>
                      </td>
                    </tr></tbody>
                  </table>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>DNS propagation takes 5-30 minutes (sometimes up to 48 hours)</li>
                    <li>Remove any existing A/CNAME records pointing to other services</li>
                    <li>SSL certificate is automatically provisioned by Vercel</li>
                    <li>Don't forget to add the <code className="bg-amber-100 px-1 rounded">www</code> subdomain too if needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
