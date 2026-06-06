import { useState, useRef, useEffect } from 'react';
import { FormInput, Upload, X, Download, CheckCircle, ChevronRight, File as FileIcon, Loader2 } from 'lucide-react';
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

export default function PdfFillForms() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle');
  const [fields, setFields] = useState([]); // {name, type, value, options}
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputName, setOutputName] = useState('filled.pdf');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f); setStatus('loading'); setFields([]); setOutputUrl(null);
    try {
      await loadScript('pdf-lib-script', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
      const { PDFDocument } = window.PDFLib;
      const ab = await f.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab);
      const form = pdfDoc.getForm();
      const rawFields = form.getFields();
      const parsed = rawFields.map(field => {
        const name = field.getName();
        const type = field.constructor.name; // PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown
        let value = '';
        let options = [];
        try {
          if (type === 'PDFTextField') value = field.getText() || '';
          else if (type === 'PDFCheckBox') value = field.isChecked() ? 'true' : 'false';
          else if (type === 'PDFDropdown') {
            options = field.getOptions();
            value = field.getSelected()[0] || '';
          } else if (type === 'PDFRadioGroup') {
            options = field.getOptions();
            value = field.getSelected() || '';
          }
        } catch {}
        return { name, type, value, options };
      });
      if (parsed.length === 0) {
        setStatus('no_fields');
      } else {
        setFields(parsed); setStatus('editing');
      }
    } catch (err) {
      console.error(err); setFile(null); setStatus('idle');
      alert('Error reading PDF: ' + err.message);
    }
  };

  const updateField = (name, value) => setFields(prev => prev.map(f => f.name === name ? { ...f, value } : f));

  const process = async () => {
    if (!file) return;
    setStatus('processing'); setProgress(20);
    try {
      const { PDFDocument } = window.PDFLib;
      const ab = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab);
      const form = pdfDoc.getForm();
      setProgress(50);

      for (const field of fields) {
        try {
          if (field.type === 'PDFTextField') {
            form.getTextField(field.name).setText(field.value);
          } else if (field.type === 'PDFCheckBox') {
            if (field.value === 'true') form.getCheckBox(field.name).check();
            else form.getCheckBox(field.name).uncheck();
          } else if (field.type === 'PDFDropdown') {
            form.getDropdown(field.name).select(field.value);
          } else if (field.type === 'PDFRadioGroup') {
            form.getRadioGroup(field.name).select(field.value);
          }
        } catch {}
      }

      setProgress(80);
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setOutputUrl(URL.createObjectURL(blob));
      setOutputName(file.name.replace(/\.pdf$/i, '') + '_filled.pdf');
      setProgress(100); setStatus('done');
    } catch (err) {
      console.error(err); setStatus('editing');
      alert('Error saving: ' + err.message);
    }
  };

  const typeLabel = (t) => ({
    PDFTextField: 'Text Field',
    PDFCheckBox: 'Checkbox',
    PDFDropdown: 'Dropdown',
    PDFRadioGroup: 'Radio',
  }[t] || t);

  return (
    <div className="tool-page">
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link><ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#pdf-editing">PDF Editing</Link><ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Fill PDF Forms</span>
      </div>
      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: '#ecfdf5' }}>
            <FormInput size={36} color="#10b981" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Fill PDF Forms</div>
            <div className="tool-header-desc">Detect and fill all interactive form fields in your PDF — text inputs, checkboxes, dropdowns and radio buttons — entirely in your browser.</div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ Text Fields</span>
              <span className="info-chip">✓ Checkboxes</span>
              <span className="info-chip">✓ Dropdowns</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tool-main">
        <div>
          {status === 'idle' && (
            <div className={`upload-zone${drag ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current?.click()}>
              <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <div className="upload-zone-icon"><Upload size={32} color="#10b981" /></div>
              <div className="upload-zone-title">Drop your fillable PDF</div>
              <div className="upload-zone-sub">Must contain interactive form fields</div>
              <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><Upload size={14} /> Select PDF</div>
            </div>
          )}

          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>
              <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 12px' }} />
              <div>Reading form fields…</div>
            </div>
          )}

          {status === 'no_fields' && (
            <div className="result-box" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
              <div style={{ fontSize: 32 }}>⚠️</div>
              <div className="result-box-title" style={{ color: '#92400e' }}>No Form Fields Found</div>
              <div className="result-box-sub" style={{ color: '#78350f' }}>This PDF has no interactive form fields. Try the <strong>Add Text</strong> or <strong>Edit PDF</strong> tools to add content manually.</div>
              <button onClick={() => { setFile(null); setStatus('idle'); }} style={{ marginTop: 12, padding: '8px 20px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Try Another File</button>
            </div>
          )}

          {(status === 'editing' || status === 'processing') && (
            <div>
              <div className="file-list" style={{ marginBottom: 16 }}>
                <div className="file-item">
                  <div className="file-item-icon" style={{ background: '#ecfdf5' }}><FileIcon size={18} color="#10b981" /></div>
                  <span className="file-item-name">{file.name}</span>
                  <span className="file-item-size">{formatBytes(file.size)}</span>
                  <button className="file-item-remove" onClick={() => { setFile(null); setStatus('idle'); setFields([]); }}><X size={14} /></button>
                </div>
              </div>

              <div style={{ background: 'var(--color-bg-white)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Form Fields ({fields.length})</span>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {fields.map(field => (
                    <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', background: '#dcfce7', color: '#166534', borderRadius: 4 }}>{typeLabel(field.type)}</span>
                        {field.name}
                      </label>
                      {field.type === 'PDFTextField' && (
                        <input type="text" className="tool-input" style={{ fontSize: 14 }} value={field.value} onChange={e => updateField(field.name, e.target.value)} placeholder="Enter value…" />
                      )}
                      {field.type === 'PDFCheckBox' && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                          <input type="checkbox" checked={field.value === 'true'} onChange={e => updateField(field.name, e.target.checked ? 'true' : 'false')} style={{ width: 18, height: 18 }} />
                          <span>{field.value === 'true' ? 'Checked' : 'Unchecked'}</span>
                        </label>
                      )}
                      {(field.type === 'PDFDropdown' || field.type === 'PDFRadioGroup') && field.options.length > 0 && (
                        <select className="sidebar-select" style={{ width: '100%', padding: '10px 12px' }} value={field.value} onChange={e => updateField(field.name, e.target.value)}>
                          <option value="">-- Select --</option>
                          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-wrap" style={{ marginTop: 16 }}>
              <div className="progress-label"><span>Saving filled PDF…</span><span>{Math.round(progress)}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: '#10b981' }} /></div>
            </div>
          )}

          {status === 'done' && (
            <div className="result-box" style={{ marginTop: 24 }}>
              <div className="result-box-icon"><CheckCircle size={28} color="#22c55e" /></div>
              <div className="result-box-title">Form Filled!</div>
              <div className="result-box-sub">{fields.length} field(s) filled and saved</div>
              <button className="download-btn" onClick={() => { const a = document.createElement('a'); a.href = outputUrl; a.download = outputName; a.click(); }} style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}><Download size={16} /> Download Filled PDF</button>
            </div>
          )}
        </div>

        <div>
          <div className="tool-sidebar-card">
            <div className="sidebar-card-header">📋 Instructions</div>
            <div className="sidebar-card-body">
              <ol style={{ paddingLeft: 18, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 2 }}>
                <li>Upload a fillable PDF with interactive form fields</li>
                <li>Fill in the detected fields on the left</li>
                <li>Click Save to generate the filled PDF</li>
                <li>Download and use your completed form</li>
              </ol>
              {status === 'editing' && (
                <button className="tool-action-btn" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', marginTop: 16 }} onClick={process}>
                  <Download size={18} /> Save Filled PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
