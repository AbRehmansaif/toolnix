import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, User, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import '../../styles/ToolPage.css';

export default function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const categoryParam = searchParams.get('category') || '';

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    // Fetch categories
    fetch('/api/blogs/categories/')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Failed to load categories:", err));
  }, []);

  useEffect(() => {
    // Fetch posts
    setLoading(true);
    const url = `/api/blogs/posts/?page=${page}${categoryParam ? `&category=${categoryParam}` : ''}`;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => {
        setPosts(data.results || []);
        // DRF PageNumberPagination returns count
        if (data.count) {
          setTotalCount(data.count);
          setTotalPages(Math.ceil(data.count / 9)); // page_size = 9
        } else {
          setTotalCount(data.length || 0);
          setTotalPages(1);
        }
      })
      .catch(err => {
        console.error("Failed to load posts:", err);
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, [page, categoryParam]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({ page: newPage, ...(categoryParam && { category: categoryParam }) });
      window.scrollTo(0, 0);
    }
  };

  const handleCategoryClick = (slug) => {
    if (slug === categoryParam) {
      setSearchParams({ page: 1 }); // clear category
    } else {
      setSearchParams({ page: 1, category: slug });
    }
  };

  const currentCatName = categories.find(c => c.slug === categoryParam)?.name || 'All Posts';

  return (
    <div className="tool-page">
      <Helmet>
        <title>Blog - Toolnix | AI, Development & Tech Insights</title>
        <meta name="description" content="Explore the latest articles, tutorials, and insights on AI, software development, new technologies, and more — brought to you by Toolnix." />
      </Helmet>

      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Blog</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner" style={{ textAlign: 'center', width: '100%', flexDirection: 'column' }}>
          <h1 className="tool-header-title" style={{ fontSize: 36, marginBottom: 12 }}>Toolnix Blog</h1>
          <div className="tool-header-desc" style={{ maxWidth: 640, margin: '0 auto' }}>
            Stay ahead of the curve, explore in depth articles on AI, software development, new technologies, and emerging trends shaping the future.
          </div>
        </div>
      </div>

      <div className="tool-main blog-layout">
        {/* Main Content */}
        <div>
          <h2 style={{ marginBottom: 24, fontSize: 24, color: '#0f172a' }}>{currentCatName}</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading articles...</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b', background: '#f8fafc', borderRadius: 12 }}>
              No articles found in this category.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {posts.map(post => (
                <Link to={`/blog/${post.slug}`} key={post.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
                    overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }} className="hover-lift">
                    {post.featured_image_url ? (
                      <div style={{ height: 180, background: '#f1f5f9', overflow: 'hidden' }}>
                        <img 
                          src={post.featured_image_url} 
                          alt={post.alt_text || post.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div style={{ height: 180, background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)' }} />
                    )}
                    
                    <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {post.category && (
                        <span style={{ 
                          fontSize: 12, fontWeight: 600, color: '#2b5ce7', 
                          textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 
                        }}>
                          {post.category.name}
                        </span>
                      )}
                      <h3 style={{ margin: '0 0 12px 0', fontSize: 18, color: '#0f172a', lineHeight: 1.4 }}>
                        {post.title}
                      </h3>
                      <p style={{ margin: '0 0 16px 0', fontSize: 14, color: '#475569', lineHeight: 1.6, flex: 1 }}>
                        {post.excerpt}
                      </p>
                      
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: 16, 
                        fontSize: 13, color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: 16 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} />
                          {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2b5ce7', marginLeft: 'auto', fontWeight: 500 }}>
                          Read <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 40 }}>
              <button 
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                style={{ 
                  padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', 
                  borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              
              <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>
                Page {page} of {totalPages}
              </span>
              
              <button 
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                style={{ 
                  padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', 
                  borderRadius: 6, cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">Categories</div>
            <div className="sidebar-card-body" style={{ padding: '12px 16px' }}>
              <button
                onClick={() => handleCategoryClick('')}
                style={{
                  display: 'flex', justifyContent: 'space-between', width: '100%', 
                  padding: '8px 0', border: 'none', background: 'none', 
                  cursor: 'pointer', fontSize: 14, color: categoryParam === '' ? '#2b5ce7' : '#475569',
                  fontWeight: categoryParam === '' ? 600 : 400, borderBottom: '1px solid #f1f5f9'
                }}
              >
                <span>All Posts</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', width: '100%', 
                    padding: '8px 0', border: 'none', background: 'none', 
                    cursor: 'pointer', fontSize: 14, color: categoryParam === cat.slug ? '#2b5ce7' : '#475569',
                    fontWeight: categoryParam === cat.slug ? 600 : 400, borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>


        </div>
      </div>
      
      <style>{`
        .blog-layout { grid-template-columns: 1fr 300px; }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        @media (max-width: 992px) {
          .blog-layout { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .tool-header-title { font-size: 28px !important; }
        }
      `}</style>
    </div>
  );
}
