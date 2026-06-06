import { useState, useRef, useEffect } from 'react';
import { Pencil, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2, Eraser, Trash2 } from 'lucide-react';
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

const PEN_COLORS = ['#e11d48','#2563eb','#16a34a','#7c3aed','#ea580c','#0f172a','#ffffff'];

export default function PdfDraw() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [strokes, setStrokes] = useState([]); // {id, pageIndex, color, size, points:[{x,y}]}
  const [currentStroke, setCurrentStroke] = useState(null);
  const [penColor, setPenColor] = useState('#e11d48');
  const [penSize, setPenSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('drawn.pdf');
  const [progress, setProgress] = useState(0);
  const overlayCanvasRef = useRef();
  const isDrawing = useRef(false);
  const pdfInputRef = useRef();

  const handleFile = async (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f); setStatus('loading'); setPages([]); setStrokes([]); setOutputUrl(null);
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
      alert('Error: ' + err.message);
    }
  };

  // Redraw overlay canvas whenever strokes/page changes
  useEffect(() => {
    if (!overlayCanvasRef.current || !pages[currentPage]) return;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pageStrokes = strokes.filter(s => s.pageIndex === currentPage);
    pageStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.color;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    });
    if (currentStroke && currentStroke.pageIndex === currentPage) {
      ctx.beginPath();
      ctx.lineWidth = currentStroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = currentStroke.color;
      if (currentStroke.points.length >= 2) {
        ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
        currentStroke.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      }
    }
  }, [strokes, currentStroke, currentPage, pages]);

  const getPos = (e) => {
    const canvas = overlayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const onMouseDown = (e) => {
    if (status !== 'editing') return;
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    if (isEraser) {
      // Remove strokes that pass near this point
      setStrokes(prev => prev.filter(s => {
        if (s.pageIndex !== currentPage) return true;
        return !s.points.some(pt => Math.hypot(pt.x - pos.x, pt.y - pos.y) < penSize * 5);
      }));
    } else {
      setCurrentStroke({ id: Date.now(), pageIndex: currentPage, color: penColor, size: penSize, points: [pos] });
    }
  };

  const onMouseMove = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const pos = getPos(e);
    if (isEraser) {
      setStrokes(prev => prev.filter(s => {
        if (s.pageIndex !== currentPage) return true;
        return !s.points.some(pt => Math.hypot(pt.x - pos.x, pt.y - pos.y) < penSize * 5);
      }));
    } else if (currentStroke) {
      setCurrentStroke(prev => ({ ...prev, points: [...prev.points, pos] }));
    }
  };

  const onMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (!isEraser && currentStroke && currentStroke.points.length > 1) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  const clearPage = () => setStrokes(prev => prev.filter(s => s.pageIndex !== currentPage));
  const undoLast = () => {
    const pageStrokes = strokes.filter(s => s.pageIndex === currentPage);
    if (pageStrokes.length === 0) return;
    const lastId = pageStrokes[pageStrokes.length - 1].id;
    setStrokes(prev => prev.filter(s => s.id !== lastId));
  };

  const currentPage_ = pages[currentPage];

  const process = async () => {
    if (!file || strokes.length === 0) return;
    setStatus('processing'); setProgress(20);
    try {
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument, rgb } = window.PDFLib;
      const ab = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab);
      const pdfPages = pdfDoc.getPages();
      setProgress(40);

      const parseHex = (hex) => {
        const h = hex.replace('#', '');
        return rgb(parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255);
      };

      for (let pi = 0; pi < pages.length; pi++) {
        const pageStrokes = strokes.filter(s => s.pageIndex === pi);
        if (pageStrokes.length === 0) continue;
        const pg = pdfPages[pi];
        const { height, width } = pg.getSize();
        const pageEl = pages[pi];
        const sx = width / pageEl.width;
        const sy = height / pageEl.height;

        for (const stroke of pageStrokes) {
          if (stroke.points.length < 2) continue;
          for (let i = 0; i < stroke.points.length - 1; i++) {
            const p1 = stroke.points[i];
            const p2 = stroke.points[i + 1];
            pg.drawLine({
              start: { x: p1.x * sx, y: height - p1.y * sy },
              end:   { x: p2.x * sx, y: height - p2.y * sy },
              thickness: stroke.size,
              color: parseHex(stroke.color),
              lineCap: 'Round',
            });
          }
        }
      }

      setProgress(85);
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setOutputUrl(URL.createObjectURL(blob));
      setOutputName(file.name.replace(/\.pdf$/i, '') + '_drawn.pdf');
      setProgress(100); setStatus('done');
    } catch (err) {
      console.error(err); setStatus('editing');
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link><ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-editing">PDF Editing</Link><ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Draw on PDF</span>
      </div>
      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fef2f2' }}>
            <Pencil size={36} color="#ef4444" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Draw on PDF</div>
            <div className="tool-header-desc">Freehand draw, sketch or write directly on any page of your PDF using our smooth pen tool. Choose colors, brush size, and erase mistakes.</div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✏️ Freehand Pen</span>
              <span className="info-chip">🧹 Eraser</span>
              <span className="info-chip">↩️ Undo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        <div>
          {status === 'idle' && (
            <div className={`upload-zone${drag ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => pdfInputRef.current?.click()}>
              <input ref={pdfInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div className="upload-zone-icon"><Upload size={32} color="#ef4444" /></div>
              <div className="upload-zone-title">Drop your PDF here</div>
              <div className="upload-zone-sub">Then draw freely on any page with our pen tool</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}><Upload size={14} /> Select PDF</div>
            </div>
          )}

          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>
              <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 12px' }} />
              <div>Loading PDF…</div>
            </div>
          )}

          {(status === 'editing' || status === 'processing') && currentPage_ && (
            <div>
              <div className="file-list" style={{ marginBottom: 16 }}>
                <div className="file-item">
                  <div className="file-item-icon" style={{ background: '#fef2f2' }}><FileIcon size={18} color="#ef4444" /></div>
                  <span className="file-item-name">{file.name}</span>
                  <span className="file-item-size">{formatBytes(file.size)}</span>
                  <button className="file-item-remove" onClick={() => { setFile(null); setPages([]); setStrokes([]); setStatus('idle'); }}><X size={14} /></button>
                </div>
              </div>

              {/* Page navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                {pages.length > 1 && (<>
                  <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                    style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Page {currentPage + 1} / {pages.length}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} disabled={currentPage === pages.length - 1}
                    style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: currentPage === pages.length - 1 ? 'not-allowed' : 'pointer' }}>Next →</button>
                  <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
                </>)}
                <button onClick={undoLast} style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12 }}>↩ Undo</button>
                <button onClick={clearPage} style={{ padding: '6px 10px', border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#dc2626' }}>
                  <Trash2 size={12} style={{ display: 'inline', marginRight: 4 }} />Clear page
                </button>
              </div>

              {/* Drawing canvas overlay */}
              <div style={{ position: 'relative', display: 'inline-block', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', lineHeight: 0 }}>
                <img src={currentPage_.dataUrl} alt="PDF" style={{ display: 'block', maxWidth: '100%' }} />
                <canvas
                  ref={overlayCanvasRef}
                  width={currentPage_.width}
                  height={currentPage_.height}
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    cursor: isEraser ? 'cell' : 'crosshair',
                    touchAction: 'none',
                  }}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                  onTouchStart={onMouseDown}
                  onTouchMove={onMouseMove}
                  onTouchEnd={onMouseUp}
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                {isEraser ? '🧹 Eraser mode — draw over strokes to erase them' : '✏️ Draw freely on the PDF page above'}
              </p>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Embedding drawing…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#ef4444' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">Drawing Saved!</div>
              <div className="result-box-sub">{strokes.length} stroke(s) embedded across {pages.length} page(s)</div>
              <button className="download-btn" onClick={() => { const a = document.createElement('a'); a.href = outputUrl; a.download = outputName; a.click(); }}
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}><Download size={16} /> Download PDF with Drawing</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🎨 Drawing Tools</div>
            <div className="sidebar-card-body">
              {/* Tool toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={() => setIsEraser(false)} style={{
                  flex: 1, padding: '9px', border: `2px solid ${!isEraser ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: 8, background: !isEraser ? '#fef2f2' : '#fff',
                  cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  color: !isEraser ? '#ef4444' : '#374151', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center'
                }}><Pencil size={14} /> Pen</button>
                <button onClick={() => setIsEraser(true)} style={{
                  flex: 1, padding: '9px', border: `2px solid ${isEraser ? '#6366f1' : '#e5e7eb'}`,
                  borderRadius: 8, background: isEraser ? '#eef2ff' : '#fff',
                  cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  color: isEraser ? '#6366f1' : '#374151', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center'
                }}><Eraser size={14} /> Eraser</button>
              </div>

              {/* Color palette */}
              {!isEraser && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Color</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PEN_COLORS.map(c => (
                      <button key={c} onClick={() => setPenColor(c)} style={{
                        width: 30, height: 30, borderRadius: 6,
                        background: c, border: `3px solid ${penColor === c ? '#1a1a1a' : (c === '#ffffff' ? '#d1d5db' : 'transparent')}`,
                        cursor: 'pointer', transition: 'transform 0.15s',
                        transform: penColor === c ? 'scale(1.2)' : 'scale(1)',
                        boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #d1d5db' : 'none',
                      }} />
                    ))}
                    <input type="color" value={penColor} onChange={e => setPenColor(e.target.value)}
                      title="Custom color"
                      style={{ width: 30, height: 30, border: '1px solid #d1d5db', borderRadius: 6, padding: 1, cursor: 'pointer' }} />
                  </div>
                </div>
              )}

              {/* Brush size */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  {isEraser ? 'Eraser' : 'Brush'} Size: {penSize}px
                </label>
                <input type="range" min={1} max={20} step={1} value={penSize} onChange={e => setPenSize(Number(e.target.value))}
                  style={{ width: '100%', accentColor: isEraser ? '#6366f1' : penColor }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)' }}>
                  <span>Fine (1px)</span><span>Thick (20px)</span>
                </div>
              </div>

              {/* Stroke preview */}
              {!isEraser && (
                <div style={{ marginBottom: 14, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Brush Preview</div>
                  <svg width="100%" height="24">
                    <line x1="8" y1="12" x2="90%" y2="12" stroke={penColor} strokeWidth={penSize} strokeLinecap="round" />
                  </svg>
                </div>
              )}

              {/* Stats */}
              <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 12, color: '#374151' }}>
                <strong>{strokes.filter(s => s.pageIndex === currentPage).length}</strong> stroke(s) on this page &nbsp;·&nbsp;
                <strong>{strokes.length}</strong> total
              </div>

              <button className="tool-action-btn" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', marginTop: 4 }}
                disabled={status !== 'editing' || strokes.length === 0} onClick={process}>
                <Download size={18} /> Save PDF with Drawing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
