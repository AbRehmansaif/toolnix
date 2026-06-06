import { useState, useRef } from 'react';
import { FileText, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, AlertCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

export default function PdfToWord() {
  const [file, setFile]               = useState(null);
  const [drag, setDrag]               = useState(false);
  const [status, setStatus]           = useState('idle');   // idle | processing | done | error
  const [progress, setProgress]       = useState(0);
  const [errorMsg, setErrorMsg]       = useState('');
  const [resultUrl, setResultUrl]     = useState(null);
  const [resultFilename, setResultFilename] = useState('');
  const inputRef = useRef();

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setStatus('idle');
      setResultUrl(null);
      setErrorMsg('');
    } else if (f) {
      setErrorMsg('Please upload a valid PDF file.');
    }
  };

  const reset = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setResultUrl(null);
    setErrorMsg('');
  };

  const process = () => {
    if (!file) return;
    setStatus('processing');
    setProgress(0);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/pdf-to-word/', true);
    xhr.responseType = 'blob';

    // Upload progress → 0–40%
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 40));
      }
    };

    // Simulate server-side progress 40% → 90%
    let interval;
    xhr.onloadstart = () => {
      let p = 40;
      interval = setInterval(() => {
        if (p < 90) { p += Math.random() * 4; setProgress(Math.min(90, Math.round(p))); }
      }, 600);
    };

    xhr.onload = () => {
      clearInterval(interval);
      setProgress(100);

      if (xhr.status === 200) {
        const blob = xhr.response;
        const url  = URL.createObjectURL(blob);
        setResultUrl(url);

        const disposition = xhr.getResponseHeader('Content-Disposition');
        let filename = file.name.replace(/\.pdf$/i, '.docx');
        if (disposition && disposition.includes('filename=')) {
          filename = disposition.split('filename=')[1].replace(/"/g, '').trim();
        }
        setResultFilename(filename);
        setStatus('done');
      } else {
        // Try to read the JSON error from the blob
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const json = JSON.parse(reader.result);
            if (xhr.status === 422) {
              setErrorMsg(
                json.error ||
                'This PDF appears to be scanned (image-only) and cannot be converted to editable text. ' +
                'Try our OCR Image to Text tool instead.'
              );
            } else {
              setErrorMsg(json.error || 'Conversion failed. Please try a different PDF.');
            }
          } catch {
            setErrorMsg('Conversion failed. Please try again with a different PDF.');
          }
          setStatus('error');
        };
        reader.readAsText(xhr.response);
      }
    };

    xhr.onerror = () => {
      clearInterval(interval);
      setErrorMsg('Network error. Please check your connection and try again.');
      setStatus('error');
    };

    xhr.send(formData);
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-conversion">PDF Conversion</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">PDF to Word</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#eef2ff' }}>
            <FileText size={36} color="#2b5ce7" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">PDF to Word</div>
            <div className="tool-header-desc">
              Convert PDF to fully editable DOC &amp; DOCX — preserves text, fonts, spacing &amp; formatting.
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        {/* ── Left: upload + progress + result ── */}
        <div>
          {!file ? (
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
              <div className="upload-zone-icon"><Upload size={32} color="#2b5ce7" /></div>
              <div className="upload-zone-title">Drop your PDF here</div>
              <div className="upload-zone-sub">Supports text-based PDFs up to 100 MB</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#2b5ce7,#1d4ed8)' }}>
                <Upload size={14} /> Select PDF
              </div>
            </div>
          ) : (
            <div className="file-list">
              <div className="file-item">
                <div className="file-item-icon" style={{ background: '#eef2ff' }}>
                  <FileIcon size={18} color="#2b5ce7" />
                </div>
                <span className="file-item-name">{file.name}</span>
                <span className="file-item-size">{formatBytes(file.size)}</span>
                {status !== 'processing' && (
                  <button className="file-item-remove" onClick={reset}><X size={14} /></button>
                )}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label">
                <span>{progress < 45 ? 'Uploading…' : 'Converting PDF to Word…'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#2b5ce7,#6366f1)' }}
                />
              </div>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                Preserving fonts, spacing &amp; formatting — this may take a moment for large files.
              </p>
            </div>
          )}

          {/* Success */}
          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} /></div>
              <div className="result-box-title">Converted Successfully!</div>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>
                Your Word document is ready. Fonts, headings, and spacing have been preserved.
              </p>
              <a href={resultUrl} download={resultFilename} style={{ textDecoration: 'none' }}>
                <button className="download-btn"><Download size={16} /> Download DOCX</button>
              </a>
              <button
                onClick={reset}
                style={{
                  marginTop: 12, display: 'block', width: '100%', padding: '10px',
                  background: 'none', border: '1px solid #e2e8f0', borderRadius: 8,
                  cursor: 'pointer', fontSize: 14, color: '#64748b',
                }}
              >
                Convert another PDF
              </button>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{
              marginTop: 20, padding: '16px 20px',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 10, display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#991b1b', fontSize: 14 }}>Conversion Failed</p>
                <p style={{ margin: '4px 0 12px', color: '#7f1d1d', fontSize: 13 }}>{errorMsg}</p>
                <button
                  onClick={() => setStatus('idle')}
                  style={{
                    padding: '8px 16px', background: '#ef4444', color: '#fff',
                    border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Info note */}
          <div style={{
            marginTop: 20, padding: '12px 16px',
            background: '#f0f9ff', border: '1px solid #bae6fd',
            borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Info size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 12, color: '#0c4a6e', lineHeight: 1.6 }}>
              <strong>Best results</strong> with text-based PDFs. Scanned PDFs (image-only) cannot be converted —
              use our <Link to="/tools/ocr-image-to-text" style={{ color: '#2b5ce7' }}>OCR Image to Text</Link> tool instead.
            </p>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Conversion Options</div>
            <div className="sidebar-card-body">
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Our two-stage converter preserves original layout, fonts, headings, and paragraph spacing.
              </p>
              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#2b5ce7,#1d4ed8)' }}
                disabled={!file || status === 'processing'}
                onClick={process}
              >
                <FileText size={18} />
                {status === 'processing' ? 'Converting…' : 'Convert to Word'}
              </button>
            </div>
          </div>

          {/* What's preserved */}
          <div className="tool-sidebar-card" style={{ marginTop: 16 }}>
            <div className="sidebar-card-header">✅ What's Preserved</div>
            <div className="sidebar-card-body">
              {[
                '📝 All text content',
                '🔤 Font sizes & styles',
                '**Bold** and *italic* formatting',
                '📐 Paragraph spacing',
                'Heading structure (H1, H2, H3)',
                '🎨 Text colors',
                '📄 Page breaks',
                '📊 Tables (when possible)',
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 0', fontSize: 13, color: '#475569',
                  borderBottom: i < 7 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
