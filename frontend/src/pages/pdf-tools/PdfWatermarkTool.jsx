import { useState, useRef } from 'react';
import { Droplets, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

const loadScript = (id, src) => {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(script);
  });
};

export default function PdfWatermarkTool() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(60);
  const [color, setColor] = useState('#ef4444');
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(45);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('watermarked.pdf');
  const inputRef = useRef();

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setOutputUrl(null);
      setStatus('idle');
    }
  };

  const process = async () => {
    if (!file || !text) return;
    setStatus('processing');
    setProgress(20);

    try {
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument, StandardFonts, rgb, degrees } = window.PDFLib;
      setProgress(40);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pdfPages = pdfDoc.getPages();

      setProgress(60);

      const parseHex = (hex) => {
        const hexClean = hex.replace('#', '');
        const r = parseInt(hexClean.substring(0, 2), 16) / 255;
        const g = parseInt(hexClean.substring(2, 4), 16) / 255;
        const b = parseInt(hexClean.substring(4, 6), 16) / 255;
        return rgb(r, g, b);
      };

      const textColor = parseHex(color);

      pdfPages.forEach((page) => {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, Number(fontSize));
        const textHeight = font.heightAtSize(Number(fontSize));

        // Draw rotated text in the center
        // Center calculation with rotation offset approximation
        const angleRad = (Number(rotation) * Math.PI) / 180;
        const cos = Math.abs(Math.cos(angleRad));
        const sin = Math.abs(Math.sin(angleRad));
        
        const rotatedWidth = textWidth * cos + textHeight * sin;
        const rotatedHeight = textWidth * sin + textHeight * cos;

        const x = (width - rotatedWidth) / 2 + (textWidth * sin * 0.4);
        const y = (height - rotatedHeight) / 2;

        page.drawText(text, {
          x,
          y,
          size: Number(fontSize),
          font,
          color: textColor,
          opacity: Number(opacity),
          rotate: degrees(Number(rotation))
        });
      });

      setProgress(85);

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setOutputUrl(url);
      setOutputName(`${file.name.replace(/\.pdf$/i, '')}_watermarked.pdf`);
      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('Error adding watermark: ' + err.message);
    }
  };

  const download = () => {
    if (!outputUrl) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = outputName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-editing">PDF Editing</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">PDF Watermark Tool</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#faf5ff' }}>
            <Droplets size={36} color="#a855f7" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">PDF Watermark Tool</div>
            <div className="tool-header-desc">
              Stamp text over your PDF in seconds. Choose typography, color, size, rotation, and transparency.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Secure</span>
              <span className="info-chip">✓ Client-Side</span>
              <span className="info-chip">✓ Customizable</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        <div>
          {!file ? (
            <div
              className={`upload-zone${drag ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div className="upload-zone-icon"><Upload size={32} color="#a855f7" /></div>
              <div className="upload-zone-title">Drop PDF file here</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#a855f7,#9333ea)' }}>
                <Upload size={14} /> Select PDF
              </div>
            </div>
          ) : (
            <div className="file-list">
              <div className="file-item">
                <div className="file-item-icon" style={{ background: '#faf5ff' }}><FileIcon size={18} color="#a855f7" /></div>
                <span className="file-item-name">{file.name}</span>
                <span className="file-item-size">{formatBytes(file.size)}</span>
                <button className="file-item-remove" onClick={() => { setFile(null); setOutputUrl(null); setStatus('idle'); }}><X size={14} /></button>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Adding Watermark…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#a855f7' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">Watermark Added!</div>
              <button className="download-btn" onClick={download} style={{ background: 'linear-gradient(135deg,#a855f7,#9333ea)' }}><Download size={16} /> Download Updated PDF</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Watermark Options</div>
            <div className="sidebar-card-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Watermark Text</label>
                <input
                  type="text"
                  className="sidebar-select"
                  style={{ padding: '8px 12px' }}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="CONFIDENTIAL"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Font Size</label>
                  <input
                    type="number"
                    className="sidebar-select"
                    style={{ padding: '8px 12px' }}
                    min="10"
                    max="150"
                    value={fontSize}
                    onChange={e => setFontSize(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Color</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="color"
                      style={{ border: '1px solid #d1d5db', borderRadius: 4, width: 36, height: 36, padding: 2, cursor: 'pointer' }}
                      value={color}
                      onChange={e => setColor(e.target.value)}
                    />
                    <input
                      type="text"
                      className="sidebar-select"
                      style={{ padding: '8px 6px', fontSize: 12 }}
                      value={color}
                      onChange={e => setColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Opacity (0-1)</label>
                  <input
                    type="number"
                    className="sidebar-select"
                    style={{ padding: '8px 12px' }}
                    step="0.1"
                    min="0.1"
                    max="1"
                    value={opacity}
                    onChange={e => setOpacity(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Rotation (°)</label>
                  <input
                    type="number"
                    className="sidebar-select"
                    style={{ padding: '8px 12px' }}
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={e => setRotation(e.target.value)}
                  />
                </div>
              </div>

              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#a855f7,#9333ea)' }}
                disabled={!file || !text || status === 'processing'}
                onClick={process}
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing…
                  </>
                ) : (
                  <>
                    <Droplets size={18} />
                    Add Watermark
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
