import { useState, useRef } from 'react';
import { Pipette, Upload, X, Copy, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

const PALETTE = [
  '#e54040', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
  '#6366f1', '#a855f7', '#ec4899', '#1a1a2e', '#64748b', '#ffffff',
  '#f1f5f9', '#fef9c3', '#fce7f3', '#ede9fe', '#dbeafe', '#dcfce7',
];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function hexToHsl(hex) {
  let { r, g, b } = hexToRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function isDark(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}

export default function ColorPicker() {
  const [color, setColor] = useState('#3b82f6');
  const [preview, setPreview] = useState(null);
  const [drag, setDrag] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const inputRef = useRef();
  const fileRef = useRef();

  const rgb = hexToRgb(color);
  const hsl = hexToHsl(color);

  const copyVal = (label, val) => {
    navigator.clipboard.writeText(val);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleImageFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#image-tools">Image Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Color Picker</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fdf2f8' }}>
            <Pipette size={36} color="#ec4899" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Color Picker</div>
            <div className="tool-header-desc">
              Pick colors from an interactive wheel or upload an image to sample colors.
              Get HEX, RGB, and HSL values instantly.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">🎨 HEX · RGB · HSL</span>
              <span className="info-chip">🖼 Image sampling</span>
              <span className="info-chip">🎡 Color wheel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        <div>
          {/* Color display */}
          <div className="color-display" style={{
            background: color,
            color: isDark(color) ? '#ffffff' : '#1a1a2e',
            fontSize: 28, fontWeight: 800,
          }}>
            {color.toUpperCase()}
          </div>

          {/* Color wheel + hex input */}
          <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'stretch' }}>
            {/* Big clickable color wheel swatch */}
            <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: color,
                border: '3px solid rgba(0,0,0,0.1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                transition: 'transform 0.15s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title="Open color picker"
              >
                {/* Hue ring overlay hint */}
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: `3px solid ${isDark(color) ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pipette size={12} color={isDark(color) ? '#fff' : '#000'} />
                </div>
              </div>
              <input
                ref={inputRef}
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
              />
            </label>

            {/* HEX text input */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>HEX CODE</label>
              <input
                type="text"
                className="tool-input"
                value={color.toUpperCase()}
                onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setColor(e.target.value); }}
                style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 20, letterSpacing: '0.08em', flex: 1 }}
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Palette Swatches */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10 }}>QUICK PALETTE</div>
            <div className="color-swatches">
              {PALETTE.map(c => (
                <div
                  key={c}
                  className="color-swatch"
                  style={{ background: c, borderColor: color === c ? 'var(--color-text-primary)' : 'transparent' }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
              {/* Custom color swatch — opens browser color picker */}
              <label
                title="Pick any custom color"
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <div
                  className="color-swatch"
                  style={{
                    background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                    border: '2px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 700,
                  }}
                  title="Pick any color"
                >
                  <span style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, backdropFilter: 'blur(2px)' }}>+</span>
                </div>
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>

          {/* Image Upload */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>PICK FROM IMAGE</div>
            {!preview ? (
              <div
                className={`upload-zone${drag ? ' dragover' : ''}`}
                style={{ padding: '40px 24px' }}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); handleImageFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageFile(e.target.files[0])} />
                <div className="upload-zone-title" style={{ fontSize: 14 }}>Upload image to pick colors</div>
                <div className="upload-zone-sub">Click anywhere on the image to sample</div>
              </div>
            ) : (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={preview} alt="pick" style={{ maxWidth: '100%', borderRadius: 12, cursor: 'crosshair', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                  onClick={e => {
                    const canvas = document.createElement('canvas');
                    const img = e.target;
                    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
                    canvas.getContext('2d').drawImage(img, 0, 0);
                    const rect = img.getBoundingClientRect();
                    const x = (e.clientX - rect.left) * (img.naturalWidth / rect.width);
                    const y = (e.clientY - rect.top) * (img.naturalHeight / rect.height);
                    const [rv, gv, bv] = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
                    setColor('#' + [rv, gv, bv].map(v => v.toString(16).padStart(2, '0')).join(''));
                  }}
                />
                <button className="file-item-remove" style={{ position: 'absolute', top: 8, right: 8, background: 'white', borderRadius: '50%', padding: 4 }}
                  onClick={() => setPreview(null)}>
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🎨 Color Values</div>
            <div className="sidebar-card-body">
              {[
                { label: 'HEX', value: color.toUpperCase() },
                { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
                { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
                { label: 'R', value: String(rgb.r) },
                { label: 'G', value: String(rgb.g) },
                { label: 'B', value: String(rgb.b) },
              ].map(({ label, value }) => (
                <div className="sidebar-option" key={label}>
                  <span className="sidebar-option-label">{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</span>
                    <button className={`copy-btn${copiedField === label ? ' copied' : ''}`} onClick={() => copyVal(label, value)}>
                      <Copy size={10} /> {copiedField === label ? '✓' : ''}
                    </button>
                  </div>
                </div>
              ))}

              {/* Color preview strip */}
              <div style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden', height: 60, background: `linear-gradient(135deg, ${color}, ${color}88)`, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
