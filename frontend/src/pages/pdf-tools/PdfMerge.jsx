import { useState, useRef } from 'react';
import { Combine, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

const loadScript = (id, src) => {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(script);
  });
};

export default function PdfMerge() {
  const [files, setFiles] = useState([]);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [mergedBlobUrl, setMergedBlobUrl] = useState(null);
  const [outputName, setOutputName] = useState('merged.pdf');
  const inputRef = useRef();

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f => f.type === 'application/pdf');
    setFiles(prev => {
      const ex = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...valid.filter(f => !ex.has(f.name + f.size))];
    });
    setMergedBlobUrl(null);
    setStatus('idle');
  };

  const remove = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setMergedBlobUrl(null);
    setStatus('idle');
  };

  const moveUp = (idx, e) => {
    e.stopPropagation();
    if (idx === 0) return;
    setFiles(prev => {
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      return next;
    });
    setMergedBlobUrl(null);
    setStatus('idle');
  };

  const moveDown = (idx, e) => {
    e.stopPropagation();
    if (idx === files.length - 1) return;
    setFiles(prev => {
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      return next;
    });
    setMergedBlobUrl(null);
    setStatus('idle');
  };

  const process = async () => {
    if (files.length < 2) return;
    setStatus('processing');
    setProgress(10);

    try {
      // 1. Load pdf-lib
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument } = window.PDFLib;
      setProgress(25);

      // 2. Create target PDF
      const mergedPdf = await PDFDocument.create();

      // 3. Load and merge files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
          reader.readAsArrayBuffer(file);
        });

        const subPdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(subPdf, subPdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));

        setProgress(25 + Math.round(((i + 1) / files.length) * 55));
      }

      // 4. Save and generate blob
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setMergedBlobUrl(url);
      setOutputName(files[0].name.replace(/\.pdf$/i, '_merged.pdf'));
      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('Error merging PDFs: ' + err.message);
    }
  };

  const download = () => {
    if (!mergedBlobUrl) return;
    const a = document.createElement('a');
    a.href = mergedBlobUrl;
    a.download = outputName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-editing">PDF Editing</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">PDF Merge</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fef2f2' }}>
            <Combine size={36} color="#e54040" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Merge PDF</div>
            <div className="tool-header-desc">
              Combine PDFs in the order you want with the easiest PDF merger available. Select multiple PDF files and merge them in seconds.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Secure</span>
              <span className="info-chip">✓ Client-Side</span>
              <span className="info-chip">✓ Instant</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        <div>
          <div
            className={`upload-zone${drag ? ' dragover' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="application/pdf" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
            <div className="upload-zone-icon"><Upload size={32} color="#e54040" /></div>
            <div className="upload-zone-title">Drop PDF files here</div>
            <div className="upload-zone-sub">Supports PDF — up to 100MB each</div>
            <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#e54040,#ef4444)', boxShadow: '0 8px 24px rgba(229,64,64,0.3)' }}>
              <Upload size={14} /> Select PDFs
            </div>
          </div>

          {files.length > 0 && (
            <div className="file-list">
              {files.map((f, i) => (
                <div key={i} className="file-item">
                  <div className="file-item-icon" style={{ background: '#fef2f2' }}><FileIcon size={18} color="#e54040" /></div>
                  <span className="file-item-name">{f.name}</span>
                  <span className="file-item-size">{formatBytes(f.size)}</span>
                  <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
                    <button className="file-item-remove" disabled={i === 0} onClick={(e) => moveUp(i, e)} title="Move Up"><ArrowUp size={14} /></button>
                    <button className="file-item-remove" disabled={i === files.length - 1} onClick={(e) => moveDown(i, e)} title="Move Down"><ArrowDown size={14} /></button>
                  </div>
                  <button className="file-item-remove" onClick={(e) => { e.stopPropagation(); remove(i); }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label">
                <span>Merging {files.length} PDFs…</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#e54040,#ef4444)' }} />
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} /></div>
              <div className="result-box-title">PDFs Merged!</div>
              <div className="result-box-sub">{files.length} documents combined into one</div>
              <button className="download-btn" onClick={download}><Download size={16} /> Download Merged PDF</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Merge Options</div>
            <div className="sidebar-card-body">
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Reorder files using Up/Down arrows, then click the button below to merge them.
              </p>
              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#e54040,#ef4444)' }}
                disabled={files.length < 2 || status === 'processing'}
                onClick={process}
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Merging…
                  </>
                ) : (
                  <>
                    <Combine size={18} />
                    Merge PDFs
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
