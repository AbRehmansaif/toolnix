import { useState, useRef, useEffect } from 'react';
import { Spline, Upload, X, Download, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

const loadScript = (id, src) => {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) return resolve();
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(script);
  });
};

export default function ImageToSvg() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  
  // Tracing Settings
  const [preset, setPreset] = useState('default');
  
  const [svgContent, setSvgContent] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  
  const inputRef = useRef();

  useEffect(() => {
    // Load ImageTracerJS from CDN
    loadScript('imagetracer', 'https://cdnjs.cloudflare.com/ajax/libs/imagetracerjs/1.2.6/imagetracer_v1.2.6.min.js')
      .catch(err => console.error('Failed to load ImageTracer:', err));
  }, []);

  const handleFiles = (newFiles) => {
    const f = newFiles[0];
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setResultUrl(null);
      setSvgContent(null);
      setStatus('idle');
      setProgress(0);
    }
  };

  const processImage = async () => {
    if (!file || !window.ImageTracer) return;
    setStatus('processing');
    setProgress(20);
    
    try {
      const imageUrl = URL.createObjectURL(file);
      
      setProgress(40);
      
      // We wrap ImageTracer.imageToSVG in a promise to handle async
      window.ImageTracer.imageToSVG(
        imageUrl,
        (svgString) => {
            setProgress(90);
            setSvgContent(svgString);
            
            // Create a Blob from the SVG string
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            setResultUrl(URL.createObjectURL(blob));
            
            setStatus('done');
            setProgress(100);
        },
        preset // Using the selected preset
      );

    } catch (error) {
      console.error(error);
      setStatus('idle');
      alert('Error vectorizing image: ' + error.message);
    }
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    
    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${originalName}_vectorized.svg`;
    
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
        <span className="tool-breadcrumb-current">Image to SVG</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#fffbeb' }}>
            <Spline size={36} color="#f59e0b" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Image to SVG Vectorizer</div>
            <div className="tool-header-desc">
              Trace and vectorize raster images (PNG, JPG) into infinitely scalable SVG graphics.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Scalable Vectors</span>
              <span className="info-chip">✓ Multiple Presets</span>
              <span className="info-chip">✓ 100% Client-Side</span>
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
              <input ref={inputRef} type="file" accept="image/jpeg, image/png, image/webp" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
              <div className="upload-zone-icon"><Upload size={32} color="#f59e0b" /></div>
              <div className="upload-zone-title">Drop an image here</div>
              <div className="upload-zone-sub">Supports JPG, PNG, WEBP</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                <Upload size={14} /> Select Image
              </div>
            </div>
          ) : (
            <div className="preview-container" style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 12, padding: 24, position: 'relative' }}>
                <button 
                  onClick={() => { setFile(null); setResultUrl(null); setSvgContent(null); setStatus('idle'); }}
                  style={{ position: 'absolute', top: 12, right: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                >
                    <X size={16} color="#64748b" />
                </button>
                
                <div style={{ display: 'flex', gap: 24, flexDirection: window.innerWidth > 768 ? 'row' : 'column' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Original Image</div>
                        <img 
                            src={URL.createObjectURL(file)} 
                            alt="Original" 
                            style={{ width: '100%', maxHeight: 300, borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', objectFit: 'contain', background: '#fff' }} 
                        />
                    </div>
                    {svgContent && (
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 8 }}>Vectorized SVG</div>
                            <div 
                                style={{ width: '100%', height: 300, borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                                dangerouslySetInnerHTML={{ __html: svgContent.replace(/<svg /, '<svg style="max-width:100%; max-height:100%;" ') }} 
                            />
                        </div>
                    )}
                </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 24 }}>
              <div className="progress-label"><span>Tracing Vectors...</span><span>{progress}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#f59e0b' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24, borderColor: '#fde68a', background: '#fffbeb' }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#f59e0b" /></div>
              <div className="result-box-title" style={{ color: '#b45309' }}>Vectorization Complete!</div>
              <button className="download-btn" onClick={download} style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><Download size={16} /> Download SVG File</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">🖋️ Tracing Options</div>
            <div className="sidebar-card-body">

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#475569' }}>Tracing Preset</label>
                <select className="sidebar-select" value={preset} onChange={e => setPreset(e.target.value)}>
                  <option value="default">Default</option>
                  <option value="posterized1">Posterized 1 (Cartoon)</option>
                  <option value="posterized2">Posterized 2 (Detailed)</option>
                  <option value="curvy">Curvy (Smooth lines)</option>
                  <option value="sharp">Sharp (Polygon-like)</option>
                  <option value="detailed">Detailed (High fidelity)</option>
                  <option value="smoothed">Smoothed (Less noise)</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="fixedpalette">Fixed Palette (Web Colors)</option>
                  <option value="randompalette">Random Palette (Artistic)</option>
                  <option value="bw">Black & White (Sketch)</option>
                </select>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, lineHeight: 1.4 }}>
                  The preset determines how the image is traced into vectors. Try "Black & White" for logos and sketches, or "Posterized" for photos.
                </div>
              </div>

              <button
                className="tool-action-btn"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
                disabled={!file || status === 'processing'}
                onClick={processImage}
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Tracing...
                  </>
                ) : (
                  <>
                    <Spline size={18} />
                    Vectorize Image
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
