import { useState, useRef, useEffect } from 'react';
import { PenLine, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2, Type, Image as ImageIcon, Pencil, Trash2, Undo, Move } from 'lucide-react';
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

export default function PdfEdit() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState([]); // {dataUrl, width, height}
  const [currentPage, setCurrentPage] = useState(0);
  
  // Elements state
  const [textBoxes, setTextBoxes] = useState([]); // {id, pageIndex, x, y, text, fontSize, color}
  const [images, setImages] = useState([]); // {id, pageIndex, x, y, dataUrl, width, height}
  const [strokes, setStrokes] = useState([]); // {id, pageIndex, color, size, points:[{x,y}]}
  
  const [selectedTool, setSelectedTool] = useState('text'); // 'text', 'image', 'draw', 'select'
  
  // Tool settings
  const [textColor, setTextColor] = useState('#1a1a1a');
  const [fontSize, setFontSize] = useState(16);
  const [drawColor, setDrawColor] = useState('#e11d48');
  const [drawSize, setDrawSize] = useState(3);
  
  // Interaction state
  const isDrawing = useRef(false);
  const [currentStroke, setCurrentStroke] = useState(null);
  
  const [draggingEl, setDraggingEl] = useState(null); // { type: 'text'|'image', id, offsetX, offsetY }
  const [resizingImg, setResizingImg] = useState(null); // { id, startX, startY, startW, startH, dir }

  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('edited.pdf');
  
  const canvasRef = useRef();
  const inputRef = useRef();
  const imageInputRef = useRef();

  const handleFile = async (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f); setStatus('loading_pdf'); setPages([]); setTextBoxes([]); setImages([]); setStrokes([]); setOutputUrl(null);
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

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleCanvasMouseDown = (e) => {
    if (status !== 'editing') return;
    if (draggingEl || resizingImg) return;

    const pos = getPos(e);
    
    if (selectedTool === 'text') {
      const id = Date.now();
      setTextBoxes(prev => [...prev, { id, pageIndex: currentPage, x: pos.x, y: pos.y, text: '', fontSize, color: textColor }]);
      setSelectedTool('select');
    } else if (selectedTool === 'draw') {
      isDrawing.current = true;
      setCurrentStroke({ id: Date.now(), pageIndex: currentPage, color: drawColor, size: drawSize, points: [pos] });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (status !== 'editing') return;
    
    const pos = getPos(e);

    if (draggingEl) {
      e.preventDefault();
      const newX = pos.x - draggingEl.offsetX;
      const newY = pos.y - draggingEl.offsetY;
      
      if (draggingEl.type === 'text') {
        setTextBoxes(prev => prev.map(b => b.id === draggingEl.id ? { ...b, x: newX, y: newY } : b));
      } else if (draggingEl.type === 'image') {
        setImages(prev => prev.map(i => i.id === draggingEl.id ? { ...i, x: newX, y: newY } : i));
      }
      return;
    }

    if (resizingImg) {
      e.preventDefault();
      const dx = pos.x - resizingImg.startX;
      const dy = pos.y - resizingImg.startY;
      let newW = resizingImg.startW;
      let newH = resizingImg.startH;
      
      if (resizingImg.dir === 'se') {
        newW = Math.max(20, resizingImg.startW + dx);
        newH = Math.max(20, resizingImg.startH + dy);
      }
      
      setImages(prev => prev.map(i => i.id === resizingImg.id ? { ...i, width: newW, height: newH } : i));
      return;
    }

    if (selectedTool === 'draw' && isDrawing.current && currentStroke) {
      setCurrentStroke(prev => ({ ...prev, points: [...prev.points, pos] }));
    }
  };

  const handleCanvasMouseUp = () => {
    if (draggingEl) setDraggingEl(null);
    if (resizingImg) setResizingImg(null);
    
    if (selectedTool === 'draw' && isDrawing.current) {
      isDrawing.current = false;
      if (currentStroke && currentStroke.points.length > 1) {
        setStrokes(prev => [...prev, currentStroke]);
      }
      setCurrentStroke(null);
    }
  };

  const startDrag = (e, type, id, elX, elY) => {
    if (selectedTool === 'draw') return;
    e.stopPropagation();
    const pos = getPos(e);
    setDraggingEl({ type, id, offsetX: pos.x - elX, offsetY: pos.y - elY });
  };

  const startResize = (e, id, startW, startH, dir) => {
    e.stopPropagation();
    const pos = getPos(e);
    setResizingImg({ id, startX: pos.x, startY: pos.y, startW, startH, dir });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > 200) {
          h = h * (200 / w);
          w = 200;
        }
        setImages(prev => [...prev, {
          id: Date.now(), pageIndex: currentPage, x: 50, y: 50, dataUrl: event.target.result, width: w, height: h
        }]);
        setSelectedTool('select');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const removeBox = (id) => setTextBoxes(prev => prev.filter(b => b.id !== id));
  const updateBox = (id, field, val) => setTextBoxes(prev => prev.map(b => b.id === id ? { ...b, [field]: val } : b));
  const removeImage = (id) => setImages(prev => prev.filter(i => i.id !== id));
  
  const undoStroke = () => {
    setStrokes(prev => {
        const pageStrokes = prev.filter(s => s.pageIndex === currentPage);
        if (pageStrokes.length === 0) return prev;
        const lastStrokeId = pageStrokes[pageStrokes.length - 1].id;
        return prev.filter(s => s.id !== lastStrokeId);
    });
  };
  
  const clearStrokes = () => {
    setStrokes(prev => prev.filter(s => s.pageIndex !== currentPage));
  };

  const currentPage_ = pages[currentPage];
  const currentBoxes = textBoxes.filter(b => b.pageIndex === currentPage);
  const currentImages = images.filter(i => i.pageIndex === currentPage);
  const currentStrokes = strokes.filter(s => s.pageIndex === currentPage);

  const process = async () => {
    if (!file) return;
    setStatus('processing'); setProgress(20);
    try {
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
      const ab = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pdfPages = pdfDoc.getPages();
      setProgress(50);

      const parseHex = (hex) => {
        const h = hex.replace('#', '');
        return rgb(parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255);
      };

      for (const box of textBoxes) {
        if (!box.text.trim()) continue;
        const pg = pdfPages[box.pageIndex];
        if (!pg) continue;
        const { height } = pg.getSize();
        const pageEl = pages[box.pageIndex];
        const scaleX = pg.getSize().width / pageEl.width;
        const scaleY = height / pageEl.height;
        pg.drawText(box.text, {
          x: box.x * scaleX,
          y: height - box.y * scaleY - box.fontSize,
          size: box.fontSize,
          font,
          color: parseHex(box.color),
        });
      }

      for (const imgData of images) {
        const pg = pdfPages[imgData.pageIndex];
        if (!pg) continue;
        const { height } = pg.getSize();
        const pageEl = pages[imgData.pageIndex];
        const scaleX = pg.getSize().width / pageEl.width;
        const scaleY = height / pageEl.height;
        
        let embeddedImage;
        if (imgData.dataUrl.includes('image/jpeg') || imgData.dataUrl.includes('image/jpg')) {
            embeddedImage = await pdfDoc.embedJpg(imgData.dataUrl);
        } else {
            embeddedImage = await pdfDoc.embedPng(imgData.dataUrl);
        }

        pg.drawImage(embeddedImage, {
          x: imgData.x * scaleX,
          y: height - (imgData.y + imgData.height) * scaleY,
          width: imgData.width * scaleX,
          height: imgData.height * scaleY,
        });
      }

      for (const stroke of strokes) {
        const pg = pdfPages[stroke.pageIndex];
        if (!pg) continue;
        const { height } = pg.getSize();
        const pageEl = pages[stroke.pageIndex];
        const scaleX = pg.getSize().width / pageEl.width;
        const scaleY = height / pageEl.height;

        if (stroke.points.length < 2) continue;
        for (let i = 0; i < stroke.points.length - 1; i++) {
          const p1 = stroke.points[i];
          const p2 = stroke.points[i + 1];
          pg.drawLine({
            start: { x: p1.x * scaleX, y: height - p1.y * scaleY },
            end:   { x: p2.x * scaleX, y: height - p2.y * scaleY },
            thickness: stroke.size,
            color: parseHex(stroke.color),
            lineCap: 'Round',
          });
        }
      }

      setProgress(85);
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setOutputUrl(URL.createObjectURL(blob));
      setOutputName(file.name.replace(/\.pdf$/i, '') + '_edited.pdf');
      setProgress(100); setStatus('done');
    } catch (err) {
      console.error(err); setStatus('editing');
      alert('Error saving PDF: ' + err.message);
    }
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link><ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-editing">PDF Editing</Link><ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Edit PDF</span>
      </div>
      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#eef2ff' }}>
            <PenLine size={36} color="#6366f1" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Edit PDF</div>
            <div className="tool-header-desc">A complete suite to edit your PDFs. Add text, insert images, and freehand draw directly on your document securely in your browser.</div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Add Text & Images</span>
              <span className="info-chip">✓ Freehand Draw</span>
              <span className="info-chip">✓ Client-Side</span>
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
              <div className="upload-zone-icon"><Upload size={32} color="#6366f1" /></div>
              <div className="upload-zone-title">Drop PDF file here</div>
              <div className="upload-zone-sub">Supports PDF — up to 100MB</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><Upload size={14} /> Select PDF</div>
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
                  <div className="file-item-icon" style={{ background: '#eef2ff' }}><FileIcon size={18} color="#6366f1" /></div>
                  <span className="file-item-name">{file.name}</span>
                  <span className="file-item-size">{formatBytes(file.size)}</span>
                  <button className="file-item-remove" onClick={() => { setFile(null); setPages([]); setTextBoxes([]); setImages([]); setStrokes([]); setStatus('idle'); }}><X size={14} /></button>
                </div>
              </div>

              {pages.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                    style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Page {currentPage + 1} of {pages.length}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} disabled={currentPage === pages.length - 1}
                    style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: currentPage === pages.length - 1 ? 'not-allowed' : 'pointer' }}>Next →</button>
                </div>
              )}

              <div 
                ref={canvasRef}
                style={{ position: 'relative', display: 'inline-block', cursor: selectedTool === 'text' ? 'text' : selectedTool === 'draw' ? 'crosshair' : 'default', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onTouchStart={handleCanvasMouseDown}
                onTouchMove={handleCanvasMouseMove}
                onTouchEnd={handleCanvasMouseUp}
              >
                <img src={currentPage_.dataUrl} alt="PDF page" style={{ display: 'block', maxWidth: '100%', pointerEvents: 'none' }} draggable="false" />
                
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  {currentStrokes.map(stroke => (
                    <polyline key={stroke.id}
                      points={stroke.points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none" stroke={stroke.color} strokeWidth={stroke.size} strokeLinecap="round" strokeLinejoin="round" />
                  ))}
                  {currentStroke && currentStroke.pageIndex === currentPage && (
                    <polyline
                      points={currentStroke.points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none" stroke={currentStroke.color} strokeWidth={currentStroke.size} strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>

                {currentImages.map(img => (
                  <div key={img.id} 
                    style={{ 
                      position: 'absolute', left: img.x, top: img.y, zIndex: 5, 
                      border: '2px dashed #6366f1', background: 'rgba(255,255,255,0.1)'
                    }}
                  >
                    <div
                        onMouseDown={(e) => startDrag(e, 'image', img.id, img.x, img.y)}
                        onTouchStart={(e) => startDrag(e, 'image', img.id, img.x, img.y)}
                        style={{ position: 'absolute', top: -14, left: -14, background: '#6366f1', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'move', zIndex: 10 }}
                        title="Drag Image"
                    >
                        <Move size={12} />
                    </div>
                    <img src={img.dataUrl} alt="placed" style={{ width: img.width, height: img.height, display: 'block', pointerEvents: 'none' }} draggable="false" />
                    <button onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                      style={{ position: 'absolute', top: -14, right: -14, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>✕</button>
                    
                    <div 
                      onMouseDown={(e) => startResize(e, img.id, img.width, img.height, 'se')}
                      onTouchStart={(e) => startResize(e, img.id, img.width, img.height, 'se')}
                      style={{ position: 'absolute', right: -6, bottom: -6, width: 12, height: 12, background: '#6366f1', borderRadius: '50%', cursor: 'nwse-resize', zIndex: 10 }} 
                    />
                  </div>
                ))}

                {currentBoxes.map(box => (
                  <div key={box.id} 
                    style={{ position: 'absolute', left: box.x, top: box.y, zIndex: 10, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <div
                        onMouseDown={(e) => startDrag(e, 'text', box.id, box.x, box.y)}
                        onTouchStart={(e) => startDrag(e, 'text', box.id, box.x, box.y)}
                        style={{ background: '#6366f1', color: '#fff', borderRadius: 4, padding: 4, cursor: 'move', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Drag Text"
                    >
                        <Move size={14} />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <input
                        value={box.text}
                        onChange={e => updateBox(box.id, 'text', e.target.value)}
                        onMouseDown={e => e.stopPropagation()} 
                        onTouchStart={e => e.stopPropagation()}
                        placeholder="Type here..."
                        style={{ 
                            fontSize: box.fontSize, color: box.color, background: 'rgba(255,255,255,0.85)', 
                            border: '2px dashed #6366f1', borderRadius: 4, padding: '4px 8px', outline: 'none', 
                            minWidth: 80, cursor: 'text' 
                        }}
                        />
                        <button onClick={(e) => { e.stopPropagation(); removeBox(box.id); }}
                        style={{ position: 'absolute', top: -10, right: -10, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, width: 20, height: 20, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                {selectedTool === 'text' && '💡 Click anywhere to add a text box. Use the blue handle next to it to drag.'}
                {selectedTool === 'image' && '💡 Upload an image. Use the top-left blue handle to drag, and bottom-right to resize.'}
                {selectedTool === 'draw' && '💡 Click and drag to draw freehand on the page.'}
                {selectedTool === 'select' && '💡 You can use the blue handles to drag text and images around the page.'}
              </p>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Saving PDF…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#6366f1' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">PDF Edited!</div>
              <div className="result-box-sub">Your edits have been successfully applied.</div>
              <button className="download-btn" onClick={() => { const a = document.createElement('a'); a.href = outputUrl; a.download = outputName; a.click(); }} style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><Download size={16} /> Download Edited PDF</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Edit Options</div>
            <div className="sidebar-card-body">
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Active Tool</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setSelectedTool('select')} style={{ flex: 1, padding: '8px 4px', border: `2px solid ${selectedTool === 'select' ? '#6366f1' : '#e5e7eb'}`, borderRadius: 6, background: selectedTool === 'select' ? '#eef2ff' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: selectedTool === 'select' ? '#6366f1' : '#374151', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 16 }}>👆</span> Select
                  </button>
                  <button onClick={() => setSelectedTool('text')} style={{ flex: 1, padding: '8px 4px', border: `2px solid ${selectedTool === 'text' ? '#6366f1' : '#e5e7eb'}`, borderRadius: 6, background: selectedTool === 'text' ? '#eef2ff' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: selectedTool === 'text' ? '#6366f1' : '#374151', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Type size={16} /> Text
                  </button>
                  <button onClick={() => setSelectedTool('image')} style={{ flex: 1, padding: '8px 4px', border: `2px solid ${selectedTool === 'image' ? '#6366f1' : '#e5e7eb'}`, borderRadius: 6, background: selectedTool === 'image' ? '#eef2ff' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: selectedTool === 'image' ? '#6366f1' : '#374151', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <ImageIcon size={16} /> Image
                  </button>
                  <button onClick={() => setSelectedTool('draw')} style={{ flex: 1, padding: '8px 4px', border: `2px solid ${selectedTool === 'draw' ? '#6366f1' : '#e5e7eb'}`, borderRadius: 6, background: selectedTool === 'draw' ? '#eef2ff' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: selectedTool === 'draw' ? '#6366f1' : '#374151', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Pencil size={16} /> Draw
                  </button>
                </div>
              </div>

              {(selectedTool === 'text' || selectedTool === 'select') && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Font Size (Next Text)</label>
                    <input type="number" className="sidebar-select" style={{ padding: '8px 12px', width: '100%' }} min="8" max="72" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Text Color</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} style={{ width: 36, height: 36, border: '1px solid #d1d5db', borderRadius: 4, padding: 2, cursor: 'pointer' }} />
                      <input type="text" className="sidebar-select" style={{ padding: '8px 6px', fontSize: 12, flex: 1 }} value={textColor} onChange={e => setTextColor(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {selectedTool === 'image' && (
                <div style={{ marginBottom: 16, padding: '12px', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                  <input ref={imageInputRef} type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleImageUpload} />
                  <ImageIcon size={24} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>Upload an image to add it to the current page.</div>
                  <button onClick={() => imageInputRef.current?.click()} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Choose Image</button>
                </div>
              )}

              {selectedTool === 'draw' && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Stroke Size</label>
                    <input type="range" min="1" max="20" value={drawSize} onChange={e => setDrawSize(Number(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Stroke Color</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {['#e11d48', '#2563eb', '#16a34a', '#eab308', '#000000', '#ffffff'].map(c => (
                        <button key={c} onClick={() => setDrawColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: `2px solid ${drawColor === c ? '#6366f1' : '#e5e7eb'}`, cursor: 'pointer' }} />
                      ))}
                      <input type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)} style={{ width: 24, height: 24, padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden' }} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={undoStroke} disabled={currentStrokes.length === 0} style={{ flex: 1, padding: '6px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                        <Undo size={14} /> Undo
                    </button>
                    <button onClick={clearStrokes} disabled={currentStrokes.length === 0} style={{ flex: 1, padding: '6px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: 4, fontSize: 12, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={14} /> Clear All
                    </button>
                  </div>
                </>
              )}

              <div style={{ height: 1, background: '#e5e7eb', margin: '16px 0' }} />

              <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 11, color: '#475569' }}>
                <div><strong>{textBoxes.length}</strong> text box(es)</div>
                <div><strong>{images.length}</strong> image(s)</div>
                <div><strong>{strokes.length}</strong> drawing stroke(s)</div>
              </div>
              <button className="tool-action-btn" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
                disabled={status !== 'editing' || (textBoxes.length === 0 && images.length === 0 && strokes.length === 0)} onClick={process}>
                <Download size={18} /> Save & Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
