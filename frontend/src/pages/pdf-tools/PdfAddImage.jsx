import { useState, useRef } from 'react';
import { ImagePlus, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2 } from 'lucide-react';
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

export default function PdfAddImage() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pendingImg, setPendingImg] = useState(null); // {dataUrl, type, w, h}
  const [placements, setPlacements] = useState([]);   // {id, pageIndex, x, y, width, height, dataUrl, type}
  const [imgWidth, setImgWidth] = useState(150);
  const [imgHeight, setImgHeight] = useState(100);
  const [keepRatio, setKeepRatio] = useState(true);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('output.pdf');
  const [progress, setProgress] = useState(0);
  const pdfInputRef = useRef();
  const imgInputRef = useRef();

  const handleFile = async (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f); setStatus('loading'); setPages([]); setPlacements([]); setPendingImg(null); setOutputUrl(null);
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

  const handleImgUpload = (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const type = f.type === 'image/jpeg' ? 'jpg' : 'png';
        setPendingImg({ dataUrl: e.target.result, type, w: img.naturalWidth, h: img.naturalHeight });
        const aspect = img.naturalWidth / img.naturalHeight;
        setImgWidth(150);
        setImgHeight(keepRatio ? Math.round(150 / aspect) : 100);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(f);
  };

  const handlePageClick = (e) => {
    if (!pendingImg) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - imgWidth / 2;
    const y = e.clientY - rect.top - imgHeight / 2;
    setPlacements(prev => [...prev, {
      id: Date.now(), pageIndex: currentPage,
      x, y, width: imgWidth, height: imgHeight,
      dataUrl: pendingImg.dataUrl, type: pendingImg.type
    }]);
  };

  const currentPage_ = pages[currentPage];
  const currentPlacements = placements.filter(p => p.pageIndex === currentPage);

  const process = async () => {
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

        const b64 = pl.dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const embImg = pl.type === 'jpg'
          ? await pdfDoc.embedJpg(bytes)
          : await pdfDoc.embedPng(bytes);

        pg.drawImage(embImg, {
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
      setOutputName(file.name.replace(/\.pdf$/i, '') + '_image.pdf');
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
        <span className="tool-breadcrumb-current">Add Image to PDF</span>
      </div>
      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fdf2f8' }}>
            <ImagePlus size={36} color="#ec4899" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Add Image to PDF</div>
            <div className="tool-header-desc">Upload a JPG or PNG image, set its size, then click anywhere on your PDF pages to place it at the exact position you need.</div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ JPG & PNG</span>
              <span className="info-chip">✓ Resize</span>
              <span className="info-chip">✓ Multi-page</span>
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
              <div className="upload-zone-icon"><Upload size={32} color="#ec4899" /></div>
              <div className="upload-zone-title">Drop your PDF here</div>
              <div className="upload-zone-sub">Then upload an image to place on it</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)' }}><Upload size={14} /> Select PDF</div>
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
                  <div className="file-item-icon" style={{ background: '#fdf2f8' }}><FileIcon size={18} color="#ec4899" /></div>
                  <span className="file-item-name">{file.name}</span>
                  <span className="file-item-size">{formatBytes(file.size)}</span>
                  <button className="file-item-remove" onClick={() => { setFile(null); setPages([]); setPlacements([]); setStatus('idle'); setPendingImg(null); }}><X size={14} /></button>
                </div>
              </div>

              {pages.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Page {currentPage + 1} / {pages.length}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} disabled={currentPage === pages.length - 1} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: currentPage === pages.length - 1 ? 'not-allowed' : 'pointer' }}>Next →</button>
                </div>
              )}

              {pendingImg ? (
                <div style={{ marginBottom: 12, padding: '10px 14px', background: '#fdf2f8', borderRadius: 8, border: '1px solid #fbcfe8', fontSize: 12, color: '#be185d', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={pendingImg.dataUrl} alt="pending" style={{ height: 40, width: imgWidth * (40 / imgHeight), objectFit: 'contain', background: '#fff', borderRadius: 4, border: '1px solid #e2e8f0' }} />
                  <span>Click on the PDF to place {imgWidth}×{imgHeight}px image</span>
                  <button onClick={() => setPendingImg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#be185d', fontSize: 18 }}>✕</button>
                </div>
              ) : (
                <div style={{ marginBottom: 12, padding: 12, background: '#fdf2f8', border: '1px dashed #f9a8d4', borderRadius: 8, textAlign: 'center', cursor: 'pointer' }} onClick={() => imgInputRef.current?.click()}>
                  <input ref={imgInputRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={e => handleImgUpload(e.target.files[0])} />
                  <ImagePlus size={24} color="#ec4899" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#be185d' }}>Upload image (JPG/PNG)</div>
                </div>
              )}

              <div style={{ position: 'relative', display: 'inline-block', cursor: pendingImg ? 'copy' : 'default', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }} onClick={handlePageClick}>
                <img src={currentPage_.dataUrl} alt="PDF" style={{ display: 'block', maxWidth: '100%' }} />
                {currentPlacements.map(pl => (
                  <div key={pl.id} style={{ position: 'absolute', left: pl.x, top: pl.y, width: pl.width, height: pl.height, zIndex: 10 }}>
                    <img src={pl.dataUrl} alt="placed" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                    <button onClick={(e) => { e.stopPropagation(); setPlacements(prev => prev.filter(p => p.id !== pl.id)); }}
                      style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Embedding image…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#ec4899' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">Image Added!</div>
              <div className="result-box-sub">{placements.length} image(s) embedded in PDF</div>
              <button className="download-btn" onClick={() => { const a = document.createElement('a'); a.href = outputUrl; a.download = outputName; a.click(); }} style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)' }}><Download size={16} /> Download PDF</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🖼️ Image Options</div>
            <div className="sidebar-card-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Width (px on preview)</label>
                <input type="number" className="sidebar-select" style={{ padding: '8px 12px', width: '100%' }} min="20" max="800" value={imgWidth} onChange={e => setImgWidth(Number(e.target.value))} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Height (px on preview)</label>
                <input type="number" className="sidebar-select" style={{ padding: '8px 12px', width: '100%' }} min="20" max="800" value={imgHeight} onChange={e => setImgHeight(Number(e.target.value))} />
              </div>
              {placements.length > 0 && (
                <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 12 }}>
                  <strong>{placements.length}</strong> image placement(s) across pages
                </div>
              )}
              <button className="tool-action-btn" style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)', marginTop: 4 }}
                disabled={status !== 'editing' || placements.length === 0} onClick={process}>
                <Download size={18} /> Save PDF with Images
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
