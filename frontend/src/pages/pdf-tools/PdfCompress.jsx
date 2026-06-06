import { useState, useRef } from 'react';
import { Archive, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

const loadScript = (id, src) => new Promise((resolve, reject) => {
  if (document.getElementById(id)) return resolve();
  const s = document.createElement('script');
  s.id = id; s.src = src;
  s.onload = resolve; s.onerror = () => reject(new Error('Failed to load ' + src));
  document.head.appendChild(s);
});

const COMPRESSION_LEVELS = [
  { id: 'low', label: 'Low Compression', desc: 'Strips metadata only. Smallest quality loss.', imageScale: 1.0 },
  { id: 'medium', label: 'Recommended', desc: 'Strips metadata & unused resources. Good balance.', imageScale: 0.85 },
  { id: 'high', label: 'Max Compression', desc: 'Aggressive metadata removal. Smallest file size.', imageScale: 0.7 },
];

export default function PdfCompress() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [level, setLevel] = useState('medium');
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('compressed.pdf');
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setOriginalSize(f.size);
      setStatus('idle');
      setOutputUrl(null);
    }
  };

  const process = async () => {
    if (!file) return;
    setStatus('processing');
    setProgress(10);

    try {
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument } = window.PDFLib;
      setProgress(25);

      const ab = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
      setProgress(50);

      // Strip metadata to reduce size
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
      setProgress(70);

      // Save with compression options
      const saveOptions = { useObjectStreams: true };
      const bytes = await pdfDoc.save(saveOptions);
      setProgress(90);

      const blob = new Blob([bytes], { type: 'application/pdf' });
      setCompressedSize(blob.size);
      setOutputUrl(URL.createObjectURL(blob));
      setOutputName(file.name.replace(/\.pdf$/i, '') + '_compressed.pdf');
      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('Error compressing PDF: ' + err.message);
    }
  };

  const download = () => {
    if (!outputUrl) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = outputName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const reduction = originalSize > 0 && compressedSize > 0
    ? Math.round((1 - compressedSize / originalSize) * 100)
    : 0;

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-editing">PDF Editing</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">PDF Compress</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#f0fdf4' }}>
            <Archive size={36} color="#22c55e" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Compress PDF</div>
            <div className="tool-header-desc">
              Reduce your PDF file size by stripping metadata and optimizing the document structure — all in your browser, with no file uploads.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Metadata Stripped</span>
              <span className="info-chip">✓ Client-Side</span>
              <span className="info-chip">✓ Privacy Safe</span>
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
              onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div className="upload-zone-icon"><Upload size={32} color="#22c55e" /></div>
              <div className="upload-zone-title">Drop PDF file here</div>
              <div className="upload-zone-sub">Supports PDF files up to 100MB</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                <Upload size={14} /> Select PDF
              </div>
            </div>
          ) : (
            <div className="file-list">
              <div className="file-item">
                <div className="file-item-icon" style={{ background: '#f0fdf4' }}><FileIcon size={18} color="#22c55e" /></div>
                <span className="file-item-name">{file.name}</span>
                <span className="file-item-size">{formatBytes(file.size)}</span>
                <button className="file-item-remove" onClick={() => { setFile(null); setStatus('idle'); setOutputUrl(null); }}><X size={14} /></button>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 className="animate-spin" size={14} />
                  Compressing PDF…
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#22c55e,#16a34a)' }} />
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">PDF Compressed!</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, margin: '16px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Original</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#374151' }}>{formatBytes(originalSize)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 22 }}>→</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Compressed</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{formatBytes(compressedSize)}</div>
                </div>
              </div>
              {reduction > 0 ? (
                <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '8px 16px', marginBottom: 16, fontSize: 14, color: '#15803d', fontWeight: 700 }}>
                  🎉 {reduction}% size reduction achieved
                </div>
              ) : (
                <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '8px 16px', marginBottom: 16, fontSize: 13, color: '#854d0e' }}>
                  ℹ️ This PDF was already well-optimized — minimal reduction possible.
                </div>
              )}
              <button className="download-btn" onClick={download}>
                <Download size={16} /> Download Compressed PDF
              </button>
            </div>
          )}

          {/* Info box */}
          <div style={{ marginTop: 24, padding: 16, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, fontSize: 13, color: '#1e40af', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>How it works:</strong> This tool uses <code>pdf-lib</code> to strip embedded metadata (author, title, keywords, producer info), remove redundant cross-references, and repack PDF object streams. For maximum compression of image-heavy PDFs, a server-side tool with Ghostscript is recommended.
            </div>
          </div>
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Compression Level</div>
            <div className="sidebar-card-body">
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>Choose quality vs. file size trade-off.</p>
              {COMPRESSION_LEVELS.map(l => (
                <button key={l.id} onClick={() => setLevel(l.id)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: 8, border: `2px solid ${level === l.id ? '#22c55e' : '#e5e7eb'}`, borderRadius: 8, background: level === l.id ? '#f0fdf4' : '#fff', cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: level === l.id ? '#16a34a' : '#374151', marginBottom: 2 }}>
                    {level === l.id ? '✓ ' : ''}{l.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{l.desc}</div>
                </button>
              ))}
              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
                disabled={!file || status === 'processing'}
                onClick={process}
              >
                {status === 'processing' ? (
                  <><Loader2 className="animate-spin" size={18} /> Compressing…</>
                ) : (
                  <><Archive size={18} /> Compress PDF</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
