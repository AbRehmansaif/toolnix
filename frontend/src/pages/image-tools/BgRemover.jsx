import { useState, useRef, useEffect } from 'react';
import { ImageOff, Upload, X, Download, CheckCircle, ChevronRight, Loader2, Image as ImageIcon, PaintBucket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { removeBackground } from '@imgly/background-removal';
import '../../styles/ToolPage.css';

export default function BgRemover() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [bgType, setBgType] = useState('transparent'); // transparent, color, image
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgImage, setBgImage] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [processedBlob, setProcessedBlob] = useState(null);
  
  const inputRef = useRef();
  const bgInputRef = useRef();
  const canvasRef = useRef();

  const handleFiles = (newFiles) => {
    const f = newFiles[0];
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setResultUrl(null);
      setProcessedBlob(null);
      setStatus('idle');
      setProgress(0);
    }
  };

  const handleBgImage = (e) => {
    const f = e.target.files[0];
    if (f && f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setBgImage(url);
    }
  };

  const processImage = async () => {
    if (!file) return;
    setStatus('processing');
    setProgress(10);
    
    try {
      // Configuration for imgly background removal
      const config = {
        progress: (key, current, total) => {
            // Rough estimation of progress based on model loading and computation
            const ratio = total > 0 ? current / total : 0.5;
            setProgress(10 + Math.round(ratio * 80));
        }
      };

      const imageBlob = await removeBackground(file, config);
      setProgress(95);
      setProcessedBlob(imageBlob);
      applyBackground(imageBlob, bgType, bgColor, bgImage);
    } catch (error) {
      console.error(error);
      setStatus('idle');
      alert('Error removing background: ' + error.message);
    }
  };

  const applyBackground = (foregroundBlob, type, color, bgImgUrl) => {
    if (!foregroundBlob) return;
    
    const fgUrl = URL.createObjectURL(foregroundBlob);
    const fgImage = new Image();
    fgImage.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = fgImage.width;
        canvas.height = fgImage.height;

        const drawFinal = () => {
            ctx.drawImage(fgImage, 0, 0);
            canvas.toBlob((blob) => {
                setResultUrl(URL.createObjectURL(blob));
                setStatus('done');
                setProgress(100);
            }, type === 'transparent' ? 'image/png' : 'image/jpeg', 0.95);
        };

        if (type === 'transparent') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawFinal();
        } else if (type === 'color') {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawFinal();
        } else if (type === 'image' && bgImgUrl) {
            const bgImg = new Image();
            bgImg.onload = () => {
                // Cover behavior for background image
                const scale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
                const x = (canvas.width - bgImg.width * scale) / 2;
                const y = (canvas.height - bgImg.height * scale) / 2;
                ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
                drawFinal();
            };
            bgImg.src = bgImgUrl;
        } else {
            drawFinal();
        }
    };
    fgImage.src = fgUrl;
  };

  // Re-apply background when settings change if we already have the processed blob
  useEffect(() => {
      if (status === 'done' && processedBlob) {
          applyBackground(processedBlob, bgType, bgColor, bgImage);
      }
  }, [bgType, bgColor, bgImage]);


  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${file.name.split('.')[0]}_bg_removed.${bgType === 'transparent' ? 'png' : 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#image-tools">Image Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Background Remover</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#f5f3ff' }}>
            <ImageOff size={36} color="#8b5cf6" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Background Remover & Changer</div>
            <div className="tool-header-desc">
              Automatically remove or change image backgrounds using AI right in your browser. 
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ 100% Free</span>
              <span className="info-chip">✓ AI Powered</span>
              <span className="info-chip">✓ No Server Uploads</span>
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
              <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
              <div className="upload-zone-icon"><Upload size={32} color="#8b5cf6" /></div>
              <div className="upload-zone-title">Drop an image here</div>
              <div className="upload-zone-sub">Supports JPG, PNG, WEBP</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                <Upload size={14} /> Select Image
              </div>
            </div>
          ) : (
            <div className="preview-container" style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 12, padding: 24, position: 'relative' }}>
                <button 
                  onClick={() => { setFile(null); setResultUrl(null); setProcessedBlob(null); setStatus('idle'); }}
                  style={{ position: 'absolute', top: 12, right: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                >
                    <X size={16} color="#64748b" />
                </button>
                <img 
                  src={resultUrl || URL.createObjectURL(file)} 
                  alt="Preview" 
                  style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', objectFit: 'contain' }} 
                />
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 24 }}>
              <div className="progress-label"><span>Downloading AI Model & Processing...</span><span>{progress}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#8b5cf6' }} /></div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, textAlign: 'center' }}>First run downloads a ~40MB AI model to your browser cache. Subsequent runs will be instant!</div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">Background Removed!</div>
              <button className="download-btn" onClick={download} style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}><Download size={16} /> Download {bgType === 'transparent' ? 'PNG' : 'JPG'}</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🎨 Background Options</div>
            <div className="sidebar-card-body">
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>Select Background Type</label>
                <select className="sidebar-select" value={bgType} onChange={e => setBgType(e.target.value)}>
                  <option value="transparent">Transparent (PNG)</option>
                  <option value="color">Solid Color</option>
                  <option value="image">Custom Image</option>
                </select>
              </div>

              {bgType === 'color' && (
                  <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>Pick Color</label>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                          <span style={{ fontSize: 14, color: '#334155', fontFamily: 'monospace' }}>{bgColor.toUpperCase()}</span>
                      </div>
                  </div>
              )}

              {bgType === 'image' && (
                  <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>Upload Background Image</label>
                      <input ref={bgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgImage} />
                      <button onClick={() => bgInputRef.current?.click()} style={{ width: '100%', padding: '10px', background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <ImageIcon size={16} /> {bgImage ? 'Change Image' : 'Select Image'}
                      </button>
                  </div>
              )}

              {!processedBlob && (
                  <button
                    className="tool-action-btn"
                    style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}
                    disabled={!file || status === 'processing'}
                    onClick={processImage}
                  >
                    {status === 'processing' ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Removing Background...
                      </>
                    ) : (
                      <>
                        <ImageOff size={18} />
                        Remove Background
                      </>
                    )}
                  </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
