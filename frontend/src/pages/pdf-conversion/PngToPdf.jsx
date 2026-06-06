import { useState, useRef } from 'react';
import { FileImage, Upload, X, Download, CheckCircle, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

export default function PngToPdf() {
  const [files, setFiles] = useState([]);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('toolnix-converted.pdf');
  const inputRef = useRef();

  // Settings
  const [pageSize, setPageSize] = useState('a4'); // 'a4', 'letter', 'fit'
  const [orientation, setOrientation] = useState('auto'); // 'portrait', 'landscape', 'auto'
  const [margin, setMargin] = useState('none'); // 'none', 'small', 'large'

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f => f.type === 'image/png');
    setFiles(prev => {
      const ex = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...valid.filter(f => !ex.has(f.name + f.size))];
    });
    setPdfBlobUrl(null);
    setStatus('idle');
  };

  const remove = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPdfBlobUrl(null);
    setStatus('idle');
  };

  const getImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            src: e.target.result,
            width: img.width,
            height: img.height
          });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const process = async () => {
    if (!files.length) return;
    setStatus('processing');
    setProgress(10);

    try {
      // Load all image dimensions and data URLs
      const loadedImages = [];
      for (let i = 0; i < files.length; i++) {
        const imgData = await getImageDimensions(files[i]);
        loadedImages.push(imgData);
        setProgress(10 + Math.round((i + 1) / files.length * 40));
      }

      // PDF Page sizes in mm
      const pageSizes = {
        a4: { w: 210, h: 297 },
        letter: { w: 215.9, h: 279.4 }
      };

      const marginSizes = {
        none: 0,
        small: 10,
        large: 20
      };

      let doc = null;

      for (let i = 0; i < loadedImages.length; i++) {
        const img = loadedImages[i];
        const isLandscapeImg = img.width > img.height;

        let activeOrientation = 'p';
        if (orientation === 'landscape') {
          activeOrientation = 'l';
        } else if (orientation === 'portrait') {
          activeOrientation = 'p';
        } else {
          // Auto orientation
          activeOrientation = isLandscapeImg ? 'l' : 'p';
        }

        let pW = 0, pH = 0;
        let activeMargin = marginSizes[margin];

        if (pageSize === 'fit') {
          // Keep pixel dimensions as pt (points) for PDF
          pW = img.width;
          pH = img.height;
          activeMargin = 0; // Fit option enforces no margins
        } else {
          const size = pageSizes[pageSize];
          pW = activeOrientation === 'l' ? size.h : size.w;
          pH = activeOrientation === 'l' ? size.w : size.h;
        }

        if (i === 0) {
          doc = new jsPDF({
            orientation: activeOrientation,
            unit: pageSize === 'fit' ? 'pt' : 'mm',
            format: pageSize === 'fit' ? [pW, pH] : pageSize
          });
        } else {
          doc.addPage(pageSize === 'fit' ? [pW, pH] : pageSize, activeOrientation);
        }

        // Draw image scaling to fit printable area
        const printableWidth = pW - (activeMargin * 2);
        const printableHeight = pH - (activeMargin * 2);

        const imgRatio = img.width / img.height;
        const printRatio = printableWidth / printableHeight;

        let drawW = printableWidth;
        let drawH = printableHeight;

        if (imgRatio > printRatio) {
          drawH = printableWidth / imgRatio;
        } else {
          drawW = printableHeight * imgRatio;
        }

        const x = activeMargin + (printableWidth - drawW) / 2;
        const y = activeMargin + (printableHeight - drawH) / 2;

        doc.addImage(
          img.src,
          'PNG',
          x,
          y,
          drawW,
          drawH,
          undefined,
          'FAST'
        );
        setProgress(50 + Math.round((i + 1) / files.length * 40));
      }

      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(blobUrl);

      // Determine appropriate filename
      if (files.length === 1) {
        setPdfFileName(files[0].name.replace(/\.[^/.]+$/, "") + ".pdf");
      } else {
        setPdfFileName('toolnix-converted.pdf');
      }

      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('Error during conversion: ' + err.message);
    }
  };

  const handleDownload = () => {
    if (!pdfBlobUrl) return;
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = pdfFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-conversion">PDF Conversion</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">PNG to PDF</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#f0fdf4' }}>
            <FileImage size={36} color="#22c55e" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">PNG to PDF</div>
            <div className="tool-header-desc">
              Convert PNG images to PDF format quickly and easily.
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        <div>
          <div
            className={`upload-zone${drag ? ' dragover' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="image/png" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
            <div className="upload-zone-icon"><Upload size={32} color="#22c55e" /></div>
            <div className="upload-zone-title">Drop PNG images here</div>
            <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
              <Upload size={14} /> Select PNG images
            </div>
          </div>

          {files.length > 0 && (
            <div className="file-list">
              {files.map((f, i) => (
                <div key={i} className="file-item">
                  <div className="file-item-icon" style={{ background: '#f0fdf4' }}><ImageIcon size={18} color="#22c55e" /></div>
                  <span className="file-item-name">{f.name}</span>
                  <span className="file-item-size">{formatBytes(f.size)}</span>
                  <button className="file-item-remove" onClick={(e) => { e.stopPropagation(); remove(i); }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Converting {files.length} images…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#22c55e' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} /></div>
              <div className="result-box-title">Images Converted!</div>
              <button className="download-btn" onClick={handleDownload}><Download size={16} /> Download PDF</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Conversion Options</div>
            <div className="sidebar-card-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Page Size</label>
                <select className="sidebar-select" value={pageSize} onChange={e => { setPageSize(e.target.value); setPdfBlobUrl(null); setStatus('idle'); }}>
                  <option value="a4">A4 (210 x 297 mm)</option>
                  <option value="letter">US Letter (215.9 x 279.4 mm)</option>
                  <option value="fit">Fit to Image Size</option>
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Orientation</label>
                <select className="sidebar-select" value={orientation} onChange={e => { setOrientation(e.target.value); setPdfBlobUrl(null); setStatus('idle'); }} disabled={pageSize === 'fit'}>
                  <option value="auto">Auto (Match Image)</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Margins</label>
                <select className="sidebar-select" value={margin} onChange={e => { setMargin(e.target.value); setPdfBlobUrl(null); setStatus('idle'); }} disabled={pageSize === 'fit'}>
                  <option value="none">No Margin</option>
                  <option value="small">Small Margin (10mm)</option>
                  <option value="large">Large Margin (20mm)</option>
                </select>
              </div>

              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
                disabled={!files.length || status === 'processing'}
                onClick={process}
              >
                <FileImage size={18} />
                {status === 'processing' ? 'Converting…' : 'Convert to PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
