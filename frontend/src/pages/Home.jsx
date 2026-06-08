import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import * as Icons from 'lucide-react';
import { FileText, Settings, Image, Zap, Users, Star, Code, Search } from 'lucide-react';
import ToolCard from '../components/ToolCard';
import { toolCategories, filterTabs } from '../data/tools';
import '../styles/Home.css';

const categoryIcons = {
  'pdf-conversion':  { icon: FileText, color: '#e54040', bg: '#fef2f2' },
  'pdf-editing':     { icon: Settings,  color: '#a855f7', bg: '#faf5ff' },
  'image-tools':     { icon: Image,     color: '#14b8a6', bg: '#f0fdfa' },
  'developer-tools': { icon: Code,      color: '#3b82f6', bg: '#eff6ff' },
};

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Handle clicking outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleCategories =
    activeFilter === 'all'
      ? toolCategories
      : toolCategories.filter((c) => c.id === activeFilter);

  // Search logic
  const allToolsFlat = toolCategories.flatMap(cat => 
    cat.tools.map(tool => ({ ...tool, categoryLabel: cat.label }))
  );
  const searchResults = searchQuery.trim() === '' 
    ? [] 
    : allToolsFlat.filter(tool => 
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6); // Limit to top 6 results to keep UI clean

  const schemaOrgJSONLD = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "ToolNix",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "Any",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "description": "ToolNix is a complete suite of free online tools for PDF editing, image conversion, and developer utilities. No registration required."
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is ToolNix completely free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, ToolNix is 100% free. There are no daily limits, no hidden fees, and no registration required."
          }
        },
        {
          "@type": "Question",
          "name": "Are my files secure?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolutely. All uploads are encrypted using HTTPS and files are automatically deleted from our servers within 1 hour."
          }
        }
      ]
    }
  ];

  return (
    <main>
      <Helmet>
        <title>ToolNix | Free Online PDF, Image & Developer Tools</title>
        <meta name="description" content="ToolNix is a complete suite of free online tools for PDF editing, image conversion, and developer utilities. No registration required, 100% free." />
        <link rel="canonical" href="https://toolnix.pro/" />
        <meta property="og:title" content="ToolNix | Free Online PDF, Image & Developer Tools" />
        <meta property="og:description" content="ToolNix is a complete suite of free online tools for PDF editing, image conversion, and developer utilities. No registration required, 100% free." />
        <script type="application/ld+json">
          {JSON.stringify(schemaOrgJSONLD)}
        </script>
      </Helmet>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            100% Free · No Registration Required
          </div>

          <h1 className="hero-title">
            ToolNix: Every tool you need to work with{' '}
            <span className="hero-title-highlight">PDFs &amp; Images</span>{' '}
            in one place
          </h1>

          <p className="hero-subtitle">
            ToolNix is a free online toolbox for everyday digital tasks. Whether you need to{' '}
            <Link to="/tools/pdf-compress" style={{ color: 'inherit', textDecoration: 'underline' }}>compress a PDF</Link>,{' '}
            <Link to="/tools/pdf-to-word" style={{ color: 'inherit', textDecoration: 'underline' }}>convert PDF to Word</Link>,{' '}
            <Link to="/tools/bg-remover" style={{ color: 'inherit', textDecoration: 'underline' }}>remove a background from an image</Link>, or{' '}
            <Link to="/tools/qr-code-generator" style={{ color: 'inherit', textDecoration: 'underline' }}>generate a QR code</Link> and other 40+ tools, everything is free, instant,
            and requires zero registration.
          </p>

          {/* Stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">40+</span>
              <span className="hero-stat-label">Tools</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">10M+</span>
              <span className="hero-stat-label">Users</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">4.9★</span>
              <span className="hero-stat-label">Rating</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">100%</span>
              <span className="hero-stat-label">Free</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs inside hero bottom */}
        <div className="filter-tabs-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              id={`filter-${tab.id}`}
              className={`filter-tab${activeFilter === tab.id ? ' active' : ''}`}
              onClick={() => setActiveFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Live Search Bar — outside hero to avoid overflow clipping */}
      <div style={{ background: 'var(--gradient-hero)', paddingBottom: '40px' }}>
        <div className="home-search-container" ref={searchRef} style={{ maxWidth: '640px', margin: '0 auto', position: 'relative', padding: '0 24px', zIndex: 200 }}>
          <div style={{ position: 'relative' }}>
            {/* Icon */}
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 1 }}>
              <Search size={20} />
            </span>
            <input 
              type="text" 
              placeholder="Search for tools (e.g., merge pdf, compress image)..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={(e) => {
                 e.target.style.borderColor = '#2b5ce7';
                 e.target.style.boxShadow = '0 0 0 4px rgba(43, 92, 231, 0.12)';
                 setIsSearchOpen(true);
              }}
              onBlur={(e) => {
                 e.target.style.borderColor = '#e2e8f0';
                 e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
              }}
              style={{
                width: '100%',
                padding: '16px 20px 16px 48px',
                borderRadius: '14px',
                border: '2px solid #e2e8f0',
                fontSize: '15px',
                fontWeight: '500',
                color: '#1e293b',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && searchQuery.trim() !== '' && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '24px',
              right: '24px',
              background: '#fff',
              borderRadius: '14px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.14)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              textAlign: 'left',
              zIndex: 9999
            }}>
              {searchResults.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: '8px 0', margin: 0 }}>
                  {searchResults.map(tool => {
                    const IconComponent = Icons[tool.icon] || Icons.Circle;
                    return (
                      <li key={tool.id}>
                        <Link 
                          to={tool.path || `/tools/${tool.id}`}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 20px',
                            textDecoration: 'none',
                            color: '#334155',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '10px', 
                            background: tool.bgColor || '#f1f5f9', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            marginRight: '16px',
                            color: tool.color || '#64748b',
                            flexShrink: 0
                          }}>
                            <IconComponent size={20} />
                          </div>
                          <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '2px', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              {tool.title}
                              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: '#f1f5f9', color: '#64748b', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                                {tool.categoryLabel}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {tool.description}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div style={{ padding: '32px 24px', textAlign: 'center', color: '#64748b' }}>
                  <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                  <div style={{ fontWeight: 500 }}>No tools found for "{searchQuery}"</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>Try searching for "pdf", "image", or "convert"</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tool Grids ── */}
      <div className="tools-sections">
        {visibleCategories.map((cat) => {
          const meta = categoryIcons[cat.id];
          const CatIcon = meta?.icon || Zap;
          return (
            <section
              key={cat.id}
              id={cat.id}
              className="tools-section"
            >
              <div className="section-header">
                <div className="section-title-group">
                  <div
                    className="section-icon"
                    style={{ background: meta?.bg, color: meta?.color }}
                  >
                    <CatIcon size={18} />
                  </div>
                  <div>
                    <h2 className="section-title">
                      {cat.id === 'pdf-conversion'  && 'PDF Conversion — Free Online PDF Converter'}
                      {cat.id === 'pdf-editing'     && 'PDF Editing — Free Online PDF Editor'}
                      {cat.id === 'image-tools'     && 'Image Tools — Free Online Image Editor and Converter'}
                      {cat.id === 'developer-tools' && 'Developer Tools — Free Online Utilities for Developers'}
                    </h2>
                    <p className="section-subtitle">
                      {cat.id === 'pdf-conversion'  && 'Convert PDFs to and from popular formats'}
                      {cat.id === 'pdf-editing'     && 'Edit, organize and manage your PDF files'}
                      {cat.id === 'image-tools'     && 'Powerful utilities for images and colors'}
                      {cat.id === 'developer-tools' && 'Essential tools and generators for developers'}
                    </p>
                  </div>
                </div>
                <span className="section-count">{cat.tools.length} tools</span>
              </div>

              <div className="tools-grid">
                {cat.tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Trusted By ── */}
      <div className="trusted-section">
        <p className="trusted-title">Trusted by professionals worldwide</p>
        <div className="trusted-logos">
          {['Freelancers', 'Designers', 'Developers', 'Marketers', 'Students', 'Photographers', 'Creators'].map((name) => (
            <span key={name} className="trusted-logo">{name}</span>
          ))}
        </div>
      </div>

      {/* ── FAQ Section ── */}
      <section className="faq-section" style={{ maxWidth: '800px', margin: '60px auto', padding: '0 24px' }}>
        <h2 style={{ fontSize: '28px', color: '#0f172a', marginBottom: '24px', textAlign: 'center', fontWeight: 'bold' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <details style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', transition: 'all 0.2s ease' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', color: '#0f172a', outline: 'none' }}>Is ToolNix completely free?</summary>
            <p style={{ marginTop: '12px', marginBottom: '0', color: '#475569', lineHeight: 1.6 }}>Yes, ToolNix is 100% free. There are no daily limits, no hidden fees, and no registration required.</p>
          </details>
          <details style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', transition: 'all 0.2s ease' }}>
            <summary style={{ fontWeight: '600', cursor: 'pointer', color: '#0f172a', outline: 'none' }}>Are my files secure?</summary>
            <p style={{ marginTop: '12px', marginBottom: '0', color: '#475569', lineHeight: 1.6 }}>Absolutely. All uploads are encrypted using HTTPS and files are automatically deleted from our servers within 1 hour to ensure complete privacy.</p>
          </details>
        </div>
      </section>


      {/* ── CTA Banner ── */}
      <div className="cta-banner">
        <h2 className="cta-title">Start working smarter with ToolNix</h2>
        <p className="cta-subtitle">
          Join over 10 million users, 100% free, secure, and easy to use tools right in your browser.
        </p>
        <div className="cta-actions" style={{ justifyContent: 'center', display: 'flex' }}>
          <button className="cta-btn-primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Zap size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Explore All Tools
          </button>
        </div>
      </div>
    </main>
  );
}
