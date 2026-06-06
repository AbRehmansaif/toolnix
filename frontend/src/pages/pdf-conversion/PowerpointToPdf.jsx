import { useState, useRef } from 'react';
import { Presentation, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

export default function PowerpointToPdf() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();

  const [resultUrl, setResultUrl] = useState(null);
  const [resultFilename, setResultFilename] = useState('');

  const handleFile = (f) => {
    if (f && (f.type.includes('presentationml') || f.type.includes('powerpoint') || f.name.endsWith('.ppt') || f.name.endsWith('.pptx'))) {
      setFile(f);
      setStatus('idle');
      setResultUrl(null);
    }
  };

  const process = () => {
    if (!file) return;
    setStatus('processing');
    setProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/pptx-to-pdf/', true);
    xhr.responseType = 'blob';
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 50));
      }
    };
    
    let processingInterval;
    xhr.onloadstart = () => {
      let p = 50;
      processingInterval = setInterval(() => {
        if (p < 95) { p += Math.random() * 5; setProgress(Math.min(95, p)); }
      }, 500);
    };
    
    xhr.onload = () => {
      clearInterval(processingInterval);
      if (xhr.status === 200) {
        setProgress(100);
        const blob = xhr.response;
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        
        const disposition = xhr.getResponseHeader('Content-Disposition');
        let filename = file.name.replace('.pptx', '.pdf').replace('.ppt', '.pdf');
        if (disposition && disposition.includes('filename=')) {
          filename = disposition.split('filename=')[1].replace(/"/g, '');
        }
        setResultFilename(filename);
        setStatus('done');
      } else {
        alert('Conversion failed. Please try again.');
        setStatus('idle');
      }
    };
    
    xhr.onerror = () => {
      clearInterval(processingInterval);
      alert('Network error occurred.');
      setStatus('idle');
    };
    
    xhr.send(formData);
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-conversion">PDF Conversion</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">PowerPoint to PDF</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fff7ed' }}>
            <Presentation size={36} color="#f97316" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">PowerPoint to PDF</div>
            <div className="tool-header-desc">
              Make PPT and PPTX slideshows easy to view by converting them to PDF.
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
              <input ref={inputRef} type="file" accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div className="upload-zone-icon"><Upload size={32} color="#f97316" /></div>
              <div className="upload-zone-title">Drop POWERPOINT file here</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                <Upload size={14} /> Select PPT file
              </div>
            </div>
          ) : (
            <div className="file-list">
              <div className="file-item">
                <div className="file-item-icon" style={{ background: '#fff7ed' }}><FileIcon size={18} color="#f97316" /></div>
                <span className="file-item-name">{file.name}</span>
                <span className="file-item-size">{formatBytes(file.size)}</span>
                <button className="file-item-remove" onClick={() => setFile(null)}><X size={14} /></button>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Converting to PDF…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#f97316' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} /></div>
              <div className="result-box-title">Converted Successfully!</div>
              <a href={resultUrl} download={resultFilename} style={{ textDecoration: 'none' }}>
                <button className="download-btn"><Download size={16} /> Download PDF</button>
              </a>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Conversion Options</div>
            <div className="sidebar-card-body">
              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
                disabled={!file || status === 'processing'}
                onClick={process}
              >
                <Presentation size={18} />
                {status === 'processing' ? 'Converting…' : 'Convert to PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
