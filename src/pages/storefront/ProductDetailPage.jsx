import { useEffect } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

export default function ProductDetailPage() {
  const { salon } = useOutletContext();
  const { slug, id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/site/${slug}/service/${id}`, { replace: true });
  }, [navigate, slug, id]);

  return (
    <div style={{ maxWidth: 600, margin: '120px auto', padding: '40px 20px', textAlign: 'center' }}>
      <p style={{ fontSize: '1.1rem', color: 'var(--sf-text-light)' }}>
        Redirecting to service...
      </p>
    </div>
  );
}
