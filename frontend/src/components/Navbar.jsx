import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { toolCategories, navLinks } from '../data/tools';
import '../styles/Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="logo-icon">T<span style={{ color: '#fca5a5' }}>♥</span></div>
          <span className="logo-text">Tool<span>Nix</span></span>
        </Link>

        {/* Nav Links */}
        <div className="navbar-nav">
          {toolCategories.map((cat) => {
            const isLarge = cat.tools.length > 10;
            return (
              <div className="all-tools-dropdown" key={cat.id}>
                <button className="nav-link nav-link-all" style={{ color: 'var(--color-text-primary)' }}>
                  {cat.label} <ChevronDown size={14} />
                </button>
                <div className="dropdown-menu" style={{ 
                  width: isLarge ? '600px' : '300px', 
                  left: '0', 
                  transform: 'translateX(0) translateY(-8px)' 
                }}>
                  <div style={{ columnCount: isLarge ? 2 : 1, columnGap: '24px' }}>
                    {cat.tools.map((tool) => {
                      const IconComponent = Icons[tool.icon] || Icons.Circle;
                      return (
                        <Link 
                          key={tool.id} 
                          to={tool.path || `/tools/${tool.id}`} 
                          className="dropdown-tool-link"
                          style={{ 
                            padding: '8px 0', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            color: '#334155', 
                            textDecoration: 'none', 
                            fontSize: '14px',
                            fontWeight: 500,
                            transition: 'color 0.2s',
                            breakInside: 'avoid'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = tool.color; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.transform = 'none'; }}
                        >
                          <IconComponent size={18} color={tool.color} style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tool.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Toggle Button */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-inner">
            {toolCategories.map((cat) => (
              <a 
                key={cat.id} 
                href={`/#${cat.id}`} 
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {cat.label}
              </a>
            ))}
            <div className="mobile-menu-divider"></div>
            <Link to="/blog" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
            <Link to="/ilovepdf-alternative" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>iLovePDF Alternative</Link>
            <Link to="/smallpdf-alternative" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Smallpdf Alternative</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
