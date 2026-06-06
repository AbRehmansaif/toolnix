import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Images, Upload, X, Download, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

const ACCEPTED = ['image/jpeg','image/png','image/bmp','image/gif','image/webp'];

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  return (b/1048576).toFixed(1) + ' MB';
}

export default function ImageToPdf() {
  const [files, setFiles] = useState([]);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [progress, setProgress] = useState(0);
  const [orientation, setOrientation] = useState('portrait');
  const [pageSize, setPageSize] = useState('A4');
  const [margin, setMargin] = useState('none');
  const [pdfUrl, setPdfUrl] = useState(null);
  const inputRef = useRef();

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f => ACCEPTED.includes(f.type));
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...valid.filter(f => !existing.has(f.name + f.size))];
    });
    setStatus('idle');
    setPdfUrl(null);
  };

  const remove = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setStatus('idle');
    setPdfUrl(null);
  };

  const handleConvert = async () => {
    if (!files.length) return;
    setStatus('processing');
    setProgress(0);

    try {
      const pdf = new jsPDF({
        orientation: orientation === 'landscape' ? 'l' : 'p',
        unit: 'mm',
        format: pageSize.toLowerCase()
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let marginValue = 0;
      if (margin === 'small') marginValue = 10;
      if (margin === 'big') marginValue = 20;

      const availWidth = pageWidth - (marginValue * 2);
      const availHeight = pageHeight - (marginValue * 2);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Read file as data URL
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });

        // Load image to get dimensions
        const img = await new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = dataUrl;
        });

        // Calculate aspect ratio fit
        const imgRatio = img.width / img.height;
        const pageRatio = availWidth / availHeight;

        let renderWidth, renderHeight;
        if (imgRatio > pageRatio) {
          renderWidth = availWidth;
          renderHeight = availWidth / imgRatio;
        } else {
          renderHeight = availHeight;
          renderWidth = availHeight * imgRatio;
        }

        // Center on page
        const x = marginValue + (availWidth - renderWidth) / 2;
        const y = marginValue + (availHeight - renderHeight) / 2;

        if (i > 0) pdf.addPage();
        
        pdf.addImage(dataUrl, 'JPEG', x, y, renderWidth, renderHeight);
        
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="tool-page">
      {/* Breadcrumb */}
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#image-tools">Image Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Image to PDF</span>
      </div>

      {/* Header */}
      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fff7ed' }}>
            <Images size={36} color="#f97316" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Image to PDF</div>
            <div className="tool-header-desc">
              Convert JPG, PNG, BMP, GIF and WebP images to PDF with ease. Add multiple images,
              control page orientation, size and margins.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              {['JPG','PNG','BMP','GIF','WebP'].map(t => (
                <span key={t} className="info-chip">✓ {t}</span>
              ))}
              <span className="info-chip">🔒 100% Private</span>
              <span className="info-chip">⚡ Instant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="tool-main">
        <div>
          {/* Upload */}
          <div
            className={`upload-zone${drag ? ' dragover' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(',')}
              multiple
              style={{ display:'none' }}
              onChange={e => addFiles(e.target.files)}
            />
            <div className="upload-zone-icon">
              <Upload size={32} color="#f97316" />
            </div>
            <div className="upload-zone-title">Drop images here or click to browse</div>
            <div className="upload-zone-sub">Supports JPG, PNG, BMP, GIF, WebP — up to 50MB each</div>
            <div className="upload-zone-btn">
              <Upload size={14} /> Select Images
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="file-list">
              {files.map((f, i) => (
                <div key={i} className="file-item">
                  <div className="file-item-icon" style={{ background: '#fff7ed' }}>
                    <Images size={18} color="#f97316" />
                  </div>
                  <span className="file-item-name">{f.name}</span>
                  <span className="file-item-size">{formatBytes(f.size)}</span>
                  <button className="file-item-remove" onClick={() => remove(i)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {status === 'processing' && (
            <div className="progress-wrap">
              <div className="progress-label">
                <span>Converting {files.length} image{files.length > 1 ? 's' : ''}…</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Result */}
          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} /></div>
              <div className="result-box-title">Conversion Complete!</div>
              <div className="result-box-sub">
                {files.length} image{files.length > 1 ? 's' : ''} merged into a single PDF file
              </div>
              <a href={pdfUrl} download="converted.pdf" className="download-btn" style={{ textDecoration: 'none' }}>
                <Download size={16} /> Download PDF
              </a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Settings</div>
            <div className="sidebar-card-body">
              <div className="sidebar-option">
                <span className="sidebar-option-label">Page Size</span>
                <select className="sidebar-select" value={pageSize} onChange={e => setPageSize(e.target.value)}>
                  <option>A4</option><option>Letter</option><option>A3</option><option>A5</option>
                </select>
              </div>
              <div className="sidebar-option">
                <span className="sidebar-option-label">Orientation</span>
                <select className="sidebar-select" value={orientation} onChange={e => setOrientation(e.target.value)}>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div className="sidebar-option">
                <span className="sidebar-option-label">Margin</span>
                <select className="sidebar-select" value={margin} onChange={e => setMargin(e.target.value)}>
                  <option value="none">No margin</option>
                  <option value="small">Small</option>
                  <option value="big">Large</option>
                </select>
              </div>
              <button
                className="tool-action-btn"
                disabled={!files.length || status === 'processing'}
                onClick={handleConvert}
              >
                <Images size={18} />
                {status === 'processing' ? 'Converting…' : `Convert ${files.length || ''} Image${files.length !== 1 ? 's' : ''} to PDF`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
