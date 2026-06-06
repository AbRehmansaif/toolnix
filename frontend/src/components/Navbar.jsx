import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Scissors, Archive, ChevronDown, Grid3X3, LogIn, UserPlus
} from 'lucide-react';
import { toolCategories } from '../data/tools';
import '../styles/Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Navigate to home then scroll to anchor
  const goToAnchor = (anchor) => {
    navigate('/');
    setTimeout(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">T<span style={{ color: '#fca5a5' }}>♥</span></div>
          <span className="logo-text">Tool<span>Nix</span></span>
        </Link>

        {/* Nav Links */}
        <div className="navbar-nav">
          {toolCategories.map((cat) => (
            <div className="all-tools-dropdown" key={cat.id}>
              <button className="nav-link nav-link-all" style={{ color: 'var(--color-text-primary)' }}>
                {cat.label} <ChevronDown size={14} />
              </button>
              <div className="dropdown-menu" style={{ width: '320px', left: '0', transform: 'translateX(0) translateY(-8px)' }}>
                <div className="dropdown-category">
                  {cat.tools.map((tool) =>
                    tool.path ? (
                      <Link key={tool.id} to={tool.path} className="dropdown-tool-link">
                        <span className="dropdown-tool-dot" style={{ background: tool.color }} />
                        {tool.title}
                      </Link>
                    ) : (
                      <button
                        key={tool.id}
                        className="dropdown-tool-link"
                        style={{ cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', width: '100%', textAlign: 'left', padding: 0 }}
                        onClick={() => goToAnchor(tool.id)}
                      >
                        <span className="dropdown-tool-dot" style={{ background: tool.color }} />
                        {tool.title}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions - Removed as requested */}
        <div className="navbar-actions">
        </div>
      </div>
    </nav>
  );
}
