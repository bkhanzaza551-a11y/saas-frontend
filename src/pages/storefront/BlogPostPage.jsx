import React, { useState, useEffect } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { ArrowLeft } from "lucide-react";

export default function BlogPostPage() {
  const { salon } = useOutletContext();
  const { slug, blogSlug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const salonSlug = salon?.slug || slug;
    if (!salonSlug || !blogSlug) return;

    api.get(`/public/salons/${salonSlug}/blogs/${blogSlug}`)
      .then(res => {
        setBlog(res.data?.blog || res.data);
      })
      .catch(err => console.error("Error fetching blog:", err))
      .finally(() => setLoading(false));
  }, [salon?.slug, slug, blogSlug]);

  if (loading) {
    return <div style={{ padding: "100px 20px", textAlign: "center" }}>Loading blog post...</div>;
  }

  if (!blog) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center" }}>
        <h2>Blog post not found</h2>
        <Link to={`/site/${salon?.slug || slug}/blog`} style={{ color: "var(--accent)" }}>Back to blogs</Link>
      </div>
    );
  }

  return (
    <article style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px 80px" }}>
      <Link 
        to={`/site/${salon?.slug || slug}/blog`} 
        style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748b", textDecoration: "none", marginBottom: "32px", fontWeight: 500 }}
      >
        <ArrowLeft size={16} /> Back to blogs
      </Link>
      
      {blog.imageUrl && (
        <div style={{ width: "100%", height: "400px", borderRadius: "16px", overflow: "hidden", marginBottom: "40px" }}>
          <img src={blog.imageUrl} alt={blog.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      
      <h1 style={{ fontSize: "2.5rem", fontFamily: "var(--font-serif)", marginBottom: "16px", color: "#0f172a", lineHeight: 1.2 }}>
        {blog.title}
      </h1>
      
      <div style={{ display: "flex", gap: "16px", color: "#64748b", marginBottom: "40px", fontSize: "0.95rem" }}>
        {blog.author && <span>By {blog.author}</span>}
        {blog.author && blog.date && <span>•</span>}
        {blog.date && <span>{new Date(blog.date).toLocaleDateString()}</span>}
      </div>
      
      <div 
        style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "#334155" }}
        dangerouslySetInnerHTML={{ __html: blog.content }} 
      />
    </article>
  );
}
