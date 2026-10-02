import React, { useState, useEffect } from "react";
import { Search, Edit2, Trash2, CheckCircle, XCircle, Plus } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function BlogsManagementPage() {
  const [blogs, setBlogs] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [loading, setLoading] = useState(true);

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
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
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

  const filteredBlogs = blogs.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Blogs Management</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0" }}>Manage your storefront blog articles.</p>
        </div>
        <button onClick={() => handleOpenModal()} style={{ background: "#4f46e5", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <Plus size={18} /> Add Blog
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
        <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", background: "#f1f5f9", padding: "8px 12px", borderRadius: "8px", width: "fit-content" }}>
          <Search size={18} color="#64748b" style={{ marginRight: "8px" }} />
          <input type="text" placeholder="Search blogs..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: "1rem", width: "250px" }} />
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
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#334155", fontSize: "0.9rem" }}>Image URL</label>
                <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://example.com/image.png" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#64748b" }}>Paste a direct link to an image. (We recommend hosting images on Imgur or similar services for now).</p>
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
