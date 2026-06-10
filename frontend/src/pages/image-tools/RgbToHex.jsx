import { useState } from 'react';
import { Palette, Copy, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function clamp(v, min = 0, max = 255) { return Math.max(min, Math.min(max, Math.round(Number(v) || 0))); }

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function rgbToHsl(r, g, b) {
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

const EXAMPLES = [
  { r: 229, g: 64, b: 64 },
  { r: 59, g: 130, b: 246 },
  { r: 34, g: 197, b: 94 },
  { r: 249, g: 115, b: 22 },
  { r: 168, g: 85, b: 247 },
  { r: 236, g: 72, b: 153 },
  { r: 20, g: 184, b: 166 },
  { r: 26, g: 26, b: 46 },
];

export default function RgbToHex() {
  const [r, setR] = useState(59);
  const [g, setG] = useState(130);
  const [b, setB] = useState(246);
  const [copiedField, setCopiedField] = useState(null);

  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);

  const copyVal = (label, val) => {
    navigator.clipboard.writeText(val);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const RgbSlider = ({ label, value, setter, trackColor }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)' }}>{label}</span>
        <input
          type="number"
          min="0" max="255"
          value={value}
          onChange={e => setter(clamp(e.target.value))}
          style={{ width: 60, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--color-border)', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, textAlign: 'center', outline: 'none' }}
        />
      </div>
      <input
        type="range"
        min="0" max="255"
        value={value}
        onChange={e => setter(Number(e.target.value))}
        style={{ width: '100%', accentColor: trackColor, height: 6, cursor: 'pointer' }}
      />
    </div>
  );

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#image-tools">Image Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">RGB to HEX Converter</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fdf2f8' }}>
            <Palette size={36} color="#ec4899" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">RGB to HEX Converter</div>
            <div className="tool-header-desc">
              Convert RGB color values to HEX and other formats instantly. Use the interactive
              sliders or type in values directly.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">🎚 Live sliders</span>
              <span className="info-chip">🎨 RGB → HEX · HSL</span>
              <span className="info-chip">📋 One-click copy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        <div>
          {/* Color Preview */}
          <div style={{
            width: '100%', height: 160, borderRadius: 20,
            background: hex, marginBottom: 24,
            boxShadow: `0 12px 40px ${hex}66`,
            transition: 'background 0.2s, box-shadow 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, fontFamily: 'monospace',
            color: (0.299 * r + 0.587 * g + 0.114 * b) < 128 ? '#fff' : '#1a1a2e',
          }}>
            {hex}
          </div>

          {/* Sliders */}
          <div style={{ background: 'var(--color-bg-white)', borderRadius: 20, padding: '24px', border: '1px solid var(--color-border)' }}>
            <RgbSlider label="Red (R)" value={r} setter={setR} trackColor="#e54040" />
            <RgbSlider label="Green (G)" value={g} setter={setG} trackColor="#22c55e" />
            <RgbSlider label="Blue (B)" value={b} setter={setB} trackColor="#3b82f6" />
          </div>

          {/* Output formats */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'HEX', value: hex },
              { label: 'RGB', value: `rgb(${r}, ${g}, ${b})` },
              { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
              { label: 'CSS rgba()', value: `rgba(${r}, ${g}, ${b}, 1)` },
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
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🎨 Example Colors</div>
            <div className="sidebar-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {EXAMPLES.map(ex => {
                  const exHex = rgbToHex(ex.r, ex.g, ex.b);
                  return (
                    <button
                      key={exHex}
                      onClick={() => { setR(ex.r); setG(ex.g); setB(ex.b); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', background: (r === ex.r && g === ex.g && b === ex.b) ? 'var(--color-bg)' : 'transparent',
                        border: '1px solid var(--color-border)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: exHex, boxShadow: '0 2px 6px rgba(0,0,0,0.15)', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{`${ex.r}, ${ex.g}, ${ex.b}`}</span>
                    </button>
                  );
                })}
              </div>
              <button
                className="tool-action-btn"
                style={{ marginTop: 16 }}
                onClick={() => { setR(Math.floor(Math.random() * 256)); setG(Math.floor(Math.random() * 256)); setB(Math.floor(Math.random() * 256)); }}
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
