import { useEffect, useState, useCallback } from "react";
import { Globe, CheckCircle, XCircle, Copy, Trash2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../api/client";

export default function DomainSettingsPage() {
  const [subdomain, setSubdomain] = useState("");
  const [savedSubdomain, setSavedSubdomain] = useState("");
  const [status, setStatus] = useState("NONE");
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [avail, setAvail] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);

  useEffect(() => {
    api.get("/owner/domain/settings").then(({ data }) => {
      setSavedSubdomain(data.subdomain || "");
      setSubdomain(data.subdomain || "");
      setStatus(data.status || "NONE");
      setUrl(data.url || "");
      setSlug(data.salon?.slug || "");
      setLoading(false);
    }).catch(() => { setLoading(false); toast.error("Failed to load domain settings"); });
  }, []);

  const checkAvailability = useCallback((name) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!name || name.length < 3) { setAvail(null); return; }
    const timer = setTimeout(() => {
      setChecking(true);
      api.get(`/owner/domain/check?name=${name}`).then(({ data }) => {
        setAvail(data.available);
        if (!data.available) toast.error(data.message);
      }).catch(() => setAvail(null)).finally(() => setChecking(false));
    }, 400);
    setDebounceTimer(timer);
  }, [debounceTimer]);

  const handleSubdomainChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-").replace(/^-|-$/g, "");
    setSubdomain(clean);
    setAvail(null);
    checkAvailability(clean);
  };

  const handleSave = async () => {
    if (!subdomain.trim() || subdomain.length < 3) return toast.error("Minimum 3 characters");
    setSaving(true);
    try {
      const { data } = await api.post("/owner/domain/set", { subdomain: subdomain.trim() });
      setSavedSubdomain(data.subdomain);
      setStatus(data.status);
      setUrl(data.url);
      toast.success(`Your website is live at ${data.url}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleRemove = async () => {
    if (!confirm("Remove subdomain? Your site will only be available at the default URL.")) return;
    try {
      await api.delete("/owner/domain/remove");
      setSavedSubdomain(""); setSubdomain(""); setStatus("NONE"); setUrl(""); setAvail(null);
      toast.success("Subdomain removed");
    } catch { toast.error("Failed to remove"); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-100 rounded-lg"><Globe className="h-5 w-5 text-pink-600" /></div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Website Subdomain</h2>
          <p className="text-sm text-gray-500">Get a free subdomain for your salon website</p>
        </div>
      </div>

      {/* Current Status */}
      {savedSubdomain && (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-pink-800">Your Website</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" /> Live
            </span>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-pink-200">
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm font-mono text-pink-700 hover:text-pink-800 truncate flex items-center gap-2">
              {url} <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            </a>
            <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Copied!"); }} className="p-2 text-pink-500 hover:text-pink-700 hover:bg-pink-50 rounded-lg transition-colors">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-pink-600">
            <span>Also available at:</span>
            <button onClick={() => { navigator.clipboard.writeText(`https://salonnest.in/site/${slug}`); toast.success("Copied!"); }} className="font-mono hover:underline">
              salonnest.in/site/{slug}
            </button>
          </div>
        </div>
      )}

      {/* Subdomain Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{savedSubdomain ? "Change Subdomain" : "Set Your Subdomain"}</h3>
        <div className="flex items-center gap-0 border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-pink-500 focus-within:border-pink-500">
          <input
            value={subdomain}
            onChange={(e) => handleSubdomainChange(e.target.value)}
            placeholder="beautyworld"
            maxLength={63}
            className="flex-1 px-4 py-2.5 text-sm border-0 focus:outline-none focus:ring-0"
          />
          <span className="px-4 py-2.5 bg-gray-50 border-l border-gray-300 text-sm text-gray-500 font-mono">.salonnest.in</span>
        </div>
        {/* Availability indicator */}
        <div className="mt-2 min-h-[20px]">
          {checking && <p className="text-xs text-gray-400">Checking availability...</p>}
          {!checking && avail === true && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Available!
            </p>
          )}
          {!checking && avail === false && subdomain.length >= 3 && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" /> Not available
            </p>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, and hyphens. 3-63 characters.</p>
        <div className="flex gap-2 mt-4">
          <button onClick={handleSave} disabled={saving || !subdomain.trim() || subdomain.length < 3 || avail === false} className="px-5 py-2.5 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : savedSubdomain ? "Update" : "Activate"}
          </button>
          {savedSubdomain && (
            <button onClick={handleRemove} className="px-4 py-2.5 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5">
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <p className="text-xs text-blue-800 leading-relaxed">
          <strong>How it works:</strong> Once activated, your salon website will be live at <code className="bg-blue-100 px-1 rounded">https://{subdomain || "yourname"}.salonnest.in</code>. Share this link with your clients to let them browse services and book appointments online. No DNS setup required — it works instantly!
        </p>
      </div>
    </div>
  );
}
