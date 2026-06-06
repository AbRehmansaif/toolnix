import { useState, useRef } from 'react';
import { Scissors, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2 } from 'lucide-react';
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

export default function PdfSplit() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [method, setMethod] = useState('range'); // 'range' or 'all'
  const [rangeStr, setRangeStr] = useState('1'); // page range, e.g. "1-2, 3-4"
  const [totalPages, setTotalPages] = useState(0);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputFileName, setOutputFileName] = useState('split.zip');
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setStatus('loading_pdf');
      setOutputUrl(null);
      
      try {
        await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
        const { PDFDocument } = window.PDFLib;
        const arrayBuffer = await f.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const count = pdfDoc.getPageCount();
        setTotalPages(count);
        setRangeStr(`1-${count}`);
        setStatus('idle');
      } catch (err) {
        console.error(err);
        setFile(null);
        setStatus('idle');
        alert('Could not parse PDF file to get page count.');
      }
    }
  };

  const parseRanges = (str, max) => {
    const parts = str.split(',');
    const ranges = [];
    for (const part of parts) {
      const clean = part.trim();
      if (!clean) continue;
      const m = clean.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!m) throw new Error(`Invalid range format: "${clean}"`);
      const start = parseInt(m[1], 10);
      const end = m[2] ? parseInt(m[2], 10) : start;
      if (start < 1 || end < 1 || start > max || end > max) {
        throw new Error(`Pages must be between 1 and ${max} (got "${clean}")`);
      }
      if (start > end) {
        throw new Error(`Start page cannot be greater than end page: "${clean}"`);
      }
      ranges.push({ start, end });
    }
    if (ranges.length === 0) throw new Error('Please enter at least one page range.');
    return ranges;
  };

  const process = async () => {
    if (!file) return;
    setStatus('processing');
    setProgress(15);

    try {
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument } = window.PDFLib;
      
      const arrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const total = sourcePdf.getPageCount();

      setProgress(40);

      let splitRanges = [];
      if (method === 'all') {
        for (let i = 1; i <= total; i++) {
          splitRanges.push({ start: i, end: i });
        }
      } else {
        try {
          splitRanges = parseRanges(rangeStr, total);
        } catch (rangeErr) {
          alert(rangeErr.message);
          setStatus('idle');
          return;
        }
      }

      setProgress(60);

      // If we only have 1 single range and it's not a ZIP requirement
      if (splitRanges.length === 1) {
        const subPdf = await PDFDocument.create();
        const r = splitRanges[0];
        const pageIndices = [];
        for (let pageNum = r.start; pageNum <= r.end; pageNum++) {
          pageIndices.push(pageNum - 1);
        }
        const copiedPages = await subPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach(p => subPdf.addPage(p));
        
        const bytes = await subPdf.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setOutputUrl(url);
        setOutputFileName(`${file.name.replace(/\.pdf$/i, '')}_split_${r.start}-${r.end}.pdf`);
      } else {
        // Zip multiple PDFs
        await loadScript('jszip-script', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        const zip = new window.JSZip();

        for (let idx = 0; idx < splitRanges.length; idx++) {
          const r = splitRanges[idx];
          const subPdf = await PDFDocument.create();
          const pageIndices = [];
          for (let pNum = r.start; pNum <= r.end; pNum++) {
            pageIndices.push(pNum - 1);
          }
          const copiedPages = await subPdf.copyPages(sourcePdf, pageIndices);
          copiedPages.forEach(p => subPdf.addPage(p));

          const bytes = await subPdf.save();
          const fileName = `${file.name.replace(/\.pdf$/i, '')}_part_${idx + 1}_pages_${r.start}-${r.end}.pdf`;
          zip.file(fileName, bytes);

          setProgress(60 + Math.round(((idx + 1) / splitRanges.length) * 30));
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        setOutputUrl(url);
        setOutputFileName(`${file.name.replace(/\.pdf$/i, '')}_split.zip`);
      }

      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('Error splitting PDF: ' + err.message);
    }
  };

  const download = () => {
    if (!outputUrl) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = outputFileName;
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
        <span className="tool-breadcrumb-current">PDF Split</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fef2f2' }}>
            <Scissors size={36} color="#e54040" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Split PDF</div>
            <div className="tool-header-desc">
              Separate one page or a whole set for easy conversion into independent PDF files. Extract pages or split into specific ranges client-side.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Client-Side</span>
              <span className="info-chip">✓ ZIP Download</span>
              <span className="info-chip">✓ Secure</span>
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
              <div className="upload-zone-icon"><Upload size={32} color="#e54040" /></div>
              <div className="upload-zone-title">Drop PDF file here</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#e54040,#ef4444)' }}>
                <Upload size={14} /> Select PDF
              </div>
            </div>
          ) : (
            <div className="file-list">
              <div className="file-item">
                <div className="file-item-icon" style={{ background: '#fef2f2' }}><FileIcon size={18} color="#e54040" /></div>
                <span className="file-item-name">{file.name}</span>
                <span className="file-item-size">{formatBytes(file.size)}</span>
                <button className="file-item-remove" onClick={() => { setFile(null); setTotalPages(0); setOutputUrl(null); setStatus('idle'); }}><X size={14} /></button>
              </div>
              {totalPages > 0 && (
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  📄 PDF loaded successfully. Total Pages: <strong>{totalPages}</strong>
                </div>
              )}
            </div>
          )}

          {status === 'loading_pdf' && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <Loader2 className="animate-spin" style={{ margin: '0 auto 8px' }} /> Loading & Analyzing PDF document...
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Splitting PDF…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#e54040' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} /></div>
              <div className="result-box-title">PDF Split Successfully!</div>
              <button className="download-btn" onClick={download}><Download size={16} /> Download Split Files</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">⚙️ Split Options</div>
            <div className="sidebar-card-body">
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Select split mode.</p>
              <select className="sidebar-select" style={{ marginBottom: 16 }} value={method} onChange={e => setMethod(e.target.value)}>
                <option value="range">Split by range</option>
                <option value="all">Extract all pages</option>
              </select>

              {method === 'range' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Page Ranges:</label>
                  <input
                    type="text"
                    className="sidebar-select"
                    style={{ padding: '8px 12px' }}
                    value={rangeStr}
                    onChange={e => setRangeStr(e.target.value)}
                    placeholder="e.g. 1-2, 3-5"
                    disabled={!file}
                  />
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>
                    Separate ranges with commas. Example: <code>1-3, 4-5, 6</code>
                  </span>
                </div>
              )}

              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#e54040,#ef4444)' }}
                disabled={!file || status === 'processing' || status === 'loading_pdf'}
                onClick={process}
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Splitting…
                  </>
                ) : (
                  <>
                    <Scissors size={18} />
                    Split PDF
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
