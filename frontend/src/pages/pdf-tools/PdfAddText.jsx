import { useState, useRef } from 'react';
import { Type, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2 } from 'lucide-react';
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

export default function PdfAddText() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [textBoxes, setTextBoxes] = useState([]);
  const [textContent, setTextContent] = useState('Your Text Here');
  const [fontSize, setFontSize] = useState(18);
  const [textColor, setTextColor] = useState('#1a1a1a');
  const [fontStyle, setFontStyle] = useState('Helvetica');
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('output.pdf');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f); setStatus('loading'); setPages([]); setTextBoxes([]); setOutputUrl(null);
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

  const handleClick = (e) => {
    if (status !== 'editing') return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTextBoxes(prev => [...prev, {
      id: Date.now(), pageIndex: currentPage,
      x: e.clientX - rect.left, y: e.clientY - rect.top,
      text: textContent, fontSize, color: textColor, font: fontStyle
    }]);
  };

  const currentPage_ = pages[currentPage];
  const currentBoxes = textBoxes.filter(b => b.pageIndex === currentPage);

  const process = async () => {
    setStatus('processing'); setProgress(20);
    try {
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
      const ab = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab);
      setProgress(50);

      const fontMap = {
        'Helvetica': StandardFonts.Helvetica,
        'Helvetica Bold': StandardFonts.HelveticaBold,
        'Times Roman': StandardFonts.TimesRoman,
        'Courier': StandardFonts.Courier,
      };
      const embedCache = {};
      const getFont = async (name) => {
        if (!embedCache[name]) embedCache[name] = await pdfDoc.embedFont(fontMap[name] || StandardFonts.Helvetica);
        return embedCache[name];
      };

      const parseHex = (hex) => {
        const h = hex.replace('#', '');
        return rgb(parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255);
      };

      const pdfPages = pdfDoc.getPages();
      for (const box of textBoxes) {
        const pg = pdfPages[box.pageIndex];
        if (!pg) continue;
        const { height, width } = pg.getSize();
        const pageEl = pages[box.pageIndex];
        const font = await getFont(box.font);
        pg.drawText(box.text, {
          x: box.x * (width / pageEl.width),
          y: height - box.y * (height / pageEl.height) - box.fontSize,
          size: box.fontSize,
          font,
          color: parseHex(box.color),
        });
      }

      setProgress(85);
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setOutputUrl(URL.createObjectURL(blob));
      setOutputName(file.name.replace(/\.pdf$/i, '') + '_text.pdf');
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
        <span className="tool-breadcrumb-current">Add Text to PDF</span>
      </div>
      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fffbeb' }}>
            <Type size={36} color="#f59e0b" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Add Text to PDF</div>
            <div className="tool-header-desc">Click anywhere on your PDF to place text with custom font, size, and color. Multiple text blocks supported across all pages.</div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Custom Fonts</span>
              <span className="info-chip">✓ Any Position</span>
              <span className="info-chip">✓ All Pages</span>
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
              <div className="upload-zone-icon"><Upload size={32} color="#f59e0b" /></div>
              <div className="upload-zone-title">Drop your PDF here</div>
              <div className="upload-zone-sub">Click anywhere on the page to place text</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><Upload size={14} /> Select PDF</div>
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
                  <div className="file-item-icon" style={{ background: '#fffbeb' }}><FileIcon size={18} color="#f59e0b" /></div>
                  <span className="file-item-name">{file.name}</span>
                  <span className="file-item-size">{formatBytes(file.size)}</span>
                  <button className="file-item-remove" onClick={() => { setFile(null); setPages([]); setTextBoxes([]); setStatus('idle'); }}><X size={14} /></button>
                </div>
              </div>

              {pages.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Page {currentPage + 1} / {pages.length}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} disabled={currentPage === pages.length - 1} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: currentPage === pages.length - 1 ? 'not-allowed' : 'pointer' }}>Next →</button>
                </div>
              )}

              <div style={{ position: 'relative', display: 'inline-block', cursor: 'text', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }} onClick={handleClick}>
                <img src={currentPage_.dataUrl} alt="PDF" style={{ display: 'block', maxWidth: '100%' }} />
                {currentBoxes.map(box => (
                  <div key={box.id} style={{ position: 'absolute', left: box.x, top: box.y, zIndex: 10, pointerEvents: 'auto' }}>
                    <span style={{ fontFamily: box.font, fontSize: box.fontSize, color: box.color, background: 'rgba(255,251,235,0.85)', padding: '2px 4px', borderRadius: 3, border: '1px dashed #f59e0b', whiteSpace: 'nowrap', cursor: 'default' }}>{box.text}</span>
                    <button onClick={(e) => { e.stopPropagation(); setTextBoxes(prev => prev.filter(b => b.id !== box.id)); }}
                      style={{ marginLeft: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '1px 5px', fontSize: 10 }}>✕</button>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>💡 Click anywhere on the page to add your text at that position</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Embedding text…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#f59e0b' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">Text Added!</div>
              <div className="result-box-sub">{textBoxes.length} text element(s) embedded</div>
              <button className="download-btn" onClick={() => { const a = document.createElement('a'); a.href = outputUrl; a.download = outputName; a.click(); }} style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><Download size={16} /> Download PDF</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🔤 Text Options</div>
            <div className="sidebar-card-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Text Content</label>
                <input type="text" className="tool-input" style={{ fontSize: 13 }} value={textContent} onChange={e => setTextContent(e.target.value)} placeholder="Enter text…" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Font</label>
                <select className="sidebar-select" style={{ width: '100%' }} value={fontStyle} onChange={e => setFontStyle(e.target.value)}>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Helvetica Bold">Helvetica Bold</option>
                  <option value="Times Roman">Times Roman</option>
                  <option value="Courier">Courier</option>
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Size (pt)</label>
                <input type="number" className="sidebar-select" style={{ padding: '8px 12px', width: '100%' }} min="6" max="120" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Color</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} style={{ width: 36, height: 36, border: '1px solid #d1d5db', borderRadius: 4, padding: 2, cursor: 'pointer' }} />
                  <input type="text" className="sidebar-select" style={{ flex: 1, padding: '8px 6px', fontSize: 12 }} value={textColor} onChange={e => setTextColor(e.target.value)} />
                </div>
              </div>

              {/* Preview */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12, textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: Math.min(fontSize, 24), color: textColor, fontWeight: fontStyle.includes('Bold') ? 700 : 400 }}>{textContent || 'Preview'}</div>
                <div style={{ fontSize: 10, color: '#92400e', marginTop: 4 }}>{fontStyle} · {fontSize}pt</div>
              </div>

              {textBoxes.length > 0 && (
                <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 12 }}>
                  <strong>{textBoxes.length}</strong> text block(s) on document
                </div>
              )}

              <button className="tool-action-btn" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', marginTop: 4 }}
                disabled={status !== 'editing' || textBoxes.length === 0} onClick={process}>
                <Download size={18} /> Save PDF with Text
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
