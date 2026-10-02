import React, { useState, useEffect } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { api } from "../../api/client";

export default function BlogListPage() {
  const { salon } = useOutletContext();
  const { slug } = useParams();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salon?.slug && !slug) return;
    const salonSlug = salon?.slug || slug;
    
    api.get(`/public/salons/${salonSlug}/blogs`)
      .then(res => {
        setBlogs(res.data?.blogs || res.data || []);
      })
      .catch(err => console.error("Error fetching blogs:", err))
      .finally(() => setLoading(false));
  }, [salon?.slug, slug]);

  if (loading) {
    return <div style={{ padding: "100px 20px", textAlign: "center" }}>Loading blogs...</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "40px", fontSize: "2.5rem", fontFamily: "var(--font-serif)" }}>Our Blog</h1>
      
      {blogs.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No blog posts available at the moment.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "32px" }}>
          {blogs.map(blog => (
            <div key={blog.id || blog.slug} style={{ borderRadius: "12px", overflow: "hidden", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
              {blog.imageUrl && (
                <img src={blog.imageUrl} alt={blog.title} style={{ width: "100%", height: "200px", objectFit: "cover" }} />
              )}
              <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "1.25rem", marginBottom: "12px", fontWeight: 700, color: "#1e293b" }}>{blog.title}</h3>
                <p style={{ color: "#64748b", marginBottom: "24px", flex: 1 }}>{blog.excerpt}</p>
                <Link 
                  to={`/site/${salon?.slug || slug}/blog/${blog.slug}`} 
                  style={{ display: "inline-block", padding: "10px 20px", background: "var(--accent, #0d9488)", color: "#fff", textDecoration: "none", borderRadius: "6px", textAlign: "center", fontWeight: 600 }}
                >
                  Read More
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
