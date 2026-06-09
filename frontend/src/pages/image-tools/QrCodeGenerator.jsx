import { useState, useRef, useEffect } from 'react';
import { QrCode, Download, Copy, RefreshCw, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { Helmet } from 'react-helmet-async';
import '../../styles/ToolPage.css';

const TYPES = [
  { label: 'URL', placeholder: 'https://toolnix.pro' },
  { label: 'Text', placeholder: 'Enter any text…' },
  { label: 'Email', placeholder: 'user@example.com' },
  { label: 'Phone', placeholder: '+1 555 000 0000' },
  { label: 'SMS', placeholder: '+1 555 000 0000' },
  { label: 'WiFi', placeholder: 'NetworkName|password' },
];

function buildQrData(type, value) {
  if (!value) return '';
  switch (type) {
    case 'URL': return value.startsWith('http') ? value : 'https://' + value;
    case 'Email': return `mailto:${value}`;
    case 'Phone': return `tel:${value}`;
    case 'SMS': return `sms:${value}`;
    case 'WiFi': {
      const [ssid, pass] = value.split('|');
      return `WIFI:T:WPA;S:${ssid};P:${pass || ''};;`;
    }
    default: return value;
  }
}

export default function QrCodeGenerator() {
  const [type, setType] = useState(0);
  const [value, setValue] = useState('https://toolnix.pro');
  const [fgColor, setFgColor] = useState('#1a1a2e');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorLevel, setErrorLevel] = useState('M');
  const [size, setSize] = useState(256);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef();

  const generateQr = () => {
    const data = buildQrData(TYPES[type].label, value);
    if (!data || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, data, {
      width: size,
      margin: 2,
      color: { dark: fgColor, light: bgColor },
      errorCorrectionLevel: errorLevel,
    }).catch(console.error);
  };

  useEffect(() => { generateQr(); }, [value, fgColor, bgColor, errorLevel, size, type]);

  const handleDownload = (fmt) => {
    if (!canvasRef.current) return;
    if (fmt === 'PNG') {
      const a = document.createElement('a');
      a.download = 'qrcode.png';
      a.href = canvasRef.current.toDataURL('image/png');
      a.click();
    } else {
      const data = canvasRef.current.toDataURL('image/jpeg', 0.95);
      const a = document.createElement('a');
      a.download = 'qrcode.jpg';
      a.href = data;
      a.click();
    }
  };

  const handleCopy = async () => {
    canvasRef.current.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
      } catch { alert('Copy not supported in this browser.'); }
    });
  };

  return (
    <>
      <Helmet>
        <title>QR Code Generator Free Online — Create Custom QR Codes | ToolNix</title>
        <meta name="description" content="Generate QR codes online for free. Create QR codes for URLs, text, email, WiFi, and more. Download PNG or SVG. No registration, no watermark, no expiry. Free forever." />
        <link rel="canonical" href="https://toolnix.pro/qr-code-generator" />
        <meta property="og:title" content="QR Code Generator Free Online — Create Custom QR Codes | ToolNix" />
        <meta property="og:description" content="Generate QR codes online for free. Create QR codes for URLs, text, email, WiFi, and more. Download PNG or SVG. No registration, no watermark, no expiry. Free forever." />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "SoftwareApplication",
                  "name": "QR Code Generator Free Online — Create Custom QR Codes | ToolNix",
                  "operatingSystem": "Web",
                  "applicationCategory": "UtilitiesApplication",
                  "offers": {
                    "@type": "Offer",
                    "price": "0.00",
                    "priceCurrency": "USD"
                  }
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Do the QR codes expire?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "No. ToolNix generates static QR codes — the data is encoded inside the image itself, so there are no servers to go offline and no expiry date."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "What format should I download — PNG or SVG?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "PNG is best for digital use (web, social, screen). SVG is best for print — it scales to any size without pixelation."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I add my logo to the QR code?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. Upload a logo image and it will be embedded in the center of your QR code while keeping it scannable."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "How many QR codes can I generate for free?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Unlimited. Generate as many QR codes as you need — free forever, no account required."
                      }
                    }
                  ]
                }
              ]
            }
          `}
        </script>
      </Helmet>
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#image-tools">Image Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">QR Code Generator</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#f3f4f6' }}>
            <QrCode size={36} color="#1a1a2e" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <span className="tool-header-badge badge-free">✓ Free</span>
            <h1 className="tool-header-title">Free QR Code Generator, Create Custom QR Codes Online</h1>
            <div className="tool-header-desc">
              Generate QR codes for URLs, plain text, emails, phone numbers, WiFi credentials
              and more. Customize colors and download as PNG or JPG.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              {['URL','Text','Email','Phone','WiFi'].map(t => <span key={t} className="info-chip">✓ {t}</span>)}
              <span className="info-chip">🎨 Custom colors</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        <div>
          {/* Type tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {TYPES.map((t, i) => (
              <button
                key={t.label}
                onClick={() => { setType(i); setValue(''); }}
                style={{
                  padding: '8px 16px', borderRadius: 20,
                  border: `2px solid ${type === i ? '#1a1a2e' : 'var(--color-border)'}`,
                  background: type === i ? '#1a1a2e' : 'var(--color-bg-white)',
                  color: type === i ? '#fff' : 'var(--color-text-secondary)',
                  fontFamily: 'inherit', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              {TYPES[type].label} Content
            </label>
            <textarea
              className="tool-textarea"
              rows={3}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={TYPES[type].placeholder}
            />
          </div>

          {/* QR Canvas */}
          <div className="qr-canvas-wrap">
            <canvas ref={canvasRef} style={{ imageRendering: 'pixelated' }} />
          </div>

          {/* Download actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="download-btn" onClick={() => handleDownload('PNG')}><Download size={16} /> Download PNG</button>
            <button className="download-btn" style={{ background: '#3b82f6' }} onClick={() => handleDownload('JPG')}><Download size={16} /> Download JPG</button>
            <button className={`copy-btn${copied ? ' copied' : ''}`} style={{ padding: '10px 16px' }} onClick={handleCopy}>
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy Image'}
            </button>
          </div>
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">Customization</div>
            <div className="sidebar-card-body">
              <div className="sidebar-option">
                <span className="sidebar-option-label">QR Color</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)}
                    style={{ width: 36, height: 36, borderRadius: 8, border: '2px solid var(--color-border)', cursor: 'pointer', padding: 2 }} />
                  <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{fgColor.toUpperCase()}</span>
                </div>
              </div>
              <div className="sidebar-option">
                <span className="sidebar-option-label">Background</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                    style={{ width: 36, height: 36, borderRadius: 8, border: '2px solid var(--color-border)', cursor: 'pointer', padding: 2 }} />
                  <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{bgColor.toUpperCase()}</span>
                </div>
              </div>
              <div className="sidebar-option">
                <span className="sidebar-option-label">Error Level</span>
                <select className="sidebar-select" value={errorLevel} onChange={e => setErrorLevel(e.target.value)}>
                  <option value="L">Low (7%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
              </div>
              <div className="sidebar-option">
                <span className="sidebar-option-label">Size (px)</span>
                <select className="sidebar-select" value={size} onChange={e => setSize(Number(e.target.value))}>
                  <option value={128}>128</option>
                  <option value={256}>256</option>
                  <option value={512}>512</option>
                  <option value={1024}>1024</option>
                </select>
              </div>
              <button className="tool-action-btn" style={{ background: '#1a1a2e', boxShadow: '0 8px 24px rgba(26,26,46,0.3)' }}
                onClick={() => { setFgColor('#1a1a2e'); setBgColor('#ffffff'); generateQr(); }}>
                <RefreshCw size={16} /> Reset Colors
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
