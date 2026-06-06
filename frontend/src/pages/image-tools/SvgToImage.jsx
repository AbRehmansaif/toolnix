import { useState, useRef } from 'react';
import { FileImage, Upload, X, Download, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

export default function SvgToImage() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);

  const [outputFormat, setOutputFormat] = useState('png');
  const [scale, setScale] = useState(2);

  const inputRef = useRef();
  const canvasRef = useRef();

  const handleFiles = (newFiles) => {
    const f = newFiles[0];
    if (f && (f.type === 'image/svg+xml' || f.name.endsWith('.svg'))) {
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setResultUrl(null);
      setStatus('idle');
    }
  };

  const processImage = () => {
    if (!file) return;
    setStatus('processing');

    const svgUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = canvasRef.current;
      const naturalW = img.naturalWidth || 800;
      const naturalH = img.naturalHeight || 600;

      canvas.width = naturalW * scale;
      canvas.height = naturalH * scale;

      const ctx = canvas.getContext('2d');

      if (outputFormat === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const mimeType = outputFormat === 'jpeg' ? 'image/jpeg' : outputFormat === 'webp' ? 'image/webp' : 'image/png';
      canvas.toBlob((blob) => {
        setResultUrl(URL.createObjectURL(blob));
        setStatus('done');
      }, mimeType, 0.95);
    };

    img.onerror = () => {
      setStatus('idle');
      alert('Could not load SVG. Please make sure the file is a valid SVG.');
    };

    img.src = svgUrl;
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    const baseName = file.name.replace(/\.svg$/i, '');
    const ext = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    a.download = `${baseName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#image-tools">Image Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">SVG to Image</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fdf2f8' }}>
            <FileImage size={36} color="#ec4899" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">SVG to Image Converter</div>
            <div className="tool-header-desc">
              Convert scalable SVG vector files into high-resolution PNG, JPEG, or WebP images instantly.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ High Resolution</span>
              <span className="info-chip">✓ PNG / JPEG / WebP</span>
              <span className="info-chip">✓ Custom Scale</span>
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
              <input ref={inputRef} type="file" accept=".svg,image/svg+xml" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
              <div className="upload-zone-icon"><Upload size={32} color="#ec4899" /></div>
              <div className="upload-zone-title">Drop an SVG file here</div>
              <div className="upload-zone-sub">Only .SVG files accepted</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)' }}>
                <Upload size={14} /> Select SVG
              </div>
            </div>
          ) : (
            <div className="preview-container" style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 12, padding: 24, position: 'relative' }}>
              <button
                onClick={() => { setFile(null); setPreviewUrl(null); setResultUrl(null); setStatus('idle'); }}
                style={{ position: 'absolute', top: 12, right: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} color="#64748b" />
              </button>
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>SVG Preview</div>
                  <img src={previewUrl} alt="SVG Preview" style={{ width: '100%', maxHeight: 300, borderRadius: 8, background: '#fff', objectFit: 'contain', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                </div>
                {resultUrl && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#ec4899', marginBottom: 8 }}>Converted {outputFormat.toUpperCase()}</div>
                    <img src={resultUrl} alt="Result" style={{ width: '100%', maxHeight: 300, borderRadius: 8, background: '#fff', objectFit: 'contain', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  </div>
                )}
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 24 }}>
              <div className="progress-label"><span>Rendering SVG...</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '80%', background: '#ec4899' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24, borderColor: '#fbcfe8', background: '#fdf2f8' }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#ec4899" /></div>
              <div className="result-box-title" style={{ color: '#9d174d' }}>Conversion Complete!</div>
              <button className="download-btn" onClick={download} style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)' }}>
                <Download size={16} /> Download {outputFormat.toUpperCase()}
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🖼️ Export Settings</div>
            <div className="sidebar-card-body">
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>Output Format</label>
                <select className="sidebar-select" value={outputFormat} onChange={e => setOutputFormat(e.target.value)}>
                  <option value="png">PNG (Best quality, transparent)</option>
                  <option value="jpeg">JPEG (Smaller, no transparency)</option>
                  <option value="webp">WebP (Modern, great compression)</option>
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>
                  Resolution Scale
                  <span style={{ color: '#ec4899' }}>{scale}x</span>
                </label>
                <input
                  type="range" min="1" max="4" step="1" value={scale}
                  onChange={e => setScale(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#ec4899' }}
                />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  Higher scale = higher resolution (e.g. 2x doubles the pixel dimensions).
                </div>
              </div>

              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)' }}
                disabled={!file || status === 'processing'}
                onClick={processImage}
              >
                {status === 'processing' ? (
                  <><Loader2 className="animate-spin" size={18} /> Converting...</>
                ) : (
                  <><FileImage size={18} /> Convert SVG</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
