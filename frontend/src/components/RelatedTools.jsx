import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { toolCategories } from '../data/tools';
import '../styles/Home.css'; // Reuse existing card styles

export default function RelatedTools({ currentPath }) {
  const [relatedTools, setRelatedTools] = useState([]);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    let currentCategory = null;
    let currentTool = null;
    
    // Find the current tool and its category
    for (const category of toolCategories) {
      const foundTool = category.tools.find(t => t.path === currentPath);
      if (foundTool) {
        currentCategory = category;
        currentTool = foundTool;
        break;
      }
    }

    if (currentCategory && currentTool) {
      setCategoryName(currentCategory.label);
      
      // Get other tools in the same category, excluding the current one
      const otherTools = currentCategory.tools.filter(t => t.id !== currentTool.id);
      
      // Shuffle array to show different tools each time
      const shuffled = otherTools.sort(() => 0.5 - Math.random());
      
      // Select up to 4 tools
      setRelatedTools(shuffled.slice(0, 4));
    }
  }, [currentPath]);

  if (relatedTools.length === 0) return null;

  return (
    <div style={{ padding: '60px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', marginTop: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '24px', textAlign: 'center' }}>
          More {categoryName} You Might Like
        </h2>
        
        <div className="tools-grid">
          {relatedTools.map(tool => {
            const Icon = LucideIcons[tool.icon] || LucideIcons.Wrench;
            return (
              <Link to={tool.path} key={tool.id} className="tool-card">
                <div className="tool-icon-wrapper" style={{ backgroundColor: tool.bgColor }}>
                  <Icon color={tool.color} size={28} strokeWidth={1.5} />
                </div>
                <div className="tool-info">
                  <h3 className="tool-title">
                    {tool.title}
                    {tool.badge && <span className={`tool-badge badge-${tool.badge.toLowerCase()}`}>{tool.badge}</span>}
                  </h3>
                  <p className="tool-desc">{tool.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
