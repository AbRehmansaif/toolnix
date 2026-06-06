import { useState, useRef } from 'react';
import { Trash2, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2 } from 'lucide-react';
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

export default function PdfPageRemover() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState([]); // array of { pageNum, dataUrl }
  const [removedPages, setRemovedPages] = useState([]); // page numbers to remove (1-indexed)
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('removed.pdf');
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setStatus('loading_pdf');
      setPages([]);
      setRemovedPages([]);
      setOutputUrl(null);

      try {
        await loadScript('pdfjs-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js');
        const pdfjsLib = window.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

        const arrayBuffer = await f.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        const rendered = [];

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 }); // smaller scale for thumbnails
          
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          await page.render({
            canvasContext: ctx,
            viewport: viewport
          }).promise;

          rendered.push({
            pageNum: i,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8)
          });
        }
        setPages(rendered);
        setStatus('idle');
      } catch (err) {
        console.error(err);
        setFile(null);
        setStatus('idle');
        alert('Error loading PDF thumbnails: ' + err.message);
      }
    }
  };

  const togglePageRemoval = (pageNum) => {
    setRemovedPages(prev =>
      prev.includes(pageNum)
        ? prev.filter(p => p !== pageNum)
        : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  const process = async () => {
    if (!file) return;
    const remainingCount = pages.length - removedPages.length;
    if (remainingCount <= 0) {
      alert('You cannot remove all pages. At least one page must remain.');
      return;
    }

    setStatus('processing');
    setProgress(20);

    try {
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument } = window.PDFLib;
      setProgress(45);

      const arrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const targetPdf = await PDFDocument.create();

      setProgress(65);

      // Keep only pages that are NOT in removedPages
      const keepIndices = [];
      for (let i = 1; i <= pages.length; i++) {
        if (!removedPages.includes(i)) {
          keepIndices.push(i - 1);
        }
      }

      const copiedPages = await targetPdf.copyPages(sourcePdf, keepIndices);
      copiedPages.forEach(page => targetPdf.addPage(page));

      setProgress(85);

      const bytes = await targetPdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setOutputUrl(url);
      setOutputName(`${file.name.replace(/\.pdf$/i, '')}_edited.pdf`);
      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('Error removing pages: ' + err.message);
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

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-editing">PDF Editing</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">PDF Page Remover</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fef2f2' }}>
            <Trash2 size={36} color="#e54040" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">PDF Page Remover</div>
            <div className="tool-header-desc">
              Remove unwanted pages from your PDF with a simple click. Mark pages to delete visually.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Secure</span>
              <span className="info-chip">✓ Client-Side</span>
              <span className="info-chip">✓ Visual Deletion</span>
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
              <div className="upload-zone-icon"><Upload size={32} color="#e54040" /></div>
              <div className="upload-zone-title">Drop PDF file here</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#e54040,#ef4444)' }}>
                <Upload size={14} /> Select PDF
              </div>
            </div>
          ) : (
            <div>
              <div className="file-list" style={{ marginBottom: 20 }}>
                <div className="file-item">
                  <div className="file-item-icon" style={{ background: '#fef2f2' }}><FileIcon size={18} color="#e54040" /></div>
                  <span className="file-item-name">{file.name}</span>
                  <span className="file-item-size">{formatBytes(file.size)}</span>
                  <button className="file-item-remove" onClick={() => { setFile(null); setPages([]); setRemovedPages([]); setOutputUrl(null); setStatus('idle'); }}><X size={14} /></button>
                </div>
              </div>

              {status === 'loading_pdf' ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <Loader2 className="animate-spin" style={{ margin: '0 auto 12px' }} size={32} />
                  Rendering PDF page previews...
                </div>
              ) : pages.length > 0 && status !== 'done' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
                    {pages.map((p) => {
                      const isDeleted = removedPages.includes(p.pageNum);
                      return (
                        <div
                          key={p.pageNum}
                          onClick={() => togglePageRemoval(p.pageNum)}
                          style={{
                            border: isDeleted ? '2px solid #ef4444' : '1px solid #e5e7eb',
                            borderRadius: 8,
                            padding: 8,
                            textAlign: 'center',
                            background: isDeleted ? '#fef2f2' : '#fff',
                            cursor: 'pointer',
                            position: 'relative',
                            opacity: isDeleted ? 0.5 : 1,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                            <img src={p.dataUrl} alt={`Page ${p.pageNum}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: isDeleted ? '#b91c1c' : '#4b5563', textDecoration: isDeleted ? 'line-through' : 'none' }}>
                            Page {p.pageNum}
                          </div>
                          {isDeleted && (
                            <span style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>✕</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Removing Pages…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#e54040' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">Pages Removed!</div>
              <div className="result-box-sub">{removedPages.length} pages removed. New PDF contains {pages.length - removedPages.length} pages.</div>
              <button className="download-btn" onClick={download} style={{ background: 'linear-gradient(135deg,#e54040,#ef4444)' }}><Download size={16} /> Download Updated PDF</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Remove Options</div>
            <div className="sidebar-card-body">
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Click page previews in the grid to mark them for removal.
              </p>

              <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151', marginBottom: 16 }}>
                Remaining: <strong>{pages.length - removedPages.length}</strong> / {pages.length} pages
              </div>

              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#e54040,#ef4444)' }}
                disabled={!file || removedPages.length === 0 || status === 'processing'}
                onClick={process}
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Removing…
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Remove Pages
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
