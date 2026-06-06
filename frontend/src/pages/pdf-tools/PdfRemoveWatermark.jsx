import { useState, useRef } from 'react';
import { Eraser, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2, Info, MousePointer } from 'lucide-react';
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

export default function PdfRemoveWatermark() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  // Covers: {id, pageIndex, x, y, w, h, color}
  const [covers, setCovers] = useState([]);
  const [coverColor, setCoverColor] = useState('#ffffff');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('clean.pdf');
  const [progress, setProgress] = useState(0);
  const pageRef = useRef();
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f); setStatus('loading'); setPages([]); setCovers([]); setOutputUrl(null);
    try {
      await loadScript('pdfjs-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js');
      const pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      const ab = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      const rendered = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        rendered.push({ dataUrl: canvas.toDataURL('image/png'), width: vp.width, height: vp.height });
      }
      setPages(rendered); setStatus('editing');
    } catch (err) {
      console.error(err); setFile(null); setStatus('idle');
      alert('Error loading PDF: ' + err.message);
    }
  };

  const getRelPos = (e) => {
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onMouseDown = (e) => {
    if (status !== 'editing') return;
    e.preventDefault();
    const pos = getRelPos(e);
    setIsDrawing(true);
    setDrawStart(pos);
    setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const onMouseMove = (e) => {
    if (!isDrawing || !drawStart) return;
    const pos = getRelPos(e);
    setCurrentRect({
      x: Math.min(pos.x, drawStart.x),
      y: Math.min(pos.y, drawStart.y),
      w: Math.abs(pos.x - drawStart.x),
      h: Math.abs(pos.y - drawStart.y),
    });
  };

  const onMouseUp = () => {
    if (!isDrawing || !currentRect) return;
    setIsDrawing(false);
    if (currentRect.w > 5 && currentRect.h > 5) {
      setCovers(prev => [...prev, {
        id: Date.now(), pageIndex: currentPage,
        x: currentRect.x, y: currentRect.y,
        w: currentRect.w, h: currentRect.h,
        color: coverColor
      }]);
    }
    setCurrentRect(null);
    setDrawStart(null);
  };

  const removeCover = (id) => setCovers(prev => prev.filter(c => c.id !== id));
  const applyToAllPages = () => {
    const pageCovers = covers.filter(c => c.pageIndex === currentPage);
    const newCovers = [];
    for (let i = 0; i < pages.length; i++) {
      if (i === currentPage) continue;
      pageCovers.forEach(c => {
        newCovers.push({ ...c, id: Date.now() + Math.random(), pageIndex: i });
      });
    }
    setCovers(prev => [...prev, ...newCovers]);
  };

  const currentPageData = pages[currentPage];
  const currentCovers = covers.filter(c => c.pageIndex === currentPage);

  const process = async () => {
    if (!file) return;
    setStatus('processing'); setProgress(20);
    try {
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument, rgb } = window.PDFLib;
      const ab = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab);
      const pdfPages = pdfDoc.getPages();
      setProgress(50);

      const hexToRgb = (hex) => {
        const h = hex.replace('#', '');
        return rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
      };

      for (const cover of covers) {
        const pg = pdfPages[cover.pageIndex];
        if (!pg) continue;
        const { height, width } = pg.getSize();
        const pageEl = pages[cover.pageIndex];
        const sx = width / pageEl.width;
        const sy = height / pageEl.height;
        pg.drawRectangle({
          x: cover.x * sx,
          y: height - (cover.y + cover.h) * sy,
          width: cover.w * sx,
          height: cover.h * sy,
          color: hexToRgb(cover.color),
          opacity: 1,
        });
      }

      setProgress(85);
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setOutputUrl(URL.createObjectURL(blob));
      setOutputName(file.name.replace(/\.pdf$/i, '') + '_clean.pdf');
      setProgress(100); setStatus('done');
    } catch (err) {
      console.error(err); setStatus('editing');
      alert('Error saving: ' + err.message);
    }
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-editing">PDF Editing</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Remove Watermark</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fff7ed' }}>
            <Eraser size={36} color="#f97316" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Remove Watermark</div>
            <div className="tool-header-desc">
              Cover watermarks by drawing colored rectangles over them — the most reliable browser-based approach. Works for any visible watermark.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">🖱️ Click & Drag to Cover</span>
              <span className="info-chip">✓ All Pages</span>
              <span className="info-chip">✓ Privacy Safe</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        <div>
          {status === 'idle' && (
            <div
              className={`upload-zone${drag ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div className="upload-zone-icon"><Upload size={32} color="#f97316" /></div>
              <div className="upload-zone-title">Drop PDF file here</div>
              <div className="upload-zone-sub">Then drag to cover watermarks on any page</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                <Upload size={14} /> Select PDF
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>
              <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 12px' }} />
              <div>Loading PDF…</div>
            </div>
          )}

          {(status === 'editing' || status === 'processing') && currentPageData && (
            <div>
              <div className="file-list" style={{ marginBottom: 16 }}>
                <div className="file-item">
                  <div className="file-item-icon" style={{ background: '#fff7ed' }}><FileIcon size={18} color="#f97316" /></div>
                  <span className="file-item-name">{file.name}</span>
                  <span className="file-item-size">{formatBytes(file.size)}</span>
                  <button className="file-item-remove" onClick={() => { setFile(null); setPages([]); setCovers([]); setStatus('idle'); }}><X size={14} /></button>
                </div>
              </div>

              {pages.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                    style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Page {currentPage + 1} / {pages.length}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} disabled={currentPage === pages.length - 1}
                    style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: currentPage === pages.length - 1 ? 'not-allowed' : 'pointer' }}>Next →</button>
                </div>
              )}

              <div
                ref={pageRef}
                style={{ position: 'relative', display: 'inline-block', cursor: 'crosshair', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', userSelect: 'none' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              >
                <img src={currentPageData.dataUrl} alt="PDF" style={{ display: 'block', maxWidth: '100%', pointerEvents: 'none' }} />

                {/* Existing covers */}
                {currentCovers.map(c => (
                  <div key={c.id}
                    style={{ position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, background: c.color, zIndex: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Click to remove"
                    onClick={(e) => { e.stopPropagation(); removeCover(c.id); }}>
                    <X size={10} style={{ opacity: 0.3, color: c.color === '#ffffff' ? '#999' : '#fff' }} />
                  </div>
                ))}

                {/* Currently drawing */}
                {currentRect && currentRect.w > 0 && (
                  <div style={{
                    position: 'absolute', left: currentRect.x, top: currentRect.y,
                    width: currentRect.w, height: currentRect.h,
                    background: coverColor, opacity: 0.8,
                    border: '2px dashed #374151', zIndex: 10, pointerEvents: 'none'
                  }} />
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                🖱️ Click and drag to draw a cover rectangle over the watermark. Click a cover to remove it.
              </p>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Saving PDF…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#f97316' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">Watermarks Covered!</div>
              <div className="result-box-sub">{covers.length} cover(s) applied across all pages</div>
              <button className="download-btn" onClick={() => { const a = document.createElement('a'); a.href = outputUrl; a.download = outputName; a.click(); }}
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                <Download size={16} /> Download Clean PDF
              </button>
            </div>
          )}

          {/* Info box */}
          <div style={{ marginTop: 24, padding: 16, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, fontSize: 13, color: '#9a3412', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>How it works:</strong> True automated watermark removal requires server-side AI (computer vision). This tool lets you manually cover watermarks by drawing rectangles over them — a reliable approach that works for any visible watermark. Match the cover color to your PDF's background (usually white).
            </div>
          </div>
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🖌️ Cover Options</div>
            <div className="sidebar-card-body">
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                Draw rectangles over watermarks to cover them. Match the cover color to your page background.
              </p>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Cover Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {['#ffffff', '#f3f4f6', '#fef9c3', '#dbeafe', '#dcfce7'].map(c => (
                    <button key={c} onClick={() => setCoverColor(c)} style={{
                      width: 32, height: 32, borderRadius: 6, background: c,
                      border: `3px solid ${coverColor === c ? '#374151' : '#d1d5db'}`,
                      cursor: 'pointer', transition: 'transform 0.15s',
                      transform: coverColor === c ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #e5e7eb' : 'none'
                    }} title={c} />
                  ))}
                  <input type="color" value={coverColor} onChange={e => setCoverColor(e.target.value)}
                    style={{ width: 32, height: 32, border: '1px solid #d1d5db', borderRadius: 6, padding: 2, cursor: 'pointer' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Selected: <code>{coverColor}</code></div>
              </div>

              {/* Cover preview */}
              <div style={{ marginBottom: 14, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Cover Preview</div>
                <div style={{ fontSize: 12, lineHeight: 2, position: 'relative', color: '#6b7280' }}>
                  <span style={{ display: 'inline-block', background: coverColor, border: '1px solid #e2e8f0', padding: '2px 12px', borderRadius: 3 }}>WATERMARK</span>
                  <span style={{ marginLeft: 4 }}>← covered</span>
                </div>
              </div>

              {covers.length > 0 && status === 'editing' && (
                <>
                  {pages.length > 1 && (
                    <button onClick={applyToAllPages}
                      style={{ width: '100%', padding: '8px', border: '1px solid #f97316', borderRadius: 6, background: '#fff7ed', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#ea580c', marginBottom: 8 }}>
                      <MousePointer size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Apply covers to all pages
                    </button>
                  )}
                  <div style={{ background: '#fff7ed', borderRadius: 8, padding: '8px 10px', marginBottom: 8, fontSize: 12, color: '#9a3412' }}>
                    <strong>{covers.length}</strong> cover(s) across all pages
                    <button onClick={() => setCovers([])} style={{ marginLeft: 8, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 11 }}>Clear all</button>
                  </div>
                  <button className="tool-action-btn" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', marginTop: 0 }} onClick={process}>
                    <Download size={18} /> Save Clean PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
