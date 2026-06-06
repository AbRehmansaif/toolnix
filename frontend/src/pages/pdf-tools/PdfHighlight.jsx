import { useState, useRef } from 'react';
import { Highlighter, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2 } from 'lucide-react';
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

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fef08a', pdfColor: [254, 240, 138] },
  { label: 'Green',  value: '#86efac', pdfColor: [134, 239, 172] },
  { label: 'Cyan',   value: '#67e8f9', pdfColor: [103, 232, 249] },
  { label: 'Pink',   value: '#f9a8d4', pdfColor: [249, 168, 212] },
  { label: 'Orange', value: '#fdba74', pdfColor: [253, 186, 116] },
];

export default function PdfHighlight() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [highlights, setHighlights] = useState([]); // {id, pageIndex, x, y, w, h, color, pdfColor}
  const [hlColor, setHlColor] = useState(HIGHLIGHT_COLORS[0]);
  const [hlWidth, setHlWidth] = useState(120);
  const [hlHeight, setHlHeight] = useState(20);
  const [opacity, setOpacity] = useState(0.45);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('highlighted.pdf');
  const [progress, setProgress] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const pageRef = useRef();
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f); setStatus('loading'); setPages([]); setHighlights([]); setOutputUrl(null);
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

  const onMouseUp = (e) => {
    if (!isDrawing || !currentRect) return;
    setIsDrawing(false);
    if (currentRect.w > 5 && currentRect.h > 5) {
      setHighlights(prev => [...prev, {
        id: Date.now(), pageIndex: currentPage,
        x: currentRect.x, y: currentRect.y,
        w: currentRect.w, h: currentRect.h,
        color: hlColor.value, pdfColor: hlColor.pdfColor, opacity
      }]);
    }
    setCurrentRect(null);
    setDrawStart(null);
  };

  const currentPage_ = pages[currentPage];
  const currentHighlights = highlights.filter(h => h.pageIndex === currentPage);

  const process = async () => {
    if (!file || highlights.length === 0) return;
    setStatus('processing'); setProgress(20);
    try {
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument, rgb } = window.PDFLib;
      const ab = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab);
      const pdfPages = pdfDoc.getPages();
      setProgress(50);

      for (const hl of highlights) {
        const pg = pdfPages[hl.pageIndex];
        if (!pg) continue;
        const { height, width } = pg.getSize();
        const pageEl = pages[hl.pageIndex];
        const sx = width / pageEl.width;
        const sy = height / pageEl.height;
        pg.drawRectangle({
          x: hl.x * sx,
          y: height - (hl.y + hl.h) * sy,
          width: hl.w * sx,
          height: hl.h * sy,
          color: rgb(hl.pdfColor[0] / 255, hl.pdfColor[1] / 255, hl.pdfColor[2] / 255),
          opacity: hl.opacity,
        });
      }

      setProgress(85);
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setOutputUrl(URL.createObjectURL(blob));
      setOutputName(file.name.replace(/\.pdf$/i, '') + '_highlighted.pdf');
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
        <span className="tool-breadcrumb-current">Highlight PDF</span>
      </div>
      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fefce8' }}>
            <Highlighter size={36} color="#eab308" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Highlight PDF</div>
            <div className="tool-header-desc">Click and drag to draw highlight rectangles over any area of your PDF. Choose from 5 highlight colors with adjustable opacity.</div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">🖱️ Click & Drag</span>
              <span className="info-chip">🌈 5 Colors</span>
              <span className="info-chip">✓ Adjustable Opacity</span>
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
              onClick={() => inputRef.current?.click()}>
              <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div className="upload-zone-icon"><Upload size={32} color="#eab308" /></div>
              <div className="upload-zone-title">Drop your PDF here</div>
              <div className="upload-zone-sub">Drag to draw highlight boxes anywhere on the page</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#eab308,#ca8a04)' }}><Upload size={14} /> Select PDF</div>
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
                  <div className="file-item-icon" style={{ background: '#fefce8' }}><FileIcon size={18} color="#eab308" /></div>
                  <span className="file-item-name">{file.name}</span>
                  <span className="file-item-size">{formatBytes(file.size)}</span>
                  <button className="file-item-remove" onClick={() => { setFile(null); setPages([]); setHighlights([]); setStatus('idle'); }}><X size={14} /></button>
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
                <img src={currentPage_.dataUrl} alt="PDF" style={{ display: 'block', maxWidth: '100%', pointerEvents: 'none' }} />

                {/* Existing highlights on this page */}
                {currentHighlights.map(hl => (
                  <div key={hl.id} style={{
                    position: 'absolute', left: hl.x, top: hl.y, width: hl.w, height: hl.h,
                    background: hl.color, opacity: hl.opacity, zIndex: 5, pointerEvents: 'auto', cursor: 'pointer'
                  }} title="Click to remove" onClick={(e) => { e.stopPropagation(); setHighlights(prev => prev.filter(h => h.id !== hl.id)); }} />
                ))}

                {/* Currently being drawn */}
                {currentRect && currentRect.w > 0 && (
                  <div style={{
                    position: 'absolute', left: currentRect.x, top: currentRect.y,
                    width: currentRect.w, height: currentRect.h,
                    background: hlColor.value, opacity: opacity,
                    border: `2px dashed ${hlColor.value}`,
                    zIndex: 10, pointerEvents: 'none'
                  }} />
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                🖱️ Click and drag to draw a highlight. Click an existing highlight to remove it.
              </p>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Embedding highlights…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#eab308' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">Highlights Applied!</div>
              <div className="result-box-sub">{highlights.length} highlight(s) embedded across {pages.length} page(s)</div>
              <button className="download-btn" onClick={() => { const a = document.createElement('a'); a.href = outputUrl; a.download = outputName; a.click(); }}
                style={{ background: 'linear-gradient(135deg,#eab308,#ca8a04)' }}><Download size={16} /> Download Highlighted PDF</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🖌️ Highlight Options</div>
            <div className="sidebar-card-body">
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Color</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {HIGHLIGHT_COLORS.map(c => (
                    <button key={c.value} onClick={() => setHlColor(c)} title={c.label} style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: c.value, border: `3px solid ${hlColor.value === c.value ? '#1a1a1a' : 'transparent'}`,
                      cursor: 'pointer', transition: 'transform 0.15s ease',
                      transform: hlColor.value === c.value ? 'scale(1.15)' : 'scale(1)',
                    }} />
                  ))}
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>Selected: {hlColor.label}</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Opacity: {Math.round(opacity * 100)}%
                </label>
                <input type="range" min={0.1} max={0.9} step={0.05} value={opacity} onChange={e => setOpacity(Number(e.target.value))}
                  style={{ width: '100%', accentColor: hlColor.value }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)' }}>
                  <span>10%</span><span>90%</span>
                </div>
              </div>

              {/* Preview */}
              <div style={{ marginBottom: 14, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Preview</div>
                <div style={{ fontSize: 13, lineHeight: 1.8, position: 'relative', color: '#1a1a1a' }}>
                  This is <span style={{ background: hlColor.value, opacity: 1, padding: '1px 4px', borderRadius: 2 }}>highlighted text</span> in your document
                </div>
              </div>

              {highlights.length > 0 && (
                <div style={{ background: '#fefce8', borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 12, color: '#854d0e' }}>
                  <strong>{highlights.length}</strong> highlight(s) across all pages
                  <button onClick={() => setHighlights([])} style={{ marginLeft: 8, fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear all</button>
                </div>
              )}

              <button className="tool-action-btn" style={{ background: 'linear-gradient(135deg,#eab308,#ca8a04)', marginTop: 4 }}
                disabled={status !== 'editing' || highlights.length === 0} onClick={process}>
                <Download size={18} /> Save Highlighted PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
