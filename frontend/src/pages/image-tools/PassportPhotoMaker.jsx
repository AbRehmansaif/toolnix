import { useState, useRef, useCallback } from 'react';
import { UserSquare, Upload, X, Download, CheckCircle, ChevronRight, Loader2, CropIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import '../../styles/ToolPage.css';

// Official passport photo sizes (width × height in mm), verified against government sources
const PASSPORT_SIZES = {
  // ── Americas ──────────────────────────────────────────
  us:  { label: 'United States (51×51 mm / 2×2 in)',  w: 51,   h: 51,   group: 'Americas' },
  ca:  { label: 'Canada (50×70 mm)',                   w: 50,   h: 70,   group: 'Americas' },
  mx:  { label: 'Mexico (35×45 mm)',                   w: 35,   h: 45,   group: 'Americas' },
  br:  { label: 'Brazil (30×40 mm)',                   w: 30,   h: 40,   group: 'Americas' },

  // ── Europe ────────────────────────────────────────────
  uk:  { label: 'United Kingdom (35×45 mm)',           w: 35,   h: 45,   group: 'Europe' },
  de:  { label: 'Germany (35×45 mm)',                  w: 35,   h: 45,   group: 'Europe' },
  fr:  { label: 'France (35×45 mm)',                   w: 35,   h: 45,   group: 'Europe' },
  it:  { label: 'Italy (35×45 mm)',                    w: 35,   h: 45,   group: 'Europe' },
  es:  { label: 'Spain (32×26 mm)',                    w: 32,   h: 26,   group: 'Europe' },
  nl:  { label: 'Netherlands (35×45 mm)',              w: 35,   h: 45,   group: 'Europe' },
  be:  { label: 'Belgium (35×45 mm)',                  w: 35,   h: 45,   group: 'Europe' },
  ch:  { label: 'Switzerland (35×45 mm)',              w: 35,   h: 45,   group: 'Europe' },
  at:  { label: 'Austria (35×45 mm)',                  w: 35,   h: 45,   group: 'Europe' },
  se:  { label: 'Sweden (35×45 mm)',                   w: 35,   h: 45,   group: 'Europe' },
  no:  { label: 'Norway (35×45 mm)',                   w: 35,   h: 45,   group: 'Europe' },
  dk:  { label: 'Denmark (35×45 mm)',                  w: 35,   h: 45,   group: 'Europe' },
  fi:  { label: 'Finland (36×47 mm)',                  w: 36,   h: 47,   group: 'Europe' },
  pl:  { label: 'Poland (35×45 mm)',                   w: 35,   h: 45,   group: 'Europe' },
  pt:  { label: 'Portugal (35×45 mm)',                 w: 35,   h: 45,   group: 'Europe' },
  gr:  { label: 'Greece (40×60 mm)',                   w: 40,   h: 60,   group: 'Europe' },
  ru:  { label: 'Russia (35×45 mm)',                   w: 35,   h: 45,   group: 'Europe' },
  tr:  { label: 'Turkey (50×60 mm)',                   w: 50,   h: 60,   group: 'Europe' },
  schengen: { label: 'Schengen Visa (35×45 mm)',       w: 35,   h: 45,   group: 'Europe' },

  // ── Asia & Oceania ───────────────────────────────────
  in:  { label: 'India (35×45 mm)',                    w: 35,   h: 45,   group: 'Asia & Oceania' },
  pk:  { label: 'Pakistan (35×45 mm)',                 w: 35,   h: 45,   group: 'Asia & Oceania' },
  cn:  { label: 'China (33×48 mm)',                    w: 33,   h: 48,   group: 'Asia & Oceania' },
  jp:  { label: 'Japan (35×45 mm)',                    w: 35,   h: 45,   group: 'Asia & Oceania' },
  kr:  { label: 'South Korea (35×45 mm)',              w: 35,   h: 45,   group: 'Asia & Oceania' },
  bd:  { label: 'Bangladesh (35×45 mm)',               w: 35,   h: 45,   group: 'Asia & Oceania' },
  au:  { label: 'Australia (35×45 mm)',                w: 35,   h: 45,   group: 'Asia & Oceania' },
  nz:  { label: 'New Zealand (35×45 mm)',              w: 35,   h: 45,   group: 'Asia & Oceania' },
  sg:  { label: 'Singapore (35×45 mm)',                w: 35,   h: 45,   group: 'Asia & Oceania' },
  ae:  { label: 'UAE (40×60 mm)',                      w: 40,   h: 60,   group: 'Asia & Oceania' },
  sa:  { label: 'Saudi Arabia (40×60 mm)',             w: 40,   h: 60,   group: 'Asia & Oceania' },

  // ── Custom ────────────────────────────────────────────
  custom: { label: 'Custom Size',                      w: 35,   h: 45,   group: 'Custom' },
};

const BG_OPTIONS = [
  { label: 'White',      value: '#ffffff' },
  { label: 'Off-White',  value: '#f5f5f5' },
  { label: 'Light Blue', value: '#cce5ff' },
  { label: 'Light Gray', value: '#d0d0d0' },
];

function getCroppedCanvas(image, crop) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0,
    canvas.width, canvas.height
  );
  return canvas;
}

// Group entries for the <select> optgroup rendering
const GROUPS = [...new Set(Object.values(PASSPORT_SIZES).map(v => v.group))];

export default function PassportPhotoMaker() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [status, setStatus] = useState('idle');
  const [resultUrl, setResultUrl] = useState(null);

  const [sizeKey, setSizeKey] = useState('us');
  const [customW, setCustomW] = useState(35);
  const [customH, setCustomH] = useState(45);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [copies, setCopies] = useState(8);

  const imgRef = useRef();
  const inputRef = useRef();

  const getSpec = () => {
    if (sizeKey === 'custom') return { w: Number(customW), h: Number(customH) };
    return PASSPORT_SIZES[sizeKey];
  };

  const getAspect = () => {
    const s = getSpec();
    return s.w / s.h;
  };

  const handleFiles = (newFiles) => {
    const f = newFiles[0];
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setResultUrl(null);
      setStatus('idle');
      setCrop(undefined);
      const reader = new FileReader();
      reader.onload = () => setImgSrc(reader.result);
      reader.readAsDataURL(f);
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const aspect = getAspect();
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 80 }, aspect, width, height),
      width, height
    );
    setCrop(initialCrop);
  };

  const generateSheet = useCallback(() => {
    if (!completedCrop || !imgRef.current) return;
    setStatus('processing');

    const spec = getSpec();
    const DPI = 300;
    const SHEET_W_IN = 6;
    const SHEET_H_IN = 4;
    const sheetW = SHEET_W_IN * DPI;
    const sheetH = SHEET_H_IN * DPI;

    // Photo size in pixels at 300 DPI (mm → inch → pixels)
    const photoW = Math.round((spec.w / 25.4) * DPI);
    const photoH = Math.round((spec.h / 25.4) * DPI);

    const padding = 24;
    const cols = Math.floor((sheetW + padding) / (photoW + padding));
    const rows = Math.floor((sheetH + padding) / (photoH + padding));
    const totalPhotos = Math.min(cols * rows, copies);

    const croppedCanvas = getCroppedCanvas(imgRef.current, completedCrop);

    const sheet = document.createElement('canvas');
    sheet.width = sheetW;
    sheet.height = sheetH;
    const ctx = sheet.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sheetW, sheetH);

    let placed = 0;
    outer:
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (placed >= totalPhotos) break outer;
        const x = padding + c * (photoW + padding);
        const y = padding + r * (photoH + padding);

        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, photoW, photoH);
        ctx.drawImage(croppedCanvas, x, y, photoW, photoH);
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, photoW, photoH);
        placed++;
      }
    }

    sheet.toBlob((blob) => {
      setResultUrl(URL.createObjectURL(blob));
      setStatus('done');
    }, 'image/jpeg', 0.95);
  }, [completedCrop, sizeKey, customW, customH, bgColor, copies]);

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'passport_photo_sheet.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const spec = getSpec();
  const currentLabel = sizeKey === 'custom'
    ? `Custom (${customW}×${customH} mm)`
    : PASSPORT_SIZES[sizeKey]?.label || '';

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#image-tools">Image Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Passport Photo Maker</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#e0e7ff' }}>
            <UserSquare size={36} color="#6366f1" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Passport Size Photo Maker</div>
            <div className="tool-header-desc">
              Crop your portrait to any country's official passport standard and generate a professional 4×6 print-ready sheet at 300 DPI.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ 30+ Country Standards</span>
              <span className="info-chip">✓ 300 DPI Print Quality</span>
              <span className="info-chip">✓ Custom Size</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        <div>
          {!imgSrc ? (
            <div
              className={`upload-zone${drag ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
              <div className="upload-zone-icon"><Upload size={32} color="#6366f1" /></div>
              <div className="upload-zone-title">Upload your portrait photo</div>
              <div className="upload-zone-sub">Supports JPG, PNG, WEBP · Front-facing, good lighting recommended</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                <Upload size={14} /> Select Photo
              </div>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
                  <CropIcon size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Drag to crop — {currentLabel}
                </div>
                <button
                  onClick={() => { setFile(null); setImgSrc(''); setResultUrl(null); setStatus('idle'); }}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={16} color="#64748b" />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  onComplete={c => setCompletedCrop(c)}
                  aspect={getAspect()}
                  style={{ maxWidth: '100%' }}
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    onLoad={onImageLoad}
                    alt="Crop me"
                    style={{ maxWidth: '100%', maxHeight: 420, borderRadius: 8 }}
                  />
                </ReactCrop>
              </div>
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#eef2ff', borderRadius: 8, fontSize: 12, color: '#4338ca', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span>💡</span>
                <span>Make sure your face fills <strong>70–80%</strong> of the frame, eyes are open and visible, and background is plain. These are international biometric requirements.</span>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 24 }}>
              <div className="progress-label"><span>Generating Photo Sheet...</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '80%', background: '#6366f1' }} /></div>
            </div>
          )}

          {status === 'done' && resultUrl && (
            <div style={{ marginTop: 24 }}>
              <div className="result-box" style={{ borderColor: '#c7d2fe', background: '#eef2ff', marginBottom: 16 }}>
                <div className="result-box-icon"><CheckCircle size={28} color="#6366f1" /></div>
                <div className="result-box-title" style={{ color: '#3730a3' }}>Print Sheet Ready!</div>
                <div style={{ fontSize: 12, color: '#6366f1', marginBottom: 12 }}>
                  {spec.w}×{spec.h} mm photos · 300 DPI · 4×6 inch sheet · JPEG
                </div>
                <button className="download-btn" onClick={download} style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                  <Download size={16} /> Download 4×6 Print Sheet
                </button>
              </div>
              <img src={resultUrl} alt="Passport Sheet" style={{ width: '100%', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">Photo Options</div>
            <div className="sidebar-card-body">

              {/* Country selector with optgroups */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>Country / Standard</label>
                <select
                  className="sidebar-select"
                  value={sizeKey}
                  onChange={e => { setSizeKey(e.target.value); setCrop(undefined); setResultUrl(null); setStatus('idle'); }}
                >
                  {GROUPS.map(group => (
                    <optgroup key={group} label={group}>
                      {Object.entries(PASSPORT_SIZES)
                        .filter(([, v]) => v.group === group)
                        .map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Custom size inputs */}
              {sizeKey === 'custom' && (
                <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 10 }}>Custom Dimensions (mm)</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Width (mm)</label>
                      <input
                        type="number" min="10" max="200" value={customW}
                        onChange={e => { setCustomW(e.target.value); setCrop(undefined); }}
                        className="sidebar-select"
                        style={{ padding: '8px 10px' }}
                      />
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: 18, marginTop: 18 }}>×</span>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Height (mm)</label>
                      <input
                        type="number" min="10" max="200" value={customH}
                        onChange={e => { setCustomH(e.target.value); setCrop(undefined); }}
                        className="sidebar-select"
                        style={{ padding: '8px 10px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Background color */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>Background Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {BG_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setBgColor(opt.value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                        border: bgColor === opt.value ? '2px solid #6366f1' : '1px solid #e2e8f0',
                        background: bgColor === opt.value ? '#eef2ff' : '#fff',
                        color: bgColor === opt.value ? '#4f46e5' : '#475569',
                        fontWeight: bgColor === opt.value ? 600 : 400,
                      }}
                    >
                      <span style={{ width: 14, height: 14, borderRadius: 4, background: opt.value, border: '1px solid #e2e8f0', display: 'inline-block', flexShrink: 0 }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of copies */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>
                  Photos on Sheet
                  <span style={{ color: '#6366f1' }}>{copies}</span>
                </label>
                <input
                  type="range" min="1" max="12" step="1" value={copies}
                  onChange={e => setCopies(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#6366f1' }}
                />
              </div>

              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
                disabled={!completedCrop || status === 'processing'}
                onClick={generateSheet}
              >
                {status === 'processing' ? (
                  <><Loader2 className="animate-spin" size={18} /> Generating Sheet...</>
                ) : (
                  <><UserSquare size={18} /> Generate Photo Sheet</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
