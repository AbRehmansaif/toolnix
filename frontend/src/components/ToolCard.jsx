import { Link } from 'react-router-dom';
import {
  FileText, FileType, Image, FileImage, Table, Presentation,
  Combine, Scissors, Archive, FileMinus, Trash2, ArrowUpDown,
  RotateCw, Hash, Droplets, Eraser, Images, ImageDown,
  ScanText, MonitorDown, Pipette, Palette, Info, ShieldOff,
  QrCode, ArrowRight
} from 'lucide-react';
import '../styles/ToolCard.css';

const iconMap = {
  FileText, FileType, Image, FileImage, Table, Presentation,
  Combine, Scissors, Archive, FileMinus, Trash2, ArrowUpDown,
  RotateCw, Hash, Droplets, Eraser, Images, ImageDown,
  ScanText, MonitorDown, Pipette, Palette, Info, ShieldOff,
  QrCode,
};

const badgeClass = {
  Popular: 'badge-popular',
  AI: 'badge-ai',
  Free: 'badge-free',
};

export default function ToolCard({ tool }) {
  const Icon = iconMap[tool.icon] || FileText;

  const inner = (
    <>
      {tool.badge && (
        <span className={`tool-card-badge ${badgeClass[tool.badge] || ''}`}>
          {tool.badge}
        </span>
      )}
      <div
        className="tool-card-icon-wrap"
        style={{ background: tool.bgColor }}
      >
        <Icon size={24} color={tool.color} strokeWidth={1.8} />
      </div>
      <h3 className="tool-card-title">{tool.title}</h3>
      <p className="tool-card-desc">{tool.description}</p>
      <div className="tool-card-arrow">
        Use tool <ArrowRight size={14} />
      </div>
    </>
  );

  // If the tool has a client-side route, use Link; otherwise use a regular anchor
  if (tool.path) {
    return (
      <Link id={tool.id} to={tool.path} className="tool-card">
        {inner}
      </Link>
    );
  }

  return (
    <a id={tool.id} href={`#${tool.id}`} className="tool-card">
      {inner}
    </a>
  );
}
