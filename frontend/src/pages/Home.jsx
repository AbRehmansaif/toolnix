import { useState } from 'react';
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

  return (
    <main>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            100% Free · No Registration Required
          </div>

          <h1 className="hero-title">
            Every tool you need to work with{' '}
            <span className="hero-title-highlight">PDFs &amp; Images</span>{' '}
            in one place
          </h1>

          <p className="hero-subtitle">
            All tools are 100% FREE and easy to use. Merge, split, compress,
            convert, rotate, watermark PDFs and process images — all with just
            a few clicks.
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
                    <h2 className="section-title">{cat.label}</h2>
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
