import { useState, useRef } from 'react';
import { ImageDown, Upload, X, Download, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

const loadScript = (id, src) => {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

// DPI → scale factor (PDF.js renders at 96 DPI internally)
const DPI_SCALE = { '72': 0.75, '96': 1.0, '150': 1.5625, '300': 3.125 };
// Quality → canvas quality value
const QUALITY_MAP = { 'Low': 0.6, 'Medium': 0.8, 'High': 0.92, 'Maximum': 1.0 };

export default function PdfToImage() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [images, setImages] = useState([]); // { pageNum, dataUrl, name }[]
  const [zipBlobUrl, setZipBlobUrl] = useState(null);
  const [zipFileName, setZipFileName] = useState('images.zip');
  const [errorMsg, setErrorMsg] = useState('');

  // Settings
  const [format, setFormat] = useState('JPG');       // JPG | PNG | WebP
  const [quality, setQuality] = useState('High');
  const [dpi, setDpi] = useState('150');

  const inputRef = useRef();

  const reset = () => {
    setFile(null);
    setImages([]);
    setZipBlobUrl(null);
    setStatus('idle');
    setProgress(0);
    setProgressLabel('');
    setErrorMsg('');
  };

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      reset();
      setFile(f);
    }
  };

  const getMimeType = () => {
    if (format === 'PNG') return 'image/png';
    if (format === 'WebP') return 'image/webp';
    return 'image/jpeg';
  };

  const getExt = () => format.toLowerCase();

  const handleConvert = async () => {
    if (!file) return;
    setStatus('processing');
    setProgress(5);
    setProgressLabel('Loading PDF engine…');
    setImages([]);
    setZipBlobUrl(null);
    setErrorMsg('');

    try {
      // 1. Load PDF.js from CDN
      await loadScript('pdfjs-lib', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js');
      const pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

      setProgress(12);
      setProgressLabel('Reading PDF…');

      // 2. Read file as ArrayBuffer
      const arrayBuffer = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target.result);
        reader.onerror = () => rej(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      });

      // 3. Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const scale = DPI_SCALE[dpi] ?? 1.5625;
      const mime = getMimeType();
      const ext = getExt();
      const qualityVal = QUALITY_MAP[quality] ?? 0.92;
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const extractedImages = [];

      setProgress(15);

      // 4. Render each page to canvas → dataURL
      for (let i = 1; i <= numPages; i++) {
        setProgressLabel(`Converting page ${i} of ${numPages}…`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        // White background for JPG (transparent otherwise looks black)
        if (format !== 'PNG') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        await page.render({ canvasContext: ctx, viewport }).promise;

        const dataUrl = canvas.toDataURL(mime, qualityVal);
        extractedImages.push({
          pageNum: i,
          dataUrl,
          name: `${baseName}_page_${i}.${ext}`,
        });

        setProgress(15 + Math.round((i / numPages) * 65));
      }

      setImages(extractedImages);
      setProgress(82);
      setProgressLabel('Creating ZIP archive…');

      // 5. Bundle into ZIP using JSZip
      await loadScript('jszip-lib', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      const zip = new window.JSZip();
      extractedImages.forEach((img) => {
        const base64 = img.dataUrl.split(',')[1];
        zip.file(img.name, base64, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);

      setZipBlobUrl(zipUrl);
      setZipFileName(`${baseName}_${format.toLowerCase()}_images.zip`);
      setProgress(100);
      setProgressLabel('Done!');
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Unknown error occurred');
    }
  };

  const downloadAll = () => {
    if (!zipBlobUrl) return;
    const a = document.createElement('a');
    a.href = zipBlobUrl;
    a.download = zipFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadSingle = (img) => {
    const a = document.createElement('a');
    a.href = img.dataUrl;
    a.download = img.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const accentColor = '#f97316';
  const accentGrad = 'linear-gradient(135deg,#f97316,#ea580c)';

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#image-tools">Image Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">PDF to Image</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fff7ed' }}>
            <ImageDown size={36} color={accentColor} strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">PDF to Image</div>
            <div className="tool-header-desc">
              Convert every page of your PDF into high-quality JPG, PNG, or WebP images in bulk.
              Choose DPI and quality for perfect output. 100% client-side — your files never leave your browser.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              {['JPG', 'PNG', 'WebP'].map(t => <span key={t} className="info-chip">✓ {t}</span>)}
              <span className="info-chip">🔒 100% Private</span>
              <span className="info-chip">📄 Bulk pages</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        {/* Left column */}
        <div>
          {/* Upload zone */}
          <div
            className={`upload-zone${drag ? ' dragover' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
            <div className="upload-zone-icon"><Upload size={32} color={accentColor} /></div>
            <div className="upload-zone-title">Drop your PDF here or click to browse</div>
            <div className="upload-zone-sub">Only PDF files accepted — up to 100 MB</div>
            <div className="upload-zone-btn" style={{ background: accentGrad }}>
              <Upload size={14} /> Select PDF
            </div>
          </div>

          {/* File chip */}
          {file && (
            <div className="file-list" style={{ marginTop: 16 }}>
              <div className="file-item">
                <div className="file-item-icon" style={{ background: '#fff7ed' }}>
                  <ImageDown size={18} color={accentColor} />
                </div>
                <span className="file-item-name">{file.name}</span>
                <span className="file-item-size">{formatBytes(file.size)}</span>
                <button className="file-item-remove" onClick={reset}><X size={14} /></button>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 20 }}>
              <div className="progress-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={13} className="animate-spin" />
                  {progressLabel}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%`, background: accentGrad }} />
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{
              marginTop: 20, padding: '14px 18px', background: '#fef2f2', border: '1px solid #fca5a5',
              borderRadius: 10, color: '#b91c1c', fontSize: 13
            }}>
              <strong>Conversion failed:</strong> {errorMsg}
              <button onClick={reset} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontSize: 13 }}>
                Try again
              </button>
            </div>
          )}

          {/* Results */}
          {status === 'done' && images.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="result-box" style={{ marginBottom: 24 }}>
                <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
                <div className="result-box-title">{images.length} page{images.length > 1 ? 's' : ''} converted!</div>
                <button className="download-btn" style={{ background: accentGrad }} onClick={downloadAll}>
                  <Download size={16} /> Download All as ZIP
                </button>
              </div>

              {/* Image grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 14
              }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #e5e7eb', borderRadius: 10, padding: 8,
                    background: '#fff', textAlign: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }}>
                    <div style={{
                      height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#f9fafb', borderRadius: 6, overflow: 'hidden', marginBottom: 8
                    }}>
                      <img
                        src={img.dataUrl}
                        alt={`Page ${img.pageNum}`}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      Page {img.pageNum}
                    </div>
                    <button
                      onClick={() => downloadSingle(img)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11, padding: '4px 10px',
                        background: '#fff7ed', border: `1px solid ${accentColor}`,
                        borderRadius: 5, cursor: 'pointer', color: accentColor, fontWeight: 500
                      }}
                    >
                      <Download size={11} /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Conversion Settings</div>
            <div className="sidebar-card-body">

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#475569' }}>
                  Output Format
                </label>
                <select
                  className="sidebar-select"
                  value={format}
                  onChange={e => { setFormat(e.target.value); setStatus('idle'); setImages([]); }}
                  disabled={status === 'processing'}
                >
                  <option value="JPG">JPG — Smaller file size</option>
                  <option value="PNG">PNG — Lossless, transparent</option>
                  <option value="WebP">WebP — Best compression</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#475569' }}>
                  DPI (Resolution)
                </label>
                <select
                  className="sidebar-select"
                  value={dpi}
                  onChange={e => { setDpi(e.target.value); setStatus('idle'); setImages([]); }}
                  disabled={status === 'processing'}
                >
                  <option value="72">72 DPI — Screen quality</option>
                  <option value="96">96 DPI — Standard</option>
                  <option value="150">150 DPI — Good quality</option>
                  <option value="300">300 DPI — Print quality</option>
                </select>
              </div>

              {format !== 'PNG' && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#475569' }}>
                    Image Quality
                  </label>
                  <select
                    className="sidebar-select"
                    value={quality}
                    onChange={e => { setQuality(e.target.value); setStatus('idle'); setImages([]); }}
                    disabled={status === 'processing'}
                  >
                    <option value="Low">Low (60%)</option>
                    <option value="Medium">Medium (80%)</option>
                    <option value="High">High (92%)</option>
                    <option value="Maximum">Maximum (100%)</option>
                  </select>
                </div>
              )}

              <button
                className="tool-action-btn"
                style={{ background: accentGrad }}
                disabled={!file || status === 'processing'}
                onClick={handleConvert}
              >
                {status === 'processing'
                  ? <><Loader2 size={18} className="animate-spin" /> Converting…</>
                  : <><ImageDown size={18} /> Convert to {format}</>
                }
              </button>
            </div>
          </div>

          <div className="tool-sidebar-card" style={{ marginTop: 16 }}>
            <div className="sidebar-card-header">ℹ️ How it works</div>
            <div className="sidebar-card-body">
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Each PDF page is rendered using PDF.js directly in your browser at the selected DPI, then
                exported as the chosen image format. All pages are bundled into a ZIP for easy download.
                Your files never leave your device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
