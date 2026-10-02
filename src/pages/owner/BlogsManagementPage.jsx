import React, { useState, useEffect } from "react";
import { Search, Edit2, Trash2, CheckCircle, XCircle, Plus, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function BlogsManagementPage() {
  const [blogs, setBlogs] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "", slug: "", excerpt: "", content: "", imageUrl: "", author: "", published: false
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/owner/blogs");
      setBlogs(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch blogs.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (blog = null) => {
    if (blog) {
      setEditingBlog(blog);
      setFormData(blog);
    } else {
      setEditingBlog(null);
      setFormData({ title: "", slug: "", excerpt: "", content: "", imageUrl: "", author: "", published: false });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "title" && !editingBlog) {
        const autoSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (!prev.slug || prev.slug === prev.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")) {
          next.slug = autoSlug;
        }
      }
      return next;
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP, etc.).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size should be under 10MB.");
      return;
    }
    setImageUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await api.post("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const url = res.data?.url;
      if (url) {
        setFormData(prev => ({ ...prev, imageUrl: url }));
      } else {
        alert("Failed to get uploaded image URL.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to upload image. Please try again.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingBlog) {
        await api.patch(`/owner/blogs/${editingBlog.id}`, formData);
      } else {
        await api.post("/owner/blogs", formData);
      }
      setIsModalOpen(false);
      fetchBlogs();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save blog.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
      await api.delete(`/owner/blogs/${id}`);
      fetchBlogs();
    } catch (err) {
      console.error(err);
      alert("Failed to delete blog.");
    }
  };

  const filteredBlogs = blogs.filter(b => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (b.title || "").toLowerCase().includes(query) || (b.author || "").toLowerCase().includes(query);
  });

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Website Blogs</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0" }}>Manage your storefront blog articles.</p>
        </div>
        <button onClick={() => handleOpenModal()} style={{ background: "#4f46e5", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)" }}>
          <Plus size={18} /> Add Blog
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <Search size={17} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Search blogs by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 36px 9px 38px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                fontSize: "0.875rem",
                color: "#0f172a",
                outline: "none",
                transition: "all 0.15s ease",
                boxSizing: "border-box"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.background = "#ffffff";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.background = "#f8fafc";
                e.target.style.boxShadow = "none";
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <XCircle size={15} />
              </button>
            )}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>
            Total: <span style={{ color: "#0f172a", fontWeight: "700" }}>{filteredBlogs.length}</span> {filteredBlogs.length === 1 ? "article" : "articles"}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                <th style={{ padding: "12px 16px", fontWeight: "600" }}>Title</th>
                <th style={{ padding: "12px 16px", fontWeight: "600" }}>Author</th>
                <th style={{ padding: "12px 16px", fontWeight: "600" }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
              ) : filteredBlogs.length > 0 ? filteredBlogs.map(blog => (
                <tr key={blog.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", fontWeight: "500", color: "#1e293b" }}>{blog.title}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{blog.author || "-"}</td>
                  <td style={{ padding: "16px" }}>
                    {blog.published ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: "16px", fontSize: "0.85rem", fontWeight: "500" }}><CheckCircle size={14} /> Published</span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fef3c7", color: "#92400e", padding: "4px 8px", borderRadius: "16px", fontSize: "0.85rem", fontWeight: "500" }}><XCircle size={14} /> Draft</span>
                    )}
                  </td>
                  <td style={{ padding: "16px", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button onClick={() => handleOpenModal(blog)} style={{ background: "#f1f5f9", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer", color: "#475569" }} title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(blog.id)} style={{ background: "#fee2e2", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer", color: "#b91c1c" }} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>No blogs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>{editingBlog ? "Edit Blog" : "Add Blog"}</h2>
              <button onClick={handleCloseModal} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}><XCircle size={24} /></button>
            </div>
            
            <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#334155", fontSize: "0.9rem" }}>Title *</label>
                <input name="title" value={formData.title} onChange={handleChange} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#334155", fontSize: "0.9rem" }}>Slug *</label>
                <input name="slug" value={formData.slug} onChange={handleChange} placeholder="my-first-blog" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#334155", fontSize: "0.9rem" }}>Author</label>
                <input name="author" value={formData.author} onChange={handleChange} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#334155", fontSize: "0.9rem" }}>Featured Image</label>
                {formData.imageUrl ? (
                  <div style={{ position: "relative", width: "100%", height: "160px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                    <img src={formData.imageUrl} alt="Featured" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "rgba(15, 23, 42, 0.8)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "5px 10px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px 16px",
                    border: "2px dashed #cbd5e1",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    cursor: imageUploading ? "not-allowed" : "pointer",
                    textAlign: "center"
                  }}>
                    {imageUploading ? (
                      <>
                        <Loader2 size={22} color="#4f46e5" style={{ animation: "spin 1s linear infinite", marginBottom: "6px" }} />
                        <span style={{ fontSize: "0.8rem", color: "#4f46e5", fontWeight: 600 }}>Uploading image...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={22} color="#64748b" style={{ marginBottom: "6px" }} />
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>Click to upload featured image</span>
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>JPG, PNG, WEBP (Max 10MB)</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={imageUploading} style={{ display: "none" }} />
                      </>
                    )}
                  </label>
                )}
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#334155", fontSize: "0.9rem" }}>Excerpt</label>
                <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} rows={2} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", resize: "vertical" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#334155", fontSize: "0.9rem" }}>Content (HTML supported)</label>
                <textarea name="content" value={formData.content} onChange={handleChange} rows={6} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="checkbox" id="published" name="published" checked={formData.published} onChange={handleChange} style={{ width: "18px", height: "18px" }} />
                <label htmlFor="published" style={{ fontWeight: "500", color: "#334155", cursor: "pointer" }}>Publish immediately</label>
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={handleCloseModal} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={!formData.title} style={{ padding: "10px 16px", borderRadius: "8px", border: "none", background: "#4f46e5", color: "#fff", fontWeight: "600", cursor: formData.title ? "pointer" : "not-allowed", opacity: formData.title ? 1 : 0.6 }}>Save Blog</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
