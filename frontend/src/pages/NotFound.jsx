import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowRight, FileText, Image, Settings } from 'lucide-react';

const popularTools = [
  { title: 'PDF Merge', path: '/tools/pdf-merge', icon: FileText, desc: 'Combine multiple PDFs into one', color: '#e54040', bg: '#fef2f2' },
  { title: 'PDF to Word', path: '/tools/pdf-to-word', icon: FileText, desc: 'Convert PDF to editable Word doc', color: '#2b5ce7', bg: '#eef2ff' },
  { title: 'Background Remover', path: '/tools/bg-remover', icon: Image, desc: 'Remove image backgrounds with AI', color: '#8b5cf6', bg: '#f5f3ff' },
  { title: 'Image Compressor', path: '/tools/image-compressor', icon: Settings, desc: 'Compress images without quality loss', color: '#0ea5e9', bg: '#f0f9ff' },
  { title: 'PDF Compress', path: '/tools/pdf-compress', icon: FileText, desc: 'Reduce PDF file size instantly', color: '#22c55e', bg: '#f0fdf4' },
  { title: 'QR Code Generator', path: '/tools/qr-code-generator', icon: Settings, desc: 'Generate QR codes for free', color: '#1a1a2e', bg: '#f3f4f6' },
];

export default function NotFound() {
  useEffect(() => {
    document.title = '404 - Page Not Found | ToolNix';
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) robotsMeta.setAttribute('content', 'noindex, nofollow');
    return () => {
      if (robotsMeta) robotsMeta.setAttribute('content', 'index, follow');
    };
  }, []);

  return (
    <main style={{ minHeight: '80vh', background: '#f8fafc' }}>
      {/* ── Hero ── */}
      <section
        style={{
          textAlign: 'center',
          padding: '80px 20px 60px',
          background: 'linear-gradient(135deg, #eef2ff 0%, #f0f9ff 100%)',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            fontSize: '100px',
            lineHeight: 1,
            marginBottom: '24px',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))',
          }}
        >
          🔍
        </div>
        <h1
          style={{
            fontSize: '42px',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 16px',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          404 – Page Not Found
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: '#64748b',
            maxWidth: '480px',
            margin: '0 auto 32px',
            lineHeight: '1.6',
          }}
        >
          Oops! The page you're looking for doesn't exist or has been moved.
          Try one of our popular free tools below.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#2b5ce7',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '600',
            transition: 'background 0.2s, transform 0.2s',
            boxShadow: '0 4px 16px rgba(43,92,231,0.3)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1a3fa3'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#2b5ce7'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Home size={16} />
          Back to Home
        </Link>
      </section>

      {/* ── Popular Tools ── */}
      <section style={{ padding: '60px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '32px',
          }}
        >
          Popular Free Tools
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {popularTools.map(tool => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.path}
                to={tool.path}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '20px',
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  textDecoration: 'none',
                  transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#c7d2fe';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: tool.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} color={tool.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px' }}>
                    {tool.title}
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                    {tool.desc}
                  </p>
                </div>
                <ArrowRight size={16} color="#94a3b8" style={{ flexShrink: 0, marginTop: '4px' }} />
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
