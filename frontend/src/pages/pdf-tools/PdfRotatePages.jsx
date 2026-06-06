import { useState, useRef } from 'react';
import { RotateCw, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2 } from 'lucide-react';
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

export default function PdfRotatePages() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState([]); // array of { pageNum, dataUrl, rotation: 0|90|180|270 }
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('rotated.pdf');
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
            dataUrl: canvas.toDataURL('image/jpeg', 0.8),
            rotation: 0
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

  const rotatePage = (pageNum) => {
    setPages(prev =>
      prev.map(p =>
        p.pageNum === pageNum
          ? { ...p, rotation: (p.rotation + 90) % 360 }
          : p
      )
    );
  };

  const rotateAllClockwise = () => {
    setPages(prev => prev.map(p => ({ ...p, rotation: (p.rotation + 90) % 360 })));
  };

  const process = async () => {
    if (!file) return;
    setStatus('processing');
    setProgress(20);

    try {
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument, degrees } = window.PDFLib;
      setProgress(45);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pdfPages = pdfDoc.getPages();

      setProgress(70);

      // Apply rotations
      pages.forEach((p, idx) => {
        if (p.rotation !== 0) {
          const page = pdfPages[idx];
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + p.rotation) % 360));
        }
      });

      setProgress(85);

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setOutputUrl(url);
      setOutputName(`${file.name.replace(/\.pdf$/i, '')}_rotated.pdf`);
      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('Error rotating pages: ' + err.message);
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
        <span className="tool-breadcrumb-current">PDF Rotate Pages</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#f0fdfa' }}>
            <RotateCw size={36} color="#14b8a6" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">PDF Rotate Pages</div>
            <div className="tool-header-desc">
              Rotate your PDFs the way you need them. Portrait or landscape, instantly. Click pages to rotate them individually.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Secure</span>
              <span className="info-chip">✓ Client-Side</span>
              <span className="info-chip">✓ Visual Rotation</span>
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
              <div className="upload-zone-icon"><Upload size={32} color="#14b8a6" /></div>
              <div className="upload-zone-title">Drop PDF file here</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#14b8a6,#0d9488)' }}>
                <Upload size={14} /> Select PDF
              </div>
            </div>
          ) : (
            <div>
              <div className="file-list" style={{ marginBottom: 20 }}>
                <div className="file-item">
                  <div className="file-item-icon" style={{ background: '#f0fdfa' }}><FileIcon size={18} color="#14b8a6" /></div>
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
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <button onClick={rotateAllClockwise} style={{ fontSize: 12, padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><RotateCw size={12} /> Rotate All 90° Clockwise</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: 16 }}>
                    {pages.map((p) => (
                      <div
                        key={p.pageNum}
                        onClick={() => rotatePage(p.pageNum)}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          padding: 8,
                          textAlign: 'center',
                          background: '#fff',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                          <img
                            src={p.dataUrl}
                            alt={`Page ${p.pageNum}`}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              transform: `rotate(${p.rotation}deg)`,
                              transition: 'transform 0.25s ease'
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          Page {p.pageNum} <RotateCw size={12} color="#14b8a6" />
                        </div>
                        {p.rotation !== 0 && (
                          <span style={{ position: 'absolute', top: 8, right: 8, background: '#14b8a6', color: '#fff', borderRadius: 4, padding: '2px 4px', fontSize: 10, fontWeight: 'bold' }}>
                            {p.rotation}°
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Rotating Pages…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#14b8a6' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">Pages Rotated!</div>
              <button className="download-btn" onClick={download} style={{ background: 'linear-gradient(135deg,#14b8a6,#0d9488)' }}><Download size={16} /> Download Updated PDF</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Rotate Options</div>
            <div className="sidebar-card-body">
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Click page thumbnails to rotate each individual page by 90° clockwise, or rotate all pages at once.
              </p>
              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#14b8a6,#0d9488)' }}
                disabled={!file || status === 'processing'}
                onClick={process}
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Rotating…
                  </>
                ) : (
                  <>
                    <RotateCw size={18} />
                    Rotate Pages
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
