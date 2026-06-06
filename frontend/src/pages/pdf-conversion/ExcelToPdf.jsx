import { useState, useRef } from 'react';
import { Table, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

export default function ExcelToPdf() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();

  const [resultUrl, setResultUrl] = useState(null);
  const [resultFilename, setResultFilename] = useState('');

  const handleFile = (f) => {
    if (f && (f.type.includes('spreadsheetml') || f.type.includes('excel') || f.name.endsWith('.xls') || f.name.endsWith('.xlsx'))) {
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
    xhr.open('POST', '/api/excel-to-pdf/', true);
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
        let filename = file.name.replace('.xlsx', '.pdf').replace('.xls', '.pdf');
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
        <span className="tool-breadcrumb-current">Excel to PDF</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#f0fdf4' }}>
            <Table size={36} color="#22c55e" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Excel to PDF</div>
            <div className="tool-header-desc">
              Make Excel spreadsheets easy to read by converting them to PDF.
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
              <input ref={inputRef} type="file" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div className="upload-zone-icon"><Upload size={32} color="#22c55e" /></div>
              <div className="upload-zone-title">Drop EXCEL file here</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                <Upload size={14} /> Select EXCEL file
              </div>
            </div>
          ) : (
            <div className="file-list">
              <div className="file-item">
                <div className="file-item-icon" style={{ background: '#f0fdf4' }}><FileIcon size={18} color="#22c55e" /></div>
                <span className="file-item-name">{file.name}</span>
                <span className="file-item-size">{formatBytes(file.size)}</span>
                <button className="file-item-remove" onClick={() => setFile(null)}><X size={14} /></button>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Converting to PDF…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#22c55e' }} /></div>
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
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
                disabled={!file || status === 'processing'}
                onClick={process}
              >
                <Table size={18} />
                {status === 'processing' ? 'Converting…' : 'Convert to PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
