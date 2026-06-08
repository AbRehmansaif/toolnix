import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

// Social icons as inline SVG
const socialIcons = [
  { label: 'X (Twitter)', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.18 2.25h6.962l4.265 5.658 5.837-5.658ZM17.5 20.25l-11-15.5' },
  { label: 'Facebook',    path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
  { label: 'LinkedIn',    path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  { label: 'Instagram',   path: 'M 2,2 h 20 v 20 h -20 z M 12,7 a 5,5 0 1 1 0,10 a 5,5 0 0 1 0,-10 z M 17.5,6.5 a 0.5,0.5 0 1 1 0,1 a 0.5,0.5 0 0 1 0,-1 z' },
];

const footerLinks = {
  'PDF Tools': [
    { label: 'Merge PDF', path: '/#pdf-merge' },
    { label: 'Split PDF', path: '/#pdf-split' },
    { label: 'Compress PDF', path: '/#pdf-compress' },
  ],
  'Image Tools': [
    { label: 'Image to PDF', path: '/tools/image-to-pdf' },
    { label: 'PDF to Image', path: '/tools/pdf-to-image' },
    { label: 'OCR Image to Text', path: '/tools/ocr-image-to-text' },
    { label: 'Screenshot to Text', path: '/tools/screenshot-to-text' },
  ],
  'Utilities': [
    { label: 'Color Picker', path: '/tools/color-picker' },
    { label: 'HEX to RGB Converter', path: '/tools/hex-to-rgb' },
    { label: 'Image Metadata', path: '/tools/image-metadata' },
    { label: 'Remove EXIF Data', path: '/tools/remove-exif' },
    { label: 'QR Code Generator', path: '/tools/qr-code-generator' },
  ],
  'Resources': [
    { label: 'Blog', path: '/blog' },
    { label: 'iLovePDF Alternative', path: '/ilovepdf-alternative' },
    { label: 'Smallpdf Alternative', path: '/smallpdf-alternative' },
  ],
};

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Trust row */}
        <div className="footer-trust">
          <div className="trust-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            ISO 27001 Certified
          </div>
          <div className="trust-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            SSL Secured
          </div>
          <div className="trust-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            GDPR Compliant
          </div>
          <div className="trust-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Trusted Utilities
          </div>
        </div>

        {/* Main footer grid */}
        <div className="footer-top">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div className="logo-icon">T<span style={{ color: '#fca5a5' }}>♥</span></div>
                <div className="footer-brand-name">Tool<span>Nix</span></div>
              </div>
            </Link>
            <p className="footer-tagline">
              Your ultimate online utility suite. Process PDFs, edit images, and extract data instantly 100% secure and free, right in your browser.
            </p>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div className="footer-column" key={heading}>
              <h4>{heading}</h4>
              <ul>
                {links.map((link) => (
                  <li key={link.label}>
                    {link.path.startsWith('/#') ? (
                      <a href={link.path}>{link.label}</a>
                    ) : (
                      <Link to={link.path}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom" style={{ justifyContent: 'space-between' }}>
          <div className="footer-social">
            {socialIcons.map((icon, i) => (
              <a key={i} className="social-link" href="#" aria-label={icon.label}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={icon.path} />
                </svg>
              </a>
            ))}
          </div>

          <p className="footer-copyright">
            © <span>ToolNix</span> 2026 — The Ultimate Online Utility Suite
          </p>
        </div>
      </div>
    </footer>
  );
}
