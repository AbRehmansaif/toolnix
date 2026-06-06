import { useState, useRef } from 'react';
import { ArrowUpDown, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
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

export default function PdfPageReorder() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState([]); // array of { pageNum, originalIndex, dataUrl }
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('reordered.pdf');
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setStatus('loading_pdf');
      setPages([]);
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
            originalIndex: i - 1,
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

  const moveLeft = (idx) => {
    if (idx === 0) return;
    setPages(prev => {
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      return next;
    });
  };

  const moveRight = (idx) => {
    if (idx === pages.length - 1) return;
    setPages(prev => {
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      return next;
    });
  };

  const process = async () => {
    if (!file) return;
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

      // Copy pages in the new index order
      const targetIndices = pages.map(p => p.originalIndex);
      const copiedPages = await targetPdf.copyPages(sourcePdf, targetIndices);
      copiedPages.forEach(page => targetPdf.addPage(page));

      setProgress(85);

      const bytes = await targetPdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setOutputUrl(url);
      setOutputName(`${file.name.replace(/\.pdf$/i, '')}_reordered.pdf`);
      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('Error reordering pages: ' + err.message);
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
        <span className="tool-breadcrumb-current">PDF Page Reorder</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#faf5ff' }}>
            <ArrowUpDown size={36} color="#a855f7" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">PDF Page Reorder</div>
            <div className="tool-header-desc">
              Rearrange the pages of your PDF document. Load a file, position its pages, and download.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Secure</span>
              <span className="info-chip">✓ Client-Side</span>
              <span className="info-chip">✓ Visual Reordering</span>
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
              <div className="upload-zone-icon"><Upload size={32} color="#a855f7" /></div>
              <div className="upload-zone-title">Drop PDF file here</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#a855f7,#9333ea)' }}>
                <Upload size={14} /> Select PDF
              </div>
            </div>
          ) : (
            <div>
              <div className="file-list" style={{ marginBottom: 20 }}>
                <div className="file-item">
                  <div className="file-item-icon" style={{ background: '#faf5ff' }}><FileIcon size={18} color="#a855f7" /></div>
                  <span className="file-item-name">{file.name}</span>
                  <span className="file-item-size">{formatBytes(file.size)}</span>
                  <button className="file-item-remove" onClick={() => { setFile(null); setPages([]); setOutputUrl(null); setStatus('idle'); }}><X size={14} /></button>
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
                    {pages.map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          padding: 8,
                          textAlign: 'center',
                          background: '#fff',
                          position: 'relative'
                        }}
                      >
                        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                          <img src={p.dataUrl} alt={`Page ${p.pageNum}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>
                          Page {p.pageNum}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                          <button
                            onClick={() => moveLeft(idx)}
                            disabled={idx === 0}
                            style={{
                              padding: 4,
                              background: idx === 0 ? '#f3f4f6' : '#faf5ff',
                              border: '1px solid #e5e7eb',
                              borderRadius: 4,
                              cursor: idx === 0 ? 'not-allowed' : 'pointer',
                              color: '#a855f7'
                            }}
                          >
                            <ArrowLeft size={14} />
                          </button>
                          <button
                            onClick={() => moveRight(idx)}
                            disabled={idx === pages.length - 1}
                            style={{
                              padding: 4,
                              background: idx === pages.length - 1 ? '#f3f4f6' : '#faf5ff',
                              border: '1px solid #e5e7eb',
                              borderRadius: 4,
                              cursor: idx === pages.length - 1 ? 'not-allowed' : 'pointer',
                              color: '#a855f7'
                            }}
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Reordering Pages…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#a855f7' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">Pages Reordered!</div>
              <button className="download-btn" onClick={download} style={{ background: 'linear-gradient(135deg,#a855f7,#9333ea)' }}><Download size={16} /> Download Updated PDF</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Reorder Options</div>
            <div className="sidebar-card-body">
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Use the left/right arrows under each page thumbnail to arrange them in your preferred sequence.
              </p>
              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#a855f7,#9333ea)' }}
                disabled={!file || status === 'processing'}
                onClick={process}
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Reordering…
                  </>
                ) : (
                  <>
                    <ArrowUpDown size={18} />
                    Reorder Pages
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
