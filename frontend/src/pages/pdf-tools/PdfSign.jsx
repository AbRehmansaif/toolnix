import { useState, useRef, useEffect } from 'react';
import { PenTool, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2, Type, Trash2 } from 'lucide-react';
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

export default function PdfSign() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [signMode, setSignMode] = useState('draw'); // 'draw' | 'type'
  const [typedSig, setTypedSig] = useState('');
  const [sigFont, setSigFont] = useState('Dancing Script');
  const [sigColor, setSigColor] = useState('#1e3a5f');
  const [sigStrokeWidth, setSigStrokeWidth] = useState(3);
  const [placements, setPlacements] = useState([]); // {id, pageIndex, x, y, imgData, width, height}
  const [capturedSig, setCapturedSig] = useState(null);
  const [showSignPad, setShowSignPad] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('signed.pdf');
  const [progress, setProgress] = useState(0);
  const drawCanvasRef = useRef();
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f); setStatus('loading_pdf'); setPages([]); setPlacements([]); setOutputUrl(null); setCapturedSig(null);
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

  // Draw pad logic
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e, drawCanvasRef.current);
    lastPos.current = pos;
    const ctx = drawCanvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  };
  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const pos = getPos(e, drawCanvasRef.current);
    const ctx = drawCanvasRef.current.getContext('2d');
    ctx.lineWidth = sigStrokeWidth; ctx.lineCap = 'round'; ctx.strokeStyle = sigColor;
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
  };
  const endDraw = () => { isDrawing.current = false; };
  const clearPad = () => {
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
  };

  const captureSignature = () => {
    if (signMode === 'draw') {
      const cv = drawCanvasRef.current;
      setCapturedSig({ imgData: cv.toDataURL('image/png'), width: 200, height: 70 });
    } else {
      // Render typed sig to canvas
      const cv = document.createElement('canvas');
      cv.width = 300; cv.height = 90;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.font = `60px "${sigFont}"`;
      ctx.fillStyle = sigColor;
      ctx.textBaseline = 'top';
      ctx.fillText(typedSig || 'Signature', 4, 10);
      setCapturedSig({ imgData: cv.toDataURL('image/png'), width: 200, height: 60 });
    }
    setShowSignPad(false);
  };

  const handlePageClick = (e) => {
    if (!capturedSig) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - capturedSig.width / 2;
    const y = e.clientY - rect.top - capturedSig.height / 2;
    const id = Date.now();
    setPlacements(prev => [...prev, { id, pageIndex: currentPage, x, y, ...capturedSig }]);
  };

  const currentPage_ = pages[currentPage];
  const currentPlacements = placements.filter(p => p.pageIndex === currentPage);

  const process = async () => {
    if (!file) return;
    setStatus('processing'); setProgress(20);
    try {
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument } = window.PDFLib;
      const ab = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab);
      const pdfPages = pdfDoc.getPages();
      setProgress(50);

      for (const pl of placements) {
        const pg = pdfPages[pl.pageIndex];
        if (!pg) continue;
        const { height, width } = pg.getSize();
        const pageEl = pages[pl.pageIndex];
        const scaleX = width / pageEl.width;
        const scaleY = height / pageEl.height;
        const b64 = pl.imgData.replace(/^data:image\/png;base64,/, '');
        const pngImage = await pdfDoc.embedPng(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
        pg.drawImage(pngImage, {
          x: pl.x * scaleX,
          y: height - (pl.y + pl.height) * scaleY,
          width: pl.width * scaleX,
          height: pl.height * scaleY,
        });
      }

      setProgress(85);
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setOutputUrl(URL.createObjectURL(blob));
      setOutputName(file.name.replace(/\.pdf$/i, '') + '_signed.pdf');
      setProgress(100); setStatus('done');
    } catch (err) {
      console.error(err); setStatus('editing');
      alert('Error saving: ' + err.message);
    }
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link><ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-editing">PDF Editing</Link><ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Sign PDF</span>
      </div>
      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#f0f9ff' }}>
            <PenTool size={36} color="#0ea5e9" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Sign PDF</div>
            <div className="tool-header-desc">Draw or type your signature and place it anywhere on your PDF pages — all in your browser, no upload needed.</div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Draw Signature</span>
              <span className="info-chip">✓ Type Signature</span>
              <span className="info-chip">✓ Multi-page</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google font for typed sig */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&family=Pacifico&family=Caveat:wght@500&display=swap" rel="stylesheet" />

      <div className="tool-main">
        <div>
          {status === 'idle' && (
            <div className={`upload-zone${drag ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current?.click()}>
              <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div className="upload-zone-icon"><Upload size={32} color="#0ea5e9" /></div>
              <div className="upload-zone-title">Drop your PDF here</div>
              <div className="upload-zone-sub">Then draw or type your signature</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}><Upload size={14} /> Select PDF</div>
            </div>
          )}

          {status === 'loading_pdf' && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>
              <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 12px' }} />
              <div>Rendering PDF pages…</div>
            </div>
          )}

          {(status === 'editing' || status === 'processing') && currentPage_ && (
            <div>
              <div className="file-list" style={{ marginBottom: 16 }}>
                <div className="file-item">
                  <div className="file-item-icon" style={{ background: '#f0f9ff' }}><FileIcon size={18} color="#0ea5e9" /></div>
                  <span className="file-item-name">{file.name}</span>
                  <span className="file-item-size">{formatBytes(file.size)}</span>
                  <button className="file-item-remove" onClick={() => { setFile(null); setPages([]); setPlacements([]); setStatus('idle'); setCapturedSig(null); }}><X size={14} /></button>
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

              {capturedSig && (
                <div style={{ marginBottom: 12, padding: '10px 14px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd', fontSize: 12, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={capturedSig.imgData} alt="sig preview" style={{ height: 36, background: '#fff', borderRadius: 4, border: '1px solid #e2e8f0' }} />
                  <span>Signature ready — click on the PDF to place it</span>
                  <button onClick={() => setCapturedSig(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#0369a1', fontSize: 18, lineHeight: 1 }}>✕</button>
                </div>
              )}

              {/* Page canvas */}
              <div style={{ position: 'relative', display: 'inline-block', cursor: capturedSig ? 'copy' : 'default', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}
                onClick={handlePageClick}>
                <img src={currentPage_.dataUrl} alt="PDF page" style={{ display: 'block', maxWidth: '100%' }} />
                {currentPlacements.map(pl => (
                  <div key={pl.id} style={{ position: 'absolute', left: pl.x, top: pl.y, zIndex: 10 }}>
                    <img src={pl.imgData} alt="sig" style={{ width: pl.width, height: pl.height, display: 'block' }} />
                    <button onClick={(e) => { e.stopPropagation(); setPlacements(prev => prev.filter(p => p.id !== pl.id)); }}
                      style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                {capturedSig ? '✅ Click anywhere on the page to place your signature' : '👈 Create your signature using the sidebar, then place it'}
              </p>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Signing PDF…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#0ea5e9' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">PDF Signed!</div>
              <div className="result-box-sub">{placements.length} signature(s) embedded across {pages.length} page(s)</div>
              <button className="download-btn" onClick={() => { const a = document.createElement('a'); a.href = outputUrl; a.download = outputName; a.click(); }} style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}><Download size={16} /> Download Signed PDF</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">✍️ Signature Creator</div>
            <div className="sidebar-card-body">
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {['draw', 'type'].map(m => (
                  <button key={m} onClick={() => setSignMode(m)} style={{ flex: 1, padding: '8px', border: `2px solid ${signMode === m ? '#0ea5e9' : '#e5e7eb'}`, borderRadius: 6, background: signMode === m ? '#f0f9ff' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: signMode === m ? '#0ea5e9' : '#374151', textTransform: 'capitalize' }}>{m === 'draw' ? '✏️ Draw' : '⌨️ Type'}</button>
                ))}
              </div>

              {signMode === 'draw' ? (
                <div>
                  <canvas ref={drawCanvasRef} width={260} height={100}
                    style={{ border: '1.5px solid #0ea5e9', borderRadius: 8, display: 'block', background: '#fff', cursor: 'crosshair', touchAction: 'none' }}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <select value={sigStrokeWidth} onChange={e => setSigStrokeWidth(Number(e.target.value))} className="sidebar-select" style={{ fontSize: 12 }}>
                      <option value={1}>Thin</option><option value={3}>Medium</option><option value={6}>Thick</option>
                    </select>
                    <input type="color" value={sigColor} onChange={e => setSigColor(e.target.value)} style={{ width: 36, height: 32, border: '1px solid #d1d5db', borderRadius: 4, padding: 2, cursor: 'pointer' }} />
                    <button onClick={clearPad} style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>Clear</button>
                  </div>
                </div>
              ) : (
                <div>
                  <input type="text" placeholder="Your Name" value={typedSig} onChange={e => setTypedSig(e.target.value)}
                    className="tool-input" style={{ marginBottom: 8, fontSize: 14 }} />
                  <select value={sigFont} onChange={e => setSigFont(e.target.value)} className="sidebar-select" style={{ width: '100%', marginBottom: 6, fontSize: 13 }}>
                    <option value="Dancing Script">Dancing Script</option>
                    <option value="Pacifico">Pacifico</option>
                    <option value="Caveat">Caveat</option>
                  </select>
                  <div style={{ padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center', fontFamily: sigFont, fontSize: 28, color: sigColor, minHeight: 56 }}>{typedSig || 'Your Signature'}</div>
                  <input type="color" value={sigColor} onChange={e => setSigColor(e.target.value)} style={{ marginTop: 6, width: '100%', height: 32, border: '1px solid #d1d5db', borderRadius: 4, padding: 2, cursor: 'pointer' }} />
                </div>
              )}

              <button onClick={captureSignature} style={{ width: '100%', marginTop: 12, padding: '10px', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                ✓ Use This Signature
              </button>

              {status === 'editing' && placements.length > 0 && (
                <button className="tool-action-btn" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', marginTop: 8 }} onClick={process}>
                  <Download size={18} /> Save Signed PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
