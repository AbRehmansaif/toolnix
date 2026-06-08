import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileText, Settings, Image, Zap, Users, Star, Code } from 'lucide-react';
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

  const visibleCategories =
    activeFilter === 'all'
      ? toolCategories
      : toolCategories.filter((c) => c.id === activeFilter);

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
