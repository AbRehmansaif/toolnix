import { useState, useRef, useEffect } from 'react';
import { MonitorDown, Upload, X, Copy, Download, ChevronRight, Sparkles, Loader2, AlertCircle, ClipboardPaste } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

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

export default function ScreenshotToText() {
  const [file, setFile]               = useState(null);
  const [preview, setPreview]         = useState(null);
  const [drag, setDrag]               = useState(false);
  const [status, setStatus]           = useState('idle'); // idle | processing | done | error
  const [progress, setProgress]       = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [text, setText]               = useState('');
  const [copied, setCopied]           = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [pasteHint, setPasteHint]     = useState('');

  const inputRef = useRef();

  /* ── helpers ─────────────────────────────────────────── */
  const reset = () => {
    setFile(null);
    setPreview(null);
    setStatus('idle');
    setProgress(0);
    setProgressLabel('');
    setText('');
    setErrorMsg('');
  };

  const loadImage = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    reset();
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  /* ── clipboard paste (Ctrl+V anywhere on page) ────────── */
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          loadImage(new File([blob], 'screenshot.png', { type: blob.type }));
          return;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  /* ── Clipboard API button ──────────────────────────────── */
  const handleClipboardBtn = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            loadImage(new File([blob], 'screenshot.png', { type }));
            return;
          }
        }
      }
      setPasteHint('No image found in clipboard. Copy a screenshot first, then click again.');
      setTimeout(() => setPasteHint(''), 4000);
    } catch {
      setPasteHint('Clipboard access denied. Use Ctrl+V while on this page instead.');
      setTimeout(() => setPasteHint(''), 4000);
    }
  };

  /* ── Tesseract OCR ─────────────────────────────────────── */
  const handleExtract = async () => {
    if (!file) return;
    setStatus('processing');
    setProgress(5);
    setProgressLabel('Loading OCR engine…');
    setText('');
    setErrorMsg('');

    try {
      await loadScript(
        'tesseract-js',
        'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
      );

      const Tesseract = window.Tesseract;

      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'loading tesseract core') {
            setProgress(10); setProgressLabel('Loading Tesseract core…');
          } else if (m.status === 'initializing tesseract') {
            setProgress(22); setProgressLabel('Initializing engine…');
          } else if (m.status === 'loading language traineddata') {
            setProgress(35); setProgressLabel('Downloading English language data…');
          } else if (m.status === 'initializing api') {
            setProgress(48); setProgressLabel('Initializing API…');
          } else if (m.status === 'recognizing text') {
            const pct = 48 + Math.round((m.progress || 0) * 48);
            setProgress(pct); setProgressLabel('Reading text from screenshot…');
          }
        },
      });

      const extracted = result.data.text.trim();
      setText(extracted || '(No text could be extracted from this screenshot)');
      setProgress(100);
      setProgressLabel('Done!');
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'OCR failed. Please try a clearer screenshot.');
    }
  };

  /* ── copy / download ───────────────────────────────────── */
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `${file?.name?.replace(/\.[^/.]+$/, '') || 'screenshot'}-text.txt`;
    a.click();
  };

  const wordCount = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  /* ── render ────────────────────────────────────────────── */
  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#image-tools">Image Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Screenshot to Text</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#eff6ff' }}>
            <MonitorDown size={36} color="#3b82f6" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <span className="tool-header-badge badge-ai">✨ Tesseract OCR</span>
            <div className="tool-header-title">Screenshot to Text</div>
            <div className="tool-header-desc">
              Instantly extract text from screenshots using real OCR — runs entirely in your browser.
              Paste directly from clipboard with Ctrl+V or upload a screenshot file.
              Perfect for meeting notes, chat exports, error messages, and UI text.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">📋 Ctrl+V paste</span>
              <span className="info-chip">🖥 UI screenshots</span>
              <span className="info-chip">⚡ Client-side</span>
              <span className="info-chip">🔒 100% Private</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">

        {/* ── Left column ─────────────────────────────────── */}
        <div>
          {!preview ? (
            <>
              {/* Drag-drop / click zone */}
              <div
                className={`upload-zone${drag ? ' dragover' : ''}`}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); loadImage(e.dataTransfer.files[0]); }}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => loadImage(e.target.files[0])}
                />
                <div className="upload-zone-icon"><MonitorDown size={32} color="#3b82f6" /></div>
                <div className="upload-zone-title">Drop screenshot here or click to browse</div>
                <div className="upload-zone-sub">Or press <strong>Ctrl+V</strong> anywhere on this page to paste from clipboard</div>
                <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}>
                  <Upload size={14} /> Select Screenshot
                </div>
              </div>

              {/* Clipboard paste button */}
              <button
                onClick={handleClipboardBtn}
                style={{
                  width: '100%', marginTop: 12, padding: '14px',
                  border: '2px dashed var(--color-border-hover)',
                  borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-white)',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
                  fontWeight: 600, color: 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'border-color 0.2s, color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
              >
                <ClipboardPaste size={18} /> Paste Image from Clipboard
              </button>

              {/* Hint message */}
              {pasteHint && (
                <div style={{
                  marginTop: 10, padding: '10px 14px', background: '#fefce8',
                  border: '1px solid #fde047', borderRadius: 8,
                  fontSize: 12, color: '#78350f'
                }}>
                  {pasteHint}
                </div>
              )}
            </>
          ) : (
            /* ── Preview ──────────────────────────────────── */
            <div className="preview-area">
              <div className="preview-header">
                <span className="preview-header-title">
                  🖥 {file?.name} — {formatBytes(file?.size || 0)}
                </span>
                <button className="file-item-remove" onClick={reset}>
                  <X size={14} />
                </button>
              </div>
              <div className="preview-body" style={{ textAlign: 'center' }}>
                <img
                  src={preview}
                  alt="screenshot preview"
                  style={{ maxHeight: 320, maxWidth: '100%', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                />
              </div>
            </div>
          )}

          {/* ── Progress ──────────────────────────────────── */}
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
                <div className="progress-fill" style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg,#3b82f6,#6366f1)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
                First run downloads the language model (~10 MB). Subsequent runs are instant.
              </div>
            </div>
          )}

          {/* ── Error ─────────────────────────────────────── */}
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
                <button onClick={reset} style={{
                  marginTop: 8, textDecoration: 'underline', background: 'none',
                  border: 'none', cursor: 'pointer', color: '#b91c1c', fontSize: 12, padding: 0
                }}>
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* ── Result text area ──────────────────────────── */}
          {status === 'done' && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 8,
                flexWrap: 'wrap', gap: 8
              }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  Extracted Text — {wordCount} word{wordCount !== 1 ? 's' : ''}, {text.length} chars
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
                    <Copy size={12} /> {copied ? 'Copied!' : 'Copy All'}
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
              <div
                className="ocr-result"
                style={{ whiteSpace: 'pre-wrap', minHeight: 140, userSelect: 'text' }}
              >
                {text}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Settings</div>
            <div className="sidebar-card-body">
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                Optimised for English screenshots. For other languages, use the <strong>OCR Image to Text</strong> tool which supports 12 languages.
              </p>
              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}
                disabled={!file || status === 'processing'}
                onClick={handleExtract}
              >
                {status === 'processing'
                  ? <><Loader2 size={18} className="animate-spin" /> Running OCR…</>
                  : <><MonitorDown size={18} /> Extract Text</>
                }
              </button>
            </div>
          </div>

          <div className="tool-sidebar-card" style={{ marginTop: 16 }}>
            <div className="sidebar-card-header">📋 How to paste</div>
            <div className="sidebar-card-body">
              <ol style={{ fontSize: 12, color: 'var(--color-text-secondary)', paddingLeft: 18, lineHeight: 2, margin: 0 }}>
                <li>Take a screenshot (e.g. <strong>Win+Shift+S</strong>)</li>
                <li>Click anywhere on this page</li>
                <li>Press <strong>Ctrl+V</strong></li>
                <li>Click <em>Extract Text</em></li>
              </ol>
            </div>
          </div>

          <div className="tool-sidebar-card" style={{ marginTop: 16 }}>
            <div className="sidebar-card-header">💡 Best results</div>
            <div className="sidebar-card-body">
              <ul style={{ fontSize: 12, color: 'var(--color-text-secondary)', paddingLeft: 16, lineHeight: 1.9, margin: 0 }}>
                <li>High contrast text works best</li>
                <li>Avoid heavily compressed JPGs</li>
                <li>Dark-mode screenshots are supported</li>
                <li>Bigger text = higher accuracy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
