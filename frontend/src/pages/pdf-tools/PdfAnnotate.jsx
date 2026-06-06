import { useState, useRef } from 'react';
import { MessageSquarePlus, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2 } from 'lucide-react';
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

const ANNOTATION_TYPES = [
  { id: 'note', label: '📝 Sticky Note', color: '#fbbf24' },
  { id: 'arrow', label: '➡️ Arrow', color: '#8b5cf6' },
  { id: 'comment', label: '💬 Comment', color: '#3b82f6' },
];

export default function PdfAnnotate() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [annotations, setAnnotations] = useState([]); // {id, pageIndex, x, y, type, text, color}
  const [annotType, setAnnotType] = useState('note');
  const [annotText, setAnnotText] = useState('');
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('annotated.pdf');
  const [progress, setProgress] = useState(0);
  const [editing, setEditing] = useState(null); // annotation id being edited
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f); setStatus('loading'); setPages([]); setAnnotations([]); setOutputUrl(null);
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

  const handlePageClick = (e) => {
    if (status !== 'editing') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const typeConfig = ANNOTATION_TYPES.find(t => t.id === annotType);
    const id = Date.now();
    setAnnotations(prev => [...prev, {
      id, pageIndex: currentPage, x, y,
      type: annotType, text: annotText || (annotType === 'note' ? 'Note' : annotType === 'arrow' ? 'See here' : 'Comment'),
      color: typeConfig.color
    }]);
  };

  const removeAnnotation = (id) => setAnnotations(prev => prev.filter(a => a.id !== id));
  const updateAnnotText = (id, text) => setAnnotations(prev => prev.map(a => a.id === id ? { ...a, text } : a));

  const currentPage_ = pages[currentPage];
  const currentAnnotations = annotations.filter(a => a.pageIndex === currentPage);

  const AnnotationIcon = ({ type }) => {
    if (type === 'note') return <span style={{ fontSize: 22 }}>📝</span>;
    if (type === 'arrow') return <span style={{ fontSize: 22 }}>➡️</span>;
    return <span style={{ fontSize: 22 }}>💬</span>;
  };

  const process = async () => {
    if (!file || annotations.length === 0) return;
    setStatus('processing'); setProgress(20);
    try {
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
      const ab = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pdfPages = pdfDoc.getPages();
      setProgress(50);

      const parseHex = (hex) => {
        const h = hex.replace('#', '');
        return rgb(parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255);
      };

      for (const ann of annotations) {
        const pg = pdfPages[ann.pageIndex];
        if (!pg) continue;
        const { height, width } = pg.getSize();
        const pageEl = pages[ann.pageIndex];
        const sx = width / pageEl.width;
        const sy = height / pageEl.height;
        const px = ann.x * sx;
        const py = height - ann.y * sy;
        const col = parseHex(ann.color);

        if (ann.type === 'note') {
          // Draw sticky note box
          pg.drawRectangle({ x: px, y: py - 40, width: 120, height: 40, color: parseHex('#fef9c3'), borderColor: parseHex('#fbbf24'), borderWidth: 1.2 });
          pg.drawText(ann.text.slice(0, 20), { x: px + 4, y: py - 16, size: 9, font, color: parseHex('#78350f') });
          pg.drawRectangle({ x: px, y: py - 4, width: 120, height: 4, color: parseHex('#fbbf24') });
        } else if (ann.type === 'arrow') {
          pg.drawLine({ start: { x: px, y: py }, end: { x: px + 40, y: py }, thickness: 2, color: col });
          pg.drawText('▶', { x: px + 38, y: py - 5, size: 10, font, color: col });
          pg.drawText(ann.text.slice(0, 18), { x: px + 50, y: py - 5, size: 9, font, color: col });
        } else {
          // comment bubble background
          pg.drawRectangle({ x: px, y: py - 34, width: 140, height: 34, color: parseHex('#eff6ff'), borderColor: parseHex('#3b82f6'), borderWidth: 1 });
          pg.drawText('💬 ' + ann.text.slice(0, 16), { x: px + 4, y: py - 18, size: 9, font, color: parseHex('#1d4ed8') });
        }
      }

      setProgress(85);
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setOutputUrl(URL.createObjectURL(blob));
      setOutputName(file.name.replace(/\.pdf$/i, '') + '_annotated.pdf');
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
        <span className="tool-breadcrumb-current">Annotate PDF</span>
      </div>
      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#f5f3ff' }}>
            <MessageSquarePlus size={36} color="#8b5cf6" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Annotate PDF</div>
            <div className="tool-header-desc">Add sticky notes, arrows, and comment bubbles to your PDF pages. Customize content and place annotations with a single click.</div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">📝 Sticky Notes</span>
              <span className="info-chip">➡️ Arrows</span>
              <span className="info-chip">💬 Comments</span>
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
              <div className="upload-zone-icon"><Upload size={32} color="#8b5cf6" /></div>
              <div className="upload-zone-title">Drop your PDF here</div>
              <div className="upload-zone-sub">Click to add sticky notes, arrows, and comments</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}><Upload size={14} /> Select PDF</div>
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
                  <div className="file-item-icon" style={{ background: '#f5f3ff' }}><FileIcon size={18} color="#8b5cf6" /></div>
                  <span className="file-item-name">{file.name}</span>
                  <span className="file-item-size">{formatBytes(file.size)}</span>
                  <button className="file-item-remove" onClick={() => { setFile(null); setPages([]); setAnnotations([]); setStatus('idle'); }}><X size={14} /></button>
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

              <div style={{ position: 'relative', display: 'inline-block', cursor: 'crosshair', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}
                onClick={handlePageClick}>
                <img src={currentPage_.dataUrl} alt="PDF" style={{ display: 'block', maxWidth: '100%' }} />
                {currentAnnotations.map(ann => (
                  <div key={ann.id} style={{ position: 'absolute', left: ann.x, top: ann.y, zIndex: 10 }}>
                    <div style={{
                      background: ann.type === 'note' ? '#fef9c3' : ann.type === 'arrow' ? '#f5f3ff' : '#eff6ff',
                      border: `1.5px solid ${ann.color}`,
                      borderRadius: ann.type === 'comment' ? 10 : 4,
                      padding: '4px 8px',
                      fontSize: 11, maxWidth: 160, cursor: 'default',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <AnnotationIcon type={ann.type} />
                        <input
                          value={ann.text}
                          onChange={e => updateAnnotText(ann.id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: 11, border: 'none', background: 'transparent', outline: 'none', color: '#1a1a1a', width: '100%', minWidth: 60 }}
                        />
                        <button onClick={(e) => { e.stopPropagation(); removeAnnotation(ann.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>💡 Click anywhere on the page to drop the selected annotation type</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Embedding annotations…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#8b5cf6' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">Annotations Added!</div>
              <div className="result-box-sub">{annotations.length} annotation(s) embedded across {pages.length} page(s)</div>
              <button className="download-btn" onClick={() => { const a = document.createElement('a'); a.href = outputUrl; a.download = outputName; a.click(); }}
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}><Download size={16} /> Download Annotated PDF</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🗒️ Annotation Options</div>
            <div className="sidebar-card-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Annotation Type</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ANNOTATION_TYPES.map(t => (
                    <button key={t.id} onClick={() => setAnnotType(t.id)} style={{
                      padding: '9px 12px', border: `2px solid ${annotType === t.id ? t.color : '#e5e7eb'}`,
                      borderRadius: 8, background: annotType === t.id ? t.color + '22' : '#fff',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600, color: annotType === t.id ? '#1a1a1a' : '#374151',
                      textAlign: 'left', transition: 'all 0.15s ease'
                    }}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Default Text</label>
                <input type="text" className="tool-input" style={{ fontSize: 13 }} value={annotText}
                  onChange={e => setAnnotText(e.target.value)} placeholder="Enter annotation text…" />
              </div>

              {annotations.length > 0 && (
                <div style={{ background: '#f5f3ff', borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 12, color: '#6d28d9' }}>
                  <strong>{annotations.length}</strong> annotation(s) placed on document
                </div>
              )}

              <button className="tool-action-btn" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', marginTop: 4 }}
                disabled={status !== 'editing' || annotations.length === 0} onClick={process}>
                <Download size={18} /> Save Annotated PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
