import { useState, useRef } from 'react';
import { FileArchive, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
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

export default function PdfToZip() {
  const [files, setFiles] = useState([]);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState(null);
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('documents.zip');
  const inputRef = useRef();

  const handleFiles = (newFiles) => {
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf');
    if (pdfs.length > 0) {
      setFiles(prev => {
        const newUnique = pdfs.filter(newF => !prev.some(existingF => existingF.name === newF.name));
        if (newUnique.length < pdfs.length) {
            setToast('Some duplicate files were skipped.');
            setTimeout(() => setToast(null), 3000);
        }
        return [...prev, ...newUnique];
      });
      setOutputUrl(null);
      setStatus('idle');
    }
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setOutputUrl(null);
    setStatus('idle');
  };

  const process = async () => {
    if (files.length === 0) return;
    
    setStatus('processing');
    setProgress(10);

    try {
      // Load zip.js library
      await loadScript('zip-js', 'https://unpkg.com/@zip.js/zip.js/dist/zip.min.js');
      setProgress(30);

      const { ZipWriter, BlobWriter, BlobReader } = window.zip;

      // Configure writer with optional password
      const options = {};
      if (password.trim()) {
          options.password = password.trim();
      }

      const blobWriter = new BlobWriter("application/zip");
      const zipWriter = new ZipWriter(blobWriter, options);

      // Add each file to the zip
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await zipWriter.add(file.name, new BlobReader(file));
        setProgress(30 + ((i + 1) / files.length) * 50);
      }

      // Close and finalize the zip
      const zipBlob = await zipWriter.close();
      setProgress(90);

      const url = URL.createObjectURL(zipBlob);

      setOutputUrl(url);
      setOutputName(files.length === 1 ? `${files[0].name.replace(/\.pdf$/i, '')}_archived.zip` : `archived_${files.length}_pdfs.zip`);
      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('Error creating ZIP archive: ' + err.message);
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

  const checkPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '#e2e8f0' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score <= 2) return { score: 25, label: 'Weak', color: '#ef4444' };
    if (score <= 4) return { score: 50, label: 'Fair', color: '#eab308' };
    if (score === 5) return { score: 75, label: 'Strong', color: '#22c55e' };
    return { score: 100, label: 'Very Strong', color: '#10b981' };
  };

  const strength = checkPasswordStrength(password);

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-conversion">PDF Conversion</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">PDFs to ZIP</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#f5f3ff' }}>
            <FileArchive size={36} color="#8b5cf6" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Convert PDFs to ZIP</div>
            <div className="tool-header-desc">
              Compress multiple PDF files into a single ZIP archive, with optional password protection.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Secure</span>
              <span className="info-chip">✓ Client-Side</span>
              <span className="info-chip">✓ Password Protected</span>
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
              onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" multiple accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
              <div className="upload-zone-icon"><Upload size={32} color="#8b5cf6" /></div>
              <div className="upload-zone-title">Drop PDF files here</div>
              <div className="upload-zone-sub">Supports up to 50 files (Max 200 MB total)</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                <Upload size={14} /> Add PDF Files
              </div>
            </div>

            {files.length > 0 && (
                <div className="file-list" style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12 }}>
                        Selected Files ({files.length}) - Total Size: {formatBytes(totalBytes)}
                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {files.map((f, i) => (
                            <div className="file-item" key={i} style={{ margin: 0 }}>
                                <div className="file-item-icon" style={{ background: '#f5f3ff' }}><FileIcon size={18} color="#8b5cf6" /></div>
                                <span className="file-item-name">{f.name}</span>
                                <span className="file-item-size">{formatBytes(f.size)}</span>
                                <button className="file-item-remove" onClick={() => removeFile(i)}><X size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 24 }}>
              <div className="progress-label"><span>Creating Archive…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#8b5cf6' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">ZIP Archive Created!</div>
              <button className="download-btn" onClick={download} style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}><Download size={16} /> Download {outputName}</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🔒 Security Options</div>
            <div className="sidebar-card-body">
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>ZIP Password (Optional)</label>
                <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 10 }} />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password to secure ZIP"
                        className="sidebar-select"
                        style={{ padding: '10px 36px 10px 36px', width: '100%', outline: 'none' }}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <button 
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={showPassword ? "Hide Password" : "Show Password"}
                    >
                        {showPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                    </button>
                </div>
                
                {password && (
                    <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: strength.color }}>Password Strength: {strength.label}</span>
                        </div>
                        <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${strength.score}%`, background: strength.color, transition: 'all 0.3s ease' }} />
                        </div>
                    </div>
                )}
                
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                    If provided, the ZIP file will be encrypted. Note that without this password, the files cannot be extracted. For high security, use a mix of uppercase, lowercase, numbers, and symbols.
                </div>
              </div>

              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}
                disabled={files.length === 0 || status === 'processing'}
                onClick={process}
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Zipping Files…
                  </>
                ) : (
                  <>
                    <FileArchive size={18} />
                    Create ZIP File
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modern Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', color: '#fff', padding: '12px 24px', borderRadius: 8,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)', zIndex: 1000,
          fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12,
          animation: 'fadeInUp 0.3s ease-out'
        }}>
          <div style={{ width: 8, height: 8, background: '#f59e0b', borderRadius: '50%' }} />
          {toast}
        </div>
      )}
    </div>
  );
}
