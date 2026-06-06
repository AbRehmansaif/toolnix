import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb navigation displayed on every tool page.
 * Matches the BreadcrumbList JSON-LD schema injected in App.jsx,
 * so Google displays breadcrumbs directly in search results.
 *
 * @param {object} tool     - The current tool object from tools.js
 * @param {object} category - The parent category object from tools.js
 */
export default function Breadcrumb({ tool, category }) {
  if (!tool || !category) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        padding: '10px 20px',
      }}
    >
      <ol
        itemScope
        itemType="https://schema.org/BreadcrumbList"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 0,
          listStyle: 'none',
          fontSize: '13px',
          color: '#64748b',
          flexWrap: 'wrap',
        }}
      >
        {/* Home */}
        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Link
            to="/"
            itemProp="item"
            aria-label="Home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#2b5ce7',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1a3fa3')}
            onMouseLeave={e => (e.currentTarget.style.color = '#2b5ce7')}
          >
            <Home size={13} />
            <span itemProp="name">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>

        <li aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
          <ChevronRight size={13} style={{ color: '#cbd5e1' }} />
        </li>

        {/* Category */}
        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Link
            to={`/#${category.id}`}
            itemProp="item"
            style={{
              color: '#2b5ce7',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1a3fa3')}
            onMouseLeave={e => (e.currentTarget.style.color = '#2b5ce7')}
          >
            <span itemProp="name">{category.label}</span>
          </Link>
          <meta itemProp="position" content="2" />
        </li>

        <li aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
          <ChevronRight size={13} style={{ color: '#cbd5e1' }} />
        </li>

        {/* Current Tool */}
        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <span
            itemProp="name"
            aria-current="page"
            style={{ color: '#334155', fontWeight: 600 }}
          >
            {tool.title}
          </span>
          <meta itemProp="position" content="3" />
        </li>
      </ol>
    </nav>
  );
}
