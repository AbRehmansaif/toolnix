import { useState, useRef } from 'react';
import { Info, Upload, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

import exifr from 'exifr';

function readImageMeta(file) {
  return new Promise(async (resolve) => {
    const meta = {
      'File Name': file.name,
      'File Size': formatBytes(file.size),
      'File Type': file.type,
      'Last Modified': new Date(file.lastModified).toLocaleString(),
    };
    
    try {
      const exifData = await exifr.parse(file, true);
      if (exifData) {
        for (const [key, value] of Object.entries(exifData)) {
           if (typeof value !== 'object' && !Array.isArray(value)) {
               meta[key] = String(value);
           } else if (Array.isArray(value)) {
               meta[key] = value.join(', ');
           }
        }
      }
    } catch (e) {
      console.log('No EXIF found or error parsing', e);
    }

    const img = new Image();
    img.onload = () => {
      meta['Width'] = img.naturalWidth + ' px';
      meta['Height'] = img.naturalHeight + ' px';
      meta['Megapixels'] = ((img.naturalWidth * img.naturalHeight) / 1000000).toFixed(2) + ' MP';
      meta['Aspect Ratio'] = (img.naturalWidth / img.naturalHeight).toFixed(3);
      URL.revokeObjectURL(img.src);
      resolve(meta);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function ImageMetadata() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [meta, setMeta] = useState(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    const m = await readImageMeta(f);
    setMeta(m);
  };

  const clear = () => { setFile(null); setPreview(null); setMeta(null); };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#image-tools">Image Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Image Metadata Viewer</span>
      </div>

      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#f0fdfa' }}>
            <Info size={36} color="#14b8a6" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Image Metadata Viewer</div>
            <div className="tool-header-desc">
              View EXIF data and metadata embedded in your image files — camera settings,
              GPS coordinates, timestamps, dimensions, and more.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">📐 Dimensions</span>
              <span className="info-chip">📸 Camera info</span>
              <span className="info-chip">📍 GPS data</span>
              <span className="info-chip">🔒 Local processing</span>
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
              <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div className="upload-zone-icon"><Upload size={32} color="#14b8a6" /></div>
              <div className="upload-zone-title">Drop image here or click to browse</div>
              <div className="upload-zone-sub">Supports JPG, PNG, TIFF, WebP, HEIC</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#14b8a6,#0891b2)', boxShadow: '0 8px 24px rgba(20,184,166,0.3)' }}>
                <Upload size={14} /> Select Image
              </div>
            </div>
          ) : (
            <>
              <div className="preview-area">
                <div className="preview-header">
                  <span className="preview-header-title">📷 {file.name}</span>
                  <button className="file-item-remove" onClick={clear}><X size={14} /></button>
                </div>
                <div className="preview-body" style={{ textAlign: 'center' }}>
                  <img src={preview} alt="preview" style={{ maxHeight: 280, borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                </div>
              </div>

              {meta && (
                <div style={{ marginTop: 20, background: 'var(--color-bg-white)', borderRadius: 20, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>📋 Metadata ({Object.keys(meta).length} fields)</span>
                  </div>
                  <table className="meta-table">
                    <tbody>
                      {Object.entries(meta).map(([k, v]) => (
                        <tr key={k}>
                          <td>{k}</td>
                          <td>{v}</td>
                        </tr>
                      ))}
                      {/* Real EXIF rendered above */}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">ℹ️ About Metadata</div>
            <div className="sidebar-card-body">
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                Image metadata (EXIF) contains hidden information embedded by cameras and devices:
              </p>
              {[
                ['📐', 'Dimensions & resolution'],
                ['📸', 'Camera make & model'],
                ['⚙️', 'Aperture, ISO, shutter'],
                ['📍', 'GPS location data'],
                ['🕐', 'Date & time taken'],
                ['🖥', 'Software used'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{text}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: 12, background: '#f0fdfa', borderRadius: 12, fontSize: 12, color: '#0f766e' }}>
                🔒 All processing happens in your browser — your images never leave your device.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
