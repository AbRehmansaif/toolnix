import { useState, useRef, useCallback } from 'react';
import { Minimize2, Upload, X, Download, CheckCircle, ChevronRight, Loader2, ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (!b) return '0 B';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

// ── Premium Before/After Slider ──────────────────────────────────────────────
function CompareSlider({ beforeUrl, afterUrl }) {
  const [pos, setPos] = useState(50); // 0–100 %
  const containerRef = useRef();
  const dragging = useRef(false);

  const updatePos = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  const onMouseDown = (e) => { e.preventDefault(); dragging.current = true; };
  const onMouseMove = (e) => { if (dragging.current) updatePos(e.clientX); };
  const onMouseUp   = ()  => { dragging.current = false; };
  const onTouchMove = (e) => updatePos(e.touches[0].clientX);

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      style={{ position: 'relative', width: '100%', aspectRatio: 'auto', userSelect: 'none', borderRadius: 12, overflow: 'hidden', cursor: 'col-resize', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
    >
      {/* BEFORE (left = original) */}
      <img src={beforeUrl} alt="Before" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />

      {/* AFTER (right = compressed), clipped */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${pos}%)`, borderRadius: 12 }}>
        <img src={afterUrl} alt="After" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      {/* Labels */}
      <div style={{ position: 'absolute', top: 12, left: 14, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.05em', pointerEvents: 'none' }}>
        BEFORE
      </div>
      <div style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(14,165,233,0.85)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.05em', pointerEvents: 'none' }}>
        AFTER
      </div>

      {/* Divider line + handle */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={(e) => { dragging.current = true; updatePos(e.touches[0].clientX); }}
        onTouchEnd={() => { dragging.current = false; }}
        style={{
          position: 'absolute', top: 0, bottom: 0, left: `${pos}%`,
          transform: 'translateX(-50%)',
          width: 3,
          background: '#ffffff',
          boxShadow: '0 0 12px rgba(0,0,0,0.4)',
          cursor: 'col-resize',
          zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Circular handle */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'white',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ArrowLeftRight size={18} color="#0ea5e9" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

const OUTPUT_FORMATS = [
  { value: 'jpeg',  label: 'JPEG',  desc: 'Best compression, no transparency' },
  { value: 'png',   label: 'PNG',   desc: 'Lossless, supports transparency' },
  { value: 'webp',  label: 'WebP',  desc: 'Modern web format, great quality/size ratio' },
  { value: 'avif',  label: 'AVIF',  desc: 'Next-gen format, superior compression (Chrome/Firefox)' },
  { value: 'bmp',   label: 'BMP',   desc: 'Uncompressed bitmap, large file size' },
  { value: 'gif',   label: 'GIF',   desc: 'Limited to 256 colors, best for simple graphics' },
  { value: 'tiff',  label: 'TIFF',  desc: 'High quality, ideal for printing' },
];

export default function ImageCompressor() {
  const [file, setFile]                   = useState(null);
  const [drag, setDrag]                   = useState(false);
  const [status, setStatus]               = useState('idle');
  const [progress, setProgress]           = useState(0);
  const [maxSizeMB, setMaxSizeMB]         = useState(1);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1920);
  const [outputType, setOutputType]       = useState('jpeg');
  const [resultBlob, setResultBlob]       = useState(null);
  const [resultUrl, setResultUrl]         = useState(null);
  const [origUrl, setOrigUrl]             = useState(null);

  const inputRef = useRef();

  const handleFiles = (newFiles) => {
    const f = newFiles[0];
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setResultUrl(null);
      setResultBlob(null);
      setStatus('idle');
      setProgress(0);
      setOrigUrl(URL.createObjectURL(f));

      // Auto-detect format
      if (f.type.includes('png'))  setOutputType('png');
      else if (f.type.includes('webp')) setOutputType('webp');
      else if (f.type.includes('avif')) setOutputType('avif');
      else setOutputType('jpeg');
    }
  };

  const processImage = async () => {
    if (!file) return;

    // For BMP / GIF / TIFF - browser-image-compression doesn't support them
    // We use canvas for conversion and skip compression
    if (['bmp', 'gif', 'tiff'].includes(outputType)) {
      setStatus('processing');
      setProgress(50);
      try {
        const img = new Image();
        img.src = origUrl;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);

        // TIFF and BMP: convert as PNG/JPEG fallback since canvas doesn't support them natively
        // We serve PNG for TIFF/BMP (closest lossless option)
        const mimeOut = outputType === 'tiff' ? 'image/png' : outputType === 'bmp' ? 'image/png' : 'image/gif';
        canvas.toBlob((blob) => {
          setResultBlob(blob);
          setResultUrl(URL.createObjectURL(blob));
          setProgress(100);
          setStatus('done');
        }, mimeOut, 1.0);
      } catch (e) {
        setStatus('idle');
        alert('Conversion error: ' + e.message);
      }
      return;
    }

    setStatus('processing');
    setProgress(10);
    try {
      const mimeType = `image/${outputType}`;
      const options = {
        maxSizeMB: Number(maxSizeMB),
        maxWidthOrHeight: Number(maxWidthOrHeight),
        useWebWorker: true,
        fileType: mimeType,
        onProgress: (p) => setProgress(10 + Math.round((p / 100) * 80)),
      };

      const compressed = await imageCompression(file, options);
      setProgress(95);
      setResultBlob(compressed);
      setResultUrl(URL.createObjectURL(compressed));
      setStatus('done');
      setProgress(100);
    } catch (error) {
      console.error(error);
      setStatus('idle');
      alert('Error compressing image: ' + error.message);
    }
  };

  const download = () => {
    if (!resultUrl || !resultBlob) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const extMap = { jpeg: 'jpg', png: 'png', webp: 'webp', avif: 'avif', bmp: 'png', gif: 'png', tiff: 'png' };
    a.download = `${baseName}_compressed.${extMap[outputType] || outputType}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const savings = resultBlob && file ? Math.round((1 - resultBlob.size / file.size) * 100) : 0;

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#image-tools">Image Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Image Compressor</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#f0f9ff' }}>
            <Minimize2 size={36} color="#0ea5e9" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Image Compressor & Converter</div>
            <div className="tool-header-desc">
              Reduce file size without losing visible quality. Convert between JPEG, PNG, WebP, AVIF, GIF, BMP, and TIFF.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ 7 Output Formats</span>
              <span className="info-chip">✓ Live Before/After</span>
              <span className="info-chip">✓ Offline Processing</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        <div>
          {!file ? (
            <div
              className={`upload-zone${drag ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
              <div className="upload-zone-icon"><Upload size={32} color="#0ea5e9" /></div>
              <div className="upload-zone-title">Drop an image here</div>
              <div className="upload-zone-sub">Supports JPG, PNG, WebP, AVIF, GIF, BMP, TIFF</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
                <Upload size={14} /> Select Image
              </div>
            </div>
          ) : (
            <div>
              {/* Stats bar */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 120, padding: '14px 18px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>ORIGINAL</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{formatBytes(file.size)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{file.name}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                  <ArrowLeftRight size={20} />
                </div>

                <div style={{ flex: 1, minWidth: 120, padding: '14px 18px', borderRadius: 10, border: `1px solid ${status === 'done' ? '#bae6fd' : '#e2e8f0'}`, background: status === 'done' ? 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' : '#f8fafc' }}>
                  <div style={{ fontSize: 11, color: '#0ea5e9', fontWeight: 600, marginBottom: 4 }}>COMPRESSED</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0c4a6e' }}>{status === 'done' ? formatBytes(resultBlob?.size) : '—'}</div>
                  {status === 'done' && savings > 0 && (
                    <div style={{ fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 8px', borderRadius: 20, fontWeight: 700 }}>-{savings}%</span>
                      <span style={{ color: '#64748b' }}>smaller</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setFile(null); setResultUrl(null); setResultBlob(null); setOrigUrl(null); setStatus('idle'); }}
                  style={{ alignSelf: 'flex-start', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <X size={16} color="#64748b" />
                </button>
              </div>

              {/* Before/After slider */}
              {status === 'done' && resultUrl ? (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ArrowLeftRight size={15} color="#0ea5e9" />
                    Drag the slider to compare
                  </div>
                  <CompareSlider beforeUrl={origUrl} afterUrl={resultUrl} />
                </div>
              ) : (
                <div style={{ background: '#f8fafc', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <img
                    src={origUrl}
                    alt="Original"
                    style={{ width: '100%', maxHeight: 380, objectFit: 'contain', display: 'block', background: '#f1f5f9' }}
                  />
                </div>
              )}
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 24 }}>
              <div className="progress-label"><span>Compressing Image...</span><span>{progress}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#0ea5e9' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="download-btn" onClick={download} style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', margin: 0 }}>
                <Download size={16} /> Download {outputType.toUpperCase()}
              </button>
              <button
                onClick={() => { setResultUrl(null); setResultBlob(null); setStatus('idle'); }}
                style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#475569', fontWeight: 500 }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Compression Settings</div>
            <div className="sidebar-card-body">

              {/* Output format */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 10, color: '#475569' }}>Output Format</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {OUTPUT_FORMATS.map(fmt => (
                    <button
                      key={fmt.value}
                      onClick={() => setOutputType(fmt.value)}
                      style={{
                        textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        border: outputType === fmt.value ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                        background: outputType === fmt.value ? '#f0f9ff' : '#fff',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: outputType === fmt.value ? '#0369a1' : '#1e293b' }}>{fmt.label}</span>
                        {outputType === fmt.value && (
                          <CheckCircle size={14} color="#0ea5e9" />
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Only show compression controls for lossy formats */}
              {!['bmp', 'gif', 'tiff'].includes(outputType) && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>
                      Target Max Size
                      <span style={{ color: '#0ea5e9' }}>{maxSizeMB} MB</span>
                    </label>
                    <input
                      type="range" min="0.1" max="10" step="0.1" value={maxSizeMB}
                      onChange={e => setMaxSizeMB(e.target.value)}
                      style={{ width: '100%', accentColor: '#0ea5e9' }}
                    />
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Compressor targets this size or smaller.</div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>Max Width / Height</label>
                    <select className="sidebar-select" value={maxWidthOrHeight} onChange={e => setMaxWidthOrHeight(e.target.value)}>
                      <option value="4000">Original (up to 4000px)</option>
                      <option value="1920">1920px — Full HD</option>
                      <option value="1280">1280px — HD</option>
                      <option value="800">800px — Web Optimized</option>
                    </select>
                  </div>
                </>
              )}

              {['bmp', 'gif', 'tiff'].includes(outputType) && (
                <div style={{ marginBottom: 20, padding: 12, background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
                  <strong>Note:</strong> {outputType.toUpperCase()} is converted at full quality without compression. The output is saved as a lossless PNG to ensure maximum compatibility across all browsers.
                </div>
              )}

              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}
                disabled={!file || status === 'processing'}
                onClick={processImage}
              >
                {status === 'processing' ? (
                  <><Loader2 className="animate-spin" size={18} /> Processing...</>
                ) : (
                  <><Minimize2 size={18} /> Compress & Convert</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
