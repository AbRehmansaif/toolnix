import { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon } from 'lucide-react';
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

export default function PdfToPng() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState([]);
  const [zipBlobUrl, setZipBlobUrl] = useState(null);
  const [zipFileName, setZipFileName] = useState('images.zip');
  const inputRef = useRef();

  // Options
  const [method, setMethod] = useState('page-to-png');

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setImages([]);
      setZipBlobUrl(null);
      setStatus('idle');
    }
  };

  const process = async () => {
    if (!file) return;
    setStatus('processing');
    setProgress(5);

    try {
      // 1. Load PDF.js
      await loadScript('pdfjs-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js');
      const pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      
      setProgress(15);

      // 2. Read File ArrayBuffer
      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read PDF file'));
        reader.readAsArrayBuffer(file);
      });

      // 3. Load Document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const extractedImages = [];

      setProgress(20);

      // 4. Render Pages
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality 2.0 scale
        
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;

        const dataUrl = canvas.toDataURL('image/png');
        extractedImages.push({
          pageNum: i,
          dataUrl: dataUrl,
          name: `${file.name.replace(/\.[^/.]+$/, "")}_page_${i}.png`
        });

        setProgress(20 + Math.round((i / numPages) * 60));
      }

      setImages(extractedImages);
      setProgress(85);

      // 5. Generate ZIP in background
      await loadScript('jszip-script', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      const zip = new window.JSZip();
      
      extractedImages.forEach((img) => {
        const base64Data = img.dataUrl.split(',')[1];
        zip.file(img.name, base64Data, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      
      setZipBlobUrl(zipUrl);
      setZipFileName(`${file.name.replace(/\.[^/.]+$/, "")}_png.zip`);

      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('Error extracting PNG images: ' + err.message);
    }
  };

  const downloadAll = () => {
    if (!zipBlobUrl) return;
    const a = document.createElement('a');
    a.href = zipBlobUrl;
    a.download = zipFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadSingle = (img) => {
    const a = document.createElement('a');
    a.href = img.dataUrl;
    a.download = img.name;
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
        <span className="tool-breadcrumb-current">PDF to PNG</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#f0fdf4' }}>
            <ImageIcon size={36} color="#22c55e" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">PDF to PNG</div>
            <div className="tool-header-desc">
              Convert PDF pages into PNG images with high quality output.
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
              <div className="upload-zone-icon"><Upload size={32} color="#22c55e" /></div>
              <div className="upload-zone-title">Drop PDF file here</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                <Upload size={14} /> Select PDF
              </div>
            </div>
          ) : (
            <div className="file-list">
              <div className="file-item">
                <div className="file-item-icon" style={{ background: '#f0fdf4' }}><FileIcon size={18} color="#22c55e" /></div>
                <span className="file-item-name">{file.name}</span>
                <span className="file-item-size">{formatBytes(file.size)}</span>
                <button className="file-item-remove" onClick={() => { setFile(null); setImages([]); setZipBlobUrl(null); setStatus('idle'); }}><X size={14} /></button>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Converting to PNG…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#22c55e' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div style={{ marginTop: 24 }}>
              <div className="result-box" style={{ marginBottom: 24 }}>
                <div className="result-box-icon"><CheckCircle size={28} /></div>
                <div className="result-box-title">Images Extracted!</div>
                <button className="download-btn" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }} onClick={downloadAll}><Download size={16} /> Download PNGs (.zip)</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, textAlign: 'center', background: '#fff' }}>
                    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                      <img src={img.dataUrl} alt={`Page ${img.pageNum}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Page {img.pageNum}</div>
                    <button
                      onClick={() => downloadSingle(img)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        padding: '4px 8px',
                        background: '#fff',
                        border: '1px solid #d1d5db',
                        borderRadius: 4,
                        cursor: 'pointer',
                        color: '#374151'
                      }}
                    >
                      <Download size={12} /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Extraction Options</div>
            <div className="sidebar-card-body">
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>Choose output method.</p>
              <select className="sidebar-select" style={{ marginBottom: 16 }} value={method} onChange={e => setMethod(e.target.value)}>
                <option value="page-to-png">Page to PNG</option>
                <option value="extract">Extract images inside PDF</option>
              </select>
              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
                disabled={!file || status === 'processing'}
                onClick={process}
              >
                <ImageIcon size={18} />
                {status === 'processing' ? 'Converting…' : 'Convert to PNG'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
