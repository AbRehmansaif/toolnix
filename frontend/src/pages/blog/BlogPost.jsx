import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, User, ChevronRight, ArrowLeft, List } from 'lucide-react';
import '../../styles/ToolPage.css';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [parsedContent, setParsedContent] = useState('');
  const [toc, setToc] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [tocOpen, setTocOpen] = useState(false); // mobile toggle
  const articleRef = useRef(null);

  // ── Reading progress bar ───────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const article = articleRef.current;
      if (!article) return;
      const { top, height } = article.getBoundingClientRect();
      const windowH = window.innerHeight;
      const scrolled = Math.max(0, -top);
      const total = height - windowH;
      setReadingProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Active heading via IntersectionObserver ────────────────────────────────
  useEffect(() => {
    if (toc.length === 0) return;

    const headingEls = toc.map(item => document.getElementById(item.id)).filter(Boolean);
    if (headingEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-10% 0px -80% 0px',
        threshold: 0,
      }
    );

    headingEls.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [toc, parsedContent]);

  // ── Smooth scroll on TOC click ─────────────────────────────────────────────
  const scrollToHeading = useCallback((e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 88;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveId(id);
    setTocOpen(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/blogs/posts/${slug}/`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setPost(data);
        setError(false);

        if (data.content) {
          let text = data.content;
          try {
            const txt = document.createElement('textarea');
            for (let i = 0; i < 5; i++) {
              txt.innerHTML = text;
              if (txt.value === text) break;
              text = txt.value;
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const headings = doc.querySelectorAll('h2, h3');
            const tocItems = [];

            headings.forEach((heading, index) => {
              const textContent = heading.textContent.trim();
              const id = `heading-${index}`;
              heading.id = id;
              tocItems.push({ id, text: textContent, level: heading.tagName.toLowerCase() });
            });

            setToc(tocItems);
            setParsedContent(doc.body.innerHTML);
          } catch (e) {
            console.error('Content parsing error:', e);
            setParsedContent(text);
          }
        }
      })
      .catch(err => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="tool-page" style={{ textAlign: 'center', padding: 100 }}>Loading article...</div>;
  }

  if (error || !post) {
    return (
      <div className="tool-page" style={{ textAlign: 'center', padding: 100 }}>
        <h2>Article Not Found</h2>
        <p style={{ marginBottom: 24, color: '#64748b' }}>The blog post you're looking for doesn't exist or has been removed.</p>
        <Link to="/blog">
          <button className="tool-action-btn" style={{ background: '#2b5ce7', margin: '0 auto' }}>
            <ArrowLeft size={16} /> Back to Blog
          </button>
        </Link>
      </div>
    );
  }

  const siteUrl = 'https://toolnix.pro';
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const imageUrl = post.featured_image_url || `${siteUrl}/og-image.png`;

  const schemaOrgJSONLD = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    headline: post.title,
    image: [imageUrl],
    datePublished: new Date(post.created_at).toISOString(),
    dateModified: new Date(post.updated_at).toISOString(),
    author: { '@type': 'Person', name: post.author?.name || 'Toolnix Team' },
    publisher: {
      '@type': 'Organization',
      name: 'Toolnix',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` },
    },
    description: post.meta_description || post.excerpt,
  };

  return (
    <div className="tool-page">
      {/* ── Reading Progress Bar ─────────────────────────────────────────── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 1000, background: '#e2e8f0' }}>
        <div style={{
          height: '100%',
          width: `${readingProgress}%`,
          background: 'linear-gradient(90deg, #2b5ce7, #7c3aed)',
          transition: 'width 0.1s linear',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      <Helmet>
        <title>{post.meta_title || `${post.title} - Toolnix Blog`}</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        {post.target_keywords && <meta name="keywords" content={post.target_keywords} />}
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={new Date(post.created_at).toISOString()} />
        <meta property="article:modified_time" content={new Date(post.updated_at).toISOString()} />
        <meta property="article:section" content={post.category?.name || 'General'} />
        <meta property="og:image" content={imageUrl} />
        {post.alt_text && <meta property="og:image:alt" content={post.alt_text} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.meta_title || post.title} />
        <meta name="twitter:description" content={post.meta_description || post.excerpt} />
        <meta name="twitter:image" content={imageUrl} />
        <script type="application/ld+json">{JSON.stringify(schemaOrgJSONLD)}</script>
      </Helmet>

      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/blog">Blog</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">{post.title}</span>
      </div>

      {/* ── Two-column layout: article + sticky TOC ──────────────────────── */}
      <div className="blog-post-layout">

        {/* ── Article ─────────────────────────────────────────────────────── */}
        <article ref={articleRef} className="blog-article">
          <header style={{ textAlign: 'center', marginBottom: 40, marginTop: 20 }}>
            {post.category && (
              <Link to={`/blog?category=${post.category.slug}`} style={{ textDecoration: 'none' }}>
                <span style={{
                  display: 'inline-block', fontSize: 13, fontWeight: 600, color: '#2b5ce7',
                  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16,
                  background: '#eef2ff', padding: '4px 12px', borderRadius: 20,
                }}>
                  {post.category.name}
                </span>
              </Link>
            )}

            <h1 className="blog-title">{post.title}</h1>

            <div className="blog-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} />
                {post.author?.name || 'Toolnix Team'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} />
                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                ⏱️ {post.reading_time} min read
              </div>
            </div>
          </header>

          {post.featured_image_url && (
            <figure style={{ margin: '0 0 40px 0', borderRadius: 16, overflow: 'hidden' }}>
              <img
                src={post.featured_image_url}
                alt={post.alt_text || post.title}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              {post.image_caption && (
                <figcaption style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 12 }}>
                  {post.image_caption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Mobile TOC toggle (shown only on small screens) */}
          {toc.length > 0 && (
            <div className="toc-mobile-toggle">
              <button id="toc-mobile-btn" onClick={() => setTocOpen(o => !o)} aria-expanded={tocOpen}>
                <List size={16} />
                {tocOpen ? 'Hide' : 'Show'} Table of Contents
              </button>
              {tocOpen && (
                <div className="toc-mobile-panel">
                  <ul>
                    {toc.map(item => (
                      <li key={item.id} className={`toc-item ${item.level}${activeId === item.id ? ' toc-active' : ''}`}>
                        <a href={`#${item.id}`} onClick={e => scrollToHeading(e, item.id)}>
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: parsedContent }}
            style={{ fontSize: 17, lineHeight: 1.7, color: '#334155' }}
          />

          <hr style={{ margin: '60px 0 40px', border: 0, borderTop: '1px solid #e2e8f0' }} />

          <section>
            <h3 style={{ fontSize: 24, marginBottom: 24 }}>Comments ({post.comments?.length || 0})</h3>
            {post.comments && post.comments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {post.comments.map(comment => (
                  <div key={comment.id} style={{ background: '#f8fafc', padding: 20, borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <strong style={{ color: '#0f172a' }}>{comment.name}</strong>
                      <span style={{ fontSize: 13, color: '#64748b' }}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 15, color: '#475569' }}>{comment.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b' }}>No comments yet.</p>
            )}
          </section>
        </article>

        {/* ── Sticky Right TOC Sidebar ──────────────────────────────────────── */}
        {toc.length > 0 && (
          <aside className="blog-toc-sidebar" aria-label="Table of contents">
            <div className="blog-toc-sticky">

              {/* Header with circular reading-progress ring */}
              <div className="toc-header">
                <svg className="toc-progress-ring" viewBox="0 0 36 36" aria-hidden="true">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke="#2b5ce7" strokeWidth="3"
                    strokeDasharray={`${(readingProgress * 94.2) / 100} 94.2`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                    style={{ transition: 'stroke-dasharray 0.2s' }}
                  />
                </svg>
                <span className="toc-title">On this page</span>
              </div>

              <ul className="toc-list">
                {toc.map(item => {
                  const isActive = activeId === item.id;
                  return (
                    <li key={item.id} className={`toc-item ${item.level}${isActive ? ' toc-active' : ''}`}>
                      <a href={`#${item.id}`} onClick={e => scrollToHeading(e, item.id)} title={item.text}>
                        <span className="toc-dot" aria-hidden="true" />
                        <span className="toc-text">{item.text}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        )}
      </div>

      <style>{`
        /* ── Layout ──────────────────────────────────────────────────────── */
        .blog-post-layout {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 64px;
          max-width: 1160px;
          margin: 0 auto 60px;
          padding: 0 16px;
          /* align-items: start; REMOVED so sidebar stretches full height and sticky works! */
        }
        .blog-article { min-width: 0; padding-bottom: 80px; }

        /* ── Typography ─────────────────────────────────────────────────── */
        .blog-title { font-size: 40px; font-weight: 800; color: #0f172a; line-height: 1.15; margin-bottom: 24px; letter-spacing: -0.02em; }
        .blog-meta { display: flex; align-items: center; justify-content: center; gap: 24px; font-size: 14.5px; color: #64748b; flex-wrap: wrap; }
        .blog-content h2 { font-size: 30px; font-weight: 700; color: #0f172a; margin: 48px 0 24px; scroll-margin-top: 100px; letter-spacing: -0.01em; }
        .blog-content h3 { font-size: 24px; font-weight: 600; color: #0f172a; margin: 36px 0 16px; scroll-margin-top: 100px; }
        .blog-content p { margin-bottom: 24px; font-size: 17px; line-height: 1.75; color: #334155; }
        .blog-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 32px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .blog-content a { color: #2b5ce7; text-decoration: none; font-weight: 500; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
        .blog-content a:hover { border-color: #2b5ce7; }
        .blog-content ul, .blog-content ol { margin-bottom: 24px; padding-left: 24px; font-size: 17px; line-height: 1.75; color: #334155; }
        .blog-content li { margin-bottom: 10px; }
        .blog-content blockquote { border-left: 4px solid #2b5ce7; background: #f8fafc; margin: 32px 0; padding: 20px 24px; color: #475569; font-style: italic; border-radius: 0 12px 12px 0; }
        
        /* ── Premium Sticky TOC Sidebar ──────────────────────────────────── */
        .blog-toc-sidebar { min-width: 0; height: 100%; position: relative; }
        .blog-toc-sticky {
          position: sticky;
          top: 100px;
          padding: 10px 0;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          scrollbar-width: none; /* Firefox */
        }
        .blog-toc-sticky::-webkit-scrollbar { display: none; } /* Chrome/Safari */

        /* Progress ring header */
        .toc-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding: 0 12px;
        }
        .toc-progress-ring { width: 28px; height: 28px; flex-shrink: 0; }
        .toc-title { font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }

        /* Sleek TOC list with continuous tracking line */
        .toc-list { 
          list-style: none; 
          padding: 0; 
          margin: 0; 
          display: flex; 
          flex-direction: column; 
          position: relative;
        }
        /* Continuous background line */
        .toc-list::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 12px;
          width: 2px;
          background: #e2e8f0;
          border-radius: 2px;
          z-index: 0;
        }

        .toc-item {
          position: relative;
          z-index: 1;
        }
        
        .toc-item a {
          display: block;
          padding: 8px 12px 8px 32px;
          text-decoration: none;
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
          transition: color 0.2s ease, transform 0.2s ease;
          position: relative;
        }
        
        /* Active indicator segment */
        .toc-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 12px;
          width: 2px;
          height: 100%;
          background: #2b5ce7;
          border-radius: 2px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s;
          z-index: 2;
          transform: scaleY(0.2);
          opacity: 0;
          transform-origin: center;
        }

        .toc-item a:hover { color: #0f172a; }
        .toc-item a:active { transform: scale(0.98); }

        /* Indent H3 */
        .toc-item.h3 a { padding-left: 44px; font-size: 13.5px; color: #94a3b8; }
        .toc-item.h3::before { left: 12px; } /* keep line aligned */

        /* Active state */
        .toc-item.toc-active a {
          color: #2b5ce7;
          font-weight: 600;
        }
        .toc-item.toc-active::before {
          transform: scaleY(1);
          opacity: 1;
        }

        /* ── Mobile TOC toggle ──────────────────────────────────────────── */
        .toc-mobile-toggle { display: none; }
        .toc-mobile-toggle button {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 20px;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          cursor: pointer;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .toc-mobile-toggle button:hover { border-color: #cbd5e1; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        
        .toc-mobile-panel {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 40px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .toc-mobile-panel ul { list-style: none; padding: 0; margin: 0; }
        .toc-mobile-panel .toc-item { margin-bottom: 12px; }
        .toc-mobile-panel .toc-item:last-child { margin-bottom: 0; }
        .toc-mobile-panel .toc-item a { color: #475569; text-decoration: none; font-size: 15px; line-height: 1.5; display: block; }
        .toc-mobile-panel .toc-item.h3 a { padding-left: 20px; font-size: 14px; color: #64748b; }
        .toc-mobile-panel .toc-item.toc-active a { color: #2b5ce7; font-weight: 700; }

        /* ── Responsive ─────────────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .blog-post-layout { grid-template-columns: 1fr; gap: 0; }
          .blog-toc-sidebar { display: none; }
          .toc-mobile-toggle { display: block; }
          .blog-title { font-size: 32px; }
          .blog-meta { gap: 16px; }
          .blog-content h2 { font-size: 26px; margin: 40px 0 20px; }
          .blog-content h3 { font-size: 22px; }
        }
      `}</style>
    </div>
  );
}
