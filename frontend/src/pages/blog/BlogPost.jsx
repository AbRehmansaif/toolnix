import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, User, ChevronRight, ArrowLeft } from 'lucide-react';
import '../../styles/ToolPage.css';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  const siteUrl = 'https://toolnix.com'; // Replace with actual domain if necessary
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const imageUrl = post.featured_image_url || `${siteUrl}/og-image.png`;

  // JSON-LD Schema for Article
  const schemaOrgJSONLD = {
    "@context": "https://schema.org",
    "@type": "Article",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "headline": post.title,
    "image": [imageUrl],
    "datePublished": new Date(post.created_at).toISOString(),
    "dateModified": new Date(post.updated_at).toISOString(),
    "author": {
      "@type": "Person",
      "name": post.author?.name || 'Toolnix Team'
    },
    "publisher": {
      "@type": "Organization",
      "name": "Toolnix",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    },
    "description": post.meta_description || post.excerpt
  };

  return (
    <div className="tool-page">
      <Helmet>
        <title>{post.meta_title || `${post.title} - Toolnix Blog`}</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        {post.target_keywords && <meta name="keywords" content={post.target_keywords} />}
        
        {/* Open Graph tags for social sharing */}
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={new Date(post.created_at).toISOString()} />
        <meta property="article:modified_time" content={new Date(post.updated_at).toISOString()} />
        <meta property="article:section" content={post.category?.name || 'General'} />
        <meta property="og:image" content={imageUrl} />
        {post.alt_text && <meta property="og:image:alt" content={post.alt_text} />}
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.meta_title || post.title} />
        <meta name="twitter:description" content={post.meta_description || post.excerpt} />
        <meta name="twitter:image" content={imageUrl} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(schemaOrgJSONLD)}
        </script>
      </Helmet>

      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/blog">Blog</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">{post.title}</span>
      </div>

      <article style={{ maxWidth: 800, margin: '0 auto 60px' }}>
        <header style={{ textAlign: 'center', marginBottom: 40, marginTop: 20 }}>
          {post.category && (
            <Link to={`/blog?category=${post.category.slug}`} style={{ textDecoration: 'none' }}>
              <span style={{ 
                display: 'inline-block', fontSize: 13, fontWeight: 600, color: '#2b5ce7', 
                textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16,
                background: '#eef2ff', padding: '4px 12px', borderRadius: 20
              }}>
                {post.category.name}
              </span>
            </Link>
          )}
          
          <h1 style={{ fontSize: 36, color: '#0f172a', lineHeight: 1.2, marginBottom: 20 }}>
            {post.title}
          </h1>
          
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, 
            fontSize: 14, color: '#64748b' 
          }}>
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

        <div 
          className="blog-content"
          dangerouslySetInnerHTML={{ 
            __html: (() => {
              const txt = document.createElement("textarea");
              txt.innerHTML = post.content;
              return txt.value;
            })()
          }} 
          style={{ fontSize: 17, lineHeight: 1.7, color: '#334155' }}
        />

        <hr style={{ margin: '60px 0 40px', border: 0, borderTop: '1px solid #e2e8f0' }} />

        {/* Comments Section placeholder (Could implement DRF comment posting later) */}
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

      <style>{`
        .blog-content h2 { font-size: 28px; color: #0f172a; margin: 40px 0 20px; }
        .blog-content h3 { font-size: 22px; color: #0f172a; margin: 32px 0 16px; }
        .blog-content p { margin-bottom: 20px; }
        .blog-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 24px 0; }
        .blog-content a { color: #2b5ce7; text-decoration: none; }
        .blog-content a:hover { text-decoration: underline; }
        .blog-content ul, .blog-content ol { margin-bottom: 20px; padding-left: 24px; }
        .blog-content li { margin-bottom: 8px; }
        .blog-content blockquote { border-left: 4px solid #2b5ce7; margin: 0 0 20px; padding: 4px 0 4px 20px; color: #475569; font-style: italic; }
      `}</style>
    </div>
  );
}
