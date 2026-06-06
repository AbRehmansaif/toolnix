import { useState, useRef } from 'react';
import { ScanText, Upload, X, Copy, Download, ChevronRight, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

// Map display language names → Tesseract language codes
const LANG_MAP = {
  'English':     'eng',
  'Spanish':     'spa',
  'French':      'fra',
  'German':      'deu',
  'Italian':     'ita',
  'Portuguese':  'por',
  'Arabic':      'ara',
  'Chinese (Simplified)': 'chi_sim',
  'Japanese':    'jpn',
  'Korean':      'kor',
  'Russian':     'rus',
  'Hindi':       'hin',
};

const loadScript = (id, src) =>
  new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });

export default function OcrImageToText() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState('English');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef();

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStatus('idle');
    setProgress(0);
    setProgressLabel('');
    setText('');
    setErrorMsg('');
  };

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    reset();
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleExtract = async () => {
    if (!file) return;
    setStatus('processing');
    setProgress(5);
    setProgressLabel('Loading OCR engine…');
    setText('');
    setErrorMsg('');

    try {
      // Load Tesseract.js v4 from CDN
      await loadScript(
        'tesseract-js',
        'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
      );

      const Tesseract = window.Tesseract;
      const langCode = LANG_MAP[lang] || 'eng';

      setProgressLabel(`Running OCR (${lang})…`);

      const result = await Tesseract.recognize(file, langCode, {
        logger: (m) => {
          if (m.status === 'loading tesseract core') {
            setProgress(10);
            setProgressLabel('Loading Tesseract core…');
          } else if (m.status === 'initializing tesseract') {
            setProgress(20);
            setProgressLabel('Initializing engine…');
          } else if (m.status === 'loading language traineddata') {
            setProgress(30);
            setProgressLabel(`Downloading language data (${lang})…`);
          } else if (m.status === 'initializing api') {
            setProgress(45);
            setProgressLabel('Initializing API…');
          } else if (m.status === 'recognizing text') {
            const pct = 45 + Math.round((m.progress || 0) * 50);
            setProgress(pct);
            setProgressLabel('Recognizing text…');
          }
        },
      });

      const extracted = result.data.text.trim();
      setText(extracted || '(No text could be extracted from this image)');
      setProgress(100);
      setProgressLabel('Done!');
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'OCR failed. Please try a different image.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `${file?.name?.replace(/\.[^/.]+$/, '') || 'extracted'}-text.txt`;
    a.click();
  };

  const wordCount = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = text.length;

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#image-tools">Image Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">OCR Image to Text</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#eff6ff' }}>
            <ScanText size={36} color="#3b82f6" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <span className="tool-header-badge badge-ai">✨ Tesseract OCR</span>
            <div className="tool-header-title">OCR Image to Text</div>
            <div className="tool-header-desc">
              Extract text from scanned documents, receipts, invoices, and any image using
              Tesseract OCR — runs entirely in your browser. No uploads, no servers.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">🌐 12 Languages</span>
              <span className="info-chip">📄 Scanned docs</span>
              <span className="info-chip">🧾 Receipts</span>
              <span className="info-chip">🔒 100% Private</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        {/* Left column */}
        <div>
          {!preview ? (
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
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
              />
              <div className="upload-zone-icon"><Upload size={32} color="#3b82f6" /></div>
              <div className="upload-zone-title">Drop image here or click to browse</div>
              <div className="upload-zone-sub">Supports JPG, PNG, TIFF, BMP, WebP — up to 20 MB</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}>
                <Upload size={14} /> Select Image
              </div>
            </div>
          ) : (
            <div className="preview-area">
              <div className="preview-header">
                <span className="preview-header-title">
                  📷 {file?.name} — {formatBytes(file?.size || 0)}
                </span>
                <button className="file-item-remove" onClick={reset}>
                  <X size={14} />
                </button>
              </div>
              <div className="preview-body" style={{ textAlign: 'center' }}>
                <img
                  src={preview}
                  alt="preview"
                  style={{ maxHeight: 300, maxWidth: '100%', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                />
              </div>
            </div>
          )}

          {/* Progress */}
          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 20 }}>
              <div className="progress-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} />
                  {progressLabel}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#3b82f6,#6366f1)' }} />
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
                First run downloads the language model (~10 MB). Subsequent runs are instant.
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{
              marginTop: 20, padding: '14px 18px', background: '#fef2f2',
              border: '1px solid #fca5a5', borderRadius: 10,
              display: 'flex', gap: 10, alignItems: 'flex-start'
            }}>
              <AlertCircle size={18} color="#b91c1c" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#b91c1c', fontSize: 13, marginBottom: 4 }}>OCR failed</div>
                <div style={{ color: '#7f1d1d', fontSize: 12 }}>{errorMsg}</div>
                <button onClick={reset} style={{ marginTop: 8, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontSize: 12, padding: 0 }}>
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Result text */}
          {status === 'done' && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  Extracted Text — {wordCount} words, {charCount} chars
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
                    <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    className="download-btn"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={handleDownload}
                  >
                    <Download size={12} /> Save .txt
                  </button>
                </div>
              </div>
              <div className="ocr-result" style={{ whiteSpace: 'pre-wrap', minHeight: 120 }}>
                {text}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ OCR Settings</div>
            <div className="sidebar-card-body">

              <div className="sidebar-option">
                <span className="sidebar-option-label">Language</span>
                <select
                  className="sidebar-select"
                  value={lang}
                  onChange={e => setLang(e.target.value)}
                  disabled={status === 'processing'}
                >
                  {Object.keys(LANG_MAP).map(l => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>

              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 8px 24px rgba(59,130,246,0.3)', marginTop: 8 }}
                disabled={!file || status === 'processing'}
                onClick={handleExtract}
              >
                {status === 'processing'
                  ? <><Loader2 size={18} className="animate-spin" /> Running OCR…</>
                  : <><ScanText size={18} /> Extract Text (OCR)</>
                }
              </button>
            </div>
          </div>

          <div className="tool-sidebar-card" style={{ marginTop: 16 }}>
            <div className="sidebar-card-header">💡 Tips for best results</div>
            <div className="sidebar-card-body">
              <ul style={{ fontSize: 12, color: 'var(--color-text-secondary)', paddingLeft: 16, lineHeight: 1.8, margin: 0 }}>
                <li>Use high-resolution images (150+ DPI)</li>
                <li>Ensure text is horizontal, not rotated</li>
                <li>Good lighting and contrast helps accuracy</li>
                <li>Select the correct document language</li>
                <li>PNG works better than compressed JPG</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
