import { useState, useRef, useEffect } from 'react';
import { BookOpen, Upload, X, ChevronRight, File as FileIcon, Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight as ChevronRightIcon, Maximize, Minimize, Link as LinkIcon, List, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/ToolPage.css';

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

const loadScript = (id, src) => new Promise((resolve, reject) => {
  if (document.getElementById(id)) return resolve();
  const s = document.createElement('script');
  s.id = id; s.src = src;
  s.onload = resolve; s.onerror = () => reject(new Error('Failed to load ' + src));
  document.head.appendChild(s);
});

const BookmarkNode = ({ item, navigateToBookmark, level = 0 }) => {
  const [expanded, setExpanded] = useState(false); // Fold all by default
  const hasChildren = item.items && item.items.length > 0;
  
  return (
    <div style={{ paddingLeft: level === 0 ? 0 : 12 }}>
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '6px 8px', 
          borderRadius: 6,
          cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div 
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          style={{ width: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: hasChildren ? 'pointer' : 'default' }}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />
          ) : (
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }} />
          )}
        </div>
        <div 
          onClick={() => {
              navigateToBookmark(item);
              if (hasChildren) setExpanded(!expanded);
          }}
          style={{ 
            fontSize: 13, 
            color: '#334155', 
            flex: 1,
            textOverflow: 'ellipsis', 
            overflow: 'hidden', 
            whiteSpace: 'nowrap',
            marginLeft: 4,
            fontWeight: level === 0 ? 600 : 400
          }}
          title={item.title}
        >
          {item.title}
        </div>
      </div>
      {hasChildren && expanded && (
        <div style={{ borderLeft: '1px solid #e2e8f0', marginLeft: 10, marginTop: 2, marginBottom: 2 }}>
          {item.items.map((child, idx) => (
            <BookmarkNode key={idx} item={child} navigateToBookmark={navigateToBookmark} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function PdfViewerOnline() {
  const [file, setFile] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, viewing
  
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const canvasRef = useRef(null);
  const inputRef = useRef();
  const viewerRef = useRef(null);

  const initPdf = async (pdfSource, fileName) => {
    setStatus('loading'); setPdfDoc(null); setCurrentPage(1); setScale(1.0); setBookmarks([]);
    try {
      await loadScript('pdfjs-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js');
      const pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      
      const pdf = await pdfjsLib.getDocument(pdfSource).promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      
      // Fetch outline (bookmarks)
      const outline = await pdf.getOutline();
      if (outline && outline.length > 0) {
          setBookmarks(outline);
      } else {
          setSidebarOpen(false); // hide sidebar if no bookmarks
      }
      
      setStatus('viewing');
      renderPage(pdf, 1, 1.0);
    } catch (err) {
      console.error(err); setFile(null); setStatus('idle');
      alert('Error loading PDF: ' + err.message);
    }
  };

  const handleFile = async (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile({ name: f.name, size: f.size });
    const ab = await f.arrayBuffer();
    initPdf({ data: ab }, f.name);
  };

  const handleUrlLoad = async () => {
    if (!urlInput.trim()) return;
    setFile({ name: urlInput.split('/').pop() || 'Document', size: 0 });
    initPdf({ url: urlInput }, 'Online Document');
  };

  const renderPage = async (pdf, pageNum, currentScale) => {
    if (!pdf || !canvasRef.current) return;
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: currentScale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
    } catch (error) {
      console.error("Error rendering page", error);
    }
  };

  useEffect(() => {
    if (pdfDoc && status === 'viewing') {
      renderPage(pdfDoc, currentPage, scale);
    }
  }, [currentPage, scale, pdfDoc, status]);

  const goToPrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage(p => Math.min(numPages, p + 1));
  const zoomIn = () => setScale(s => Math.min(3.0, s + 0.25));
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.25));
  const fitWidth = () => setScale(1.5);
  const fitPage = () => setScale(1.0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (status !== 'viewing') return;
      if (e.target.tagName.toLowerCase() === 'input') return;
      
      if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        goToPrevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, numPages]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen().catch(err => {
        alert(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const navigateToBookmark = async (item) => {
    if (!pdfDoc) return;
    try {
        let dest = item.dest;
        if (typeof dest === 'string') {
            dest = await pdfDoc.getDestination(dest);
        }
        if (dest && dest[0]) {
            const pageIndex = await pdfDoc.getPageIndex(dest[0]);
            setCurrentPage(pageIndex + 1);
        }
    } catch (err) {
        console.error("Failed to navigate to bookmark", err);
    }
  };

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link><ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-editing">PDF Editing</Link><ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">View PDF</span>
      </div>
      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#eef2ff' }}>
            <BookOpen size={36} color="#6366f1" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">View PDF Online</div>
            <div className="tool-header-desc">Professional PDF reader directly in your browser. Supports loading from URLs, bookmarks navigation, and full-screen reading mode.</div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Bookmarks</span>
              <span className="info-chip">✓ Full Screen Mode</span>
              <span className="info-chip">✓ Open via URL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        <div style={{ gridColumn: '1 / -1' }}>
          {status === 'idle' && (
            <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className={`upload-zone${drag ? ' dragover' : ''}`}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => inputRef.current?.click()}
                >
                <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                <div className="upload-zone-icon"><Upload size={32} color="#6366f1" /></div>
                <div className="upload-zone-title">Drop PDF file here</div>
                <div className="upload-zone-sub">Supports PDF documents of any size</div>
                <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><Upload size={14} /> Local PDF File</div>
                </div>

                <div style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 500 }}>OR</div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Open PDF from URL</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <LinkIcon size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 12 }} />
                            <input 
                                type="url" 
                                placeholder="https://example.com/document.pdf" 
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #cbd5e1', borderRadius: 8, outline: 'none', fontSize: 14 }}
                            />
                        </div>
                        <button 
                            onClick={handleUrlLoad}
                            disabled={!urlInput.trim()}
                            style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '0 20px', fontWeight: 600, cursor: urlInput.trim() ? 'pointer' : 'not-allowed', opacity: urlInput.trim() ? 1 : 0.6 }}
                        >
                            Open URL
                        </button>
                    </div>
                </div>
            </div>
          )}

          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>
              <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 12px' }} />
              <div>Loading document…</div>
            </div>
          )}

          {status === 'viewing' && (
            <div ref={viewerRef} style={{ background: '#f8fafc', border: isFullscreen ? 'none' : '1px solid #e2e8f0', borderRadius: isFullscreen ? 0 : 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: isFullscreen ? '100vh' : '80vh', width: isFullscreen ? '100vw' : 'auto' }}>
              
              {/* Toolbar */}
              <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: sidebarOpen ? '#eef2ff' : '#f1f5f9', border: 'none', borderRadius: 6, padding: 8, cursor: 'pointer', color: sidebarOpen ? '#6366f1' : '#64748b' }} title="Toggle Sidebar">
                      <List size={18} />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', padding: '6px 12px', borderRadius: 8 }}>
                    <FileIcon size={16} color="#64748b" />
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#334155', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file?.name}</span>
                  </div>
                  {!isFullscreen && (
                      <button onClick={() => { setFile(null); setStatus('idle'); setPdfDoc(null); setBookmarks([]); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Close</button>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                        <button onClick={zoomOut} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Zoom Out"><ZoomOut size={16} color="#475569" /></button>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#475569', minWidth: 40, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
                        <button onClick={zoomIn} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Zoom In"><ZoomIn size={16} color="#475569" /></button>
                        <div style={{ width: 1, height: 16, background: '#cbd5e1', margin: '0 4px' }} />
                        <button onClick={fitWidth} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', padding: '0 4px' }} title="Fit Width">W</button>
                        <button onClick={fitPage} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', padding: '0 4px' }} title="Fit Page">P</button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={goToPrevPage} disabled={currentPage <= 1} style={{ background: currentPage <= 1 ? '#f8fafc' : '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', color: currentPage <= 1 ? '#94a3b8' : '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <input 
                            type="number" 
                            value={currentPage} 
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val >= 1 && val <= numPages) setCurrentPage(val);
                            }}
                            style={{ width: 40, textAlign: 'center', padding: '4px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 14 }}
                        />
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#475569' }}>of {numPages}</span>
                        <button onClick={goToNextPage} disabled={currentPage >= numPages} style={{ background: currentPage >= numPages ? '#f8fafc' : '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', cursor: currentPage >= numPages ? 'not-allowed' : 'pointer', color: currentPage >= numPages ? '#94a3b8' : '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                            Next <ChevronRightIcon size={16} />
                        </button>
                    </div>

                    <button onClick={toggleFullscreen} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                </div>
              </div>
              
              {/* Layout Container */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                  
                  {/* Sidebar (Bookmarks) */}
                  {sidebarOpen && (
                      <div style={{ width: 250, background: '#fff', borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Document Outline</div>
                          {bookmarks.length > 0 ? (
                              bookmarks.map((b, i) => <BookmarkNode key={i} item={b} navigateToBookmark={navigateToBookmark} />)
                          ) : (
                              <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>No bookmarks found in this document.</div>
                          )}
                      </div>
                  )}

                  {/* PDF Viewer */}
                  <div style={{ flex: 1, overflow: 'auto', padding: 24, background: '#cbd5e1', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', background: '#fff' }}>
                      <canvas ref={canvasRef} style={{ display: 'block' }} />
                    </div>
                  </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
