import { useState } from 'react';
import { Palette, Copy, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function isValidHex(h) {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(h);
}

function normalizeHex(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c+c).join('');
  return '#' + h.toUpperCase();
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
  const r = parseInt(hex.slice(0,2),16);
  const g = parseInt(hex.slice(2,4),16);
  const b = parseInt(hex.slice(4,6),16);
  return { r, g, b };
}

function hexToHsl(hex) {
  let { r, g, b } = hexToRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h=((g-b)/d+(g<b?6:0))/6; break;
      case g: h=((b-r)/d+2)/6; break;
      default: h=((r-g)/d+4)/6;
    }
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}

function isDark(hex) {
  const { r,g,b } = hexToRgb(hex);
  return (0.299*r+0.587*g+0.114*b) < 128;
}

const EXAMPLES = ['#E54040','#3B82F6','#22C55E','#F97316','#A855F7','#EC4899','#14B8A6','#1A1A2E'];

export default function HexToRgb() {
  const [hex, setHex] = useState('#3B82F6');
  const [copiedField, setCopiedField] = useState(null);

  const valid = isValidHex(hex);
  const normalized = valid ? normalizeHex(hex) : null;
  const rgb = valid ? hexToRgb(normalized) : null;
  const hsl = valid ? hexToHsl(normalized) : null;

  const copyVal = (label, val) => {
    navigator.clipboard.writeText(val);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#image-tools">Image Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">HEX to RGB Converter</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fdf2f8' }}>
            <Palette size={36} color="#ec4899" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">HEX to RGB Converter</div>
            <div className="tool-header-desc">
              Convert HEX color codes to RGB, HSL and other color formats instantly.
              Live preview with copy-to-clipboard for every format.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">⚡ Live conversion</span>
              <span className="info-chip">🎨 HEX → RGB · HSL · CMYK</span>
              <span className="info-chip">📋 One-click copy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        <div>
          {/* Input */}
          <div className="converter-box">
            <div className="converter-input-group">
              <div className="converter-input-label">HEX Color Code</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {normalized && (
                  <div style={{
                    width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                    background: normalized, border: '2px solid var(--color-border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  }} />
                )}
                <input
                  className="converter-input"
                  value={hex}
                  onChange={e => setHex(e.target.value)}
                  placeholder="#3B82F6"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              {hex && !valid && (
                <p style={{ marginTop: 6, fontSize: 12, color: '#e54040', fontWeight: 500 }}>
                  ⚠ Invalid HEX — use format #RGB or #RRGGBB
                </p>
              )}
            </div>

            {/* Results */}
            {valid && rgb && (
              <div className="converter-result">
                {[
                  { label: 'Red', value: rgb.r },
                  { label: 'Green', value: rgb.g },
                  { label: 'Blue', value: rgb.b },
                ].map(({ label, value }) => (
                  <div className="converter-result-item" key={label}
                    style={{ borderTop: `4px solid ${label === 'Red' ? '#e54040' : label === 'Green' ? '#22c55e' : '#3b82f6'}` }}>
                    <div className="converter-result-label">{label}</div>
                    <div className="converter-result-value">{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All formats */}
          {valid && rgb && hsl && (
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'HEX', value: normalized },
                { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
                { label: 'RGB Raw', value: `${rgb.r}, ${rgb.g}, ${rgb.b}` },
                { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
                { label: 'CSS rgba()', value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)` },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: 'var(--color-bg-white)', borderRadius: 12,
                  border: '1px solid var(--color-border)',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 72 }}>{label}</span>
                  <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', paddingLeft: 12 }}>{value}</span>
                  <button className={`copy-btn${copiedField === label ? ' copied' : ''}`} onClick={() => copyVal(label, value)}>
                    <Copy size={11} /> {copiedField === label ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🎨 Example Colors</div>
            <div className="sidebar-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {EXAMPLES.map(c => (
                  <button
                    key={c}
                    onClick={() => setHex(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', background: hex.toUpperCase() === c ? 'var(--color-bg)' : 'transparent',
                      border: '1px solid var(--color-border)', borderRadius: 10, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: c, flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>{c}</span>
                  </button>
                ))}
              </div>
              <button
                className="tool-action-btn"
                style={{ marginTop: 16 }}
                onClick={() => {
                  const rand = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0').toUpperCase();
                  setHex(rand);
                }}
              >
                <RefreshCw size={16} /> Random Color
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
