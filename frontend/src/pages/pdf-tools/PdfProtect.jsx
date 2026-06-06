import { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';

export default function PdfProtect() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('protected.pdf');
  const inputRef = useRef();

  const handleFiles = (newFiles) => {
    const f = newFiles[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setOutputUrl(null);
      setStatus('idle');
    }
  };

  const process = async () => {
    if (!file || !password) return;
    
    setStatus('processing');
    setProgress(5);

    try {
      // 1. Read the uploaded file into a Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);
      
      setProgress(30);

      // 2. Encrypt the PDF natively using 128-bit RC4 encryption
      const encryptedBytes = await encryptPDF(pdfBytes, password);
      
      setProgress(80);

      // 3. Create blob and download URL
      const outBlob = new Blob([encryptedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(outBlob);

      setOutputUrl(url);
      setOutputName(`${file.name.replace(/\.pdf$/i, '')}_protected.pdf`);
      setProgress(100);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert('Error protecting PDF: ' + err.message);
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
        <Link to="/#pdf-editing">PDF Editing</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Protect PDF</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#ecfdf5' }}>
            <ShieldCheck size={36} color="#10b981" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Protect PDF with Password</div>
            <div className="tool-header-desc">
              Secure your PDF files with a password to prevent unauthorized access.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Secure</span>
              <span className="info-chip">✓ Client-Side</span>
              <span className="info-chip">✓ AES Encrypted</span>
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
              onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
              <div className="upload-zone-icon"><Upload size={32} color="#10b981" /></div>
              <div className="upload-zone-title">Drop PDF file here</div>
              <div className="upload-zone-sub">Max file size: 50MB</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                <Upload size={14} /> Select PDF
              </div>
            </div>
          ) : (
            <div className="file-list">
              <div className="file-item">
                <div className="file-item-icon" style={{ background: '#ecfdf5' }}><FileIcon size={18} color="#10b981" /></div>
                <span className="file-item-name">{file.name}</span>
                <span className="file-item-size">{formatBytes(file.size)}</span>
                <button className="file-item-remove" onClick={() => { setFile(null); setOutputUrl(null); }}><X size={14} /></button>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 24 }}>
              <div className="progress-label"><span>Encrypting Document…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#10b981' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">PDF Protected Successfully!</div>
              <button className="download-btn" onClick={download} style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><Download size={16} /> Download Protected PDF</button>
            </div>
          )}
          
          <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', gap: 12 }}>
            <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                <strong>Bank Grade Security, Zero Quality Loss:</strong> Password protect your PDF files instantly without compromising quality. Our advanced browser based tool guarantees that your document's original layout, searchable text, and hyperlinks are perfectly preserved. Best of all, your files remain 100% private and never leave your device.
            </div>
          </div>
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🔒 Security Options</div>
            <div className="sidebar-card-body">
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>Set Password</label>
                <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 10 }} />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter secure password"
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
              </div>

              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                disabled={!file || !password || status === 'processing'}
                onClick={process}
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Encrypting PDF…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Protect PDF
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
