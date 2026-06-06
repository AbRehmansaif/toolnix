import { seoData } from '../data/seoContent';

// Helper to render **bold** text
const renderBoldText = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

/**
 * SEO Article rendered below every tool page.
 * Uses semantic HTML5 elements (<article>, <section>, <h2>, <h3>)
 * and Schema.org Article microdata to help Google understand content structure.
 */
export default function SeoArticle({ toolId }) {
  const content = seoData[toolId];

  if (!content || !content.article) return null;
  const { intro, steps, features, faqs } = content.article;

  return (
    <article
      itemScope
      itemType="https://schema.org/Article"
      style={{
        padding: '60px 20px',
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          color: '#334155',
          lineHeight: '1.8',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Intro */}
        <section aria-label="Introduction">
          <p
            itemProp="description"
            style={{ fontSize: '17px', marginBottom: '40px', color: '#475569' }}
          >
            {renderBoldText(intro)}
          </p>
        </section>

        {/* Steps */}
        <section aria-label={steps.heading} style={{ marginBottom: '40px' }}>
          <h2
            itemProp="headline"
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '16px',
              paddingBottom: '10px',
              borderBottom: '2px solid #f1f5f9',
            }}
          >
            {steps.heading}
          </h2>
          <ol style={{ paddingLeft: '24px', fontSize: '16px', color: '#475569' }}>
            {steps.items.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '14px', lineHeight: '1.7' }}>
                {renderBoldText(item)}
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section aria-label={features.heading} style={{ marginBottom: '40px' }}>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '16px',
              paddingBottom: '10px',
              borderBottom: '2px solid #f1f5f9',
            }}
          >
            {features.heading}
          </h2>
          <ul style={{ paddingLeft: '24px', fontSize: '16px', color: '#475569' }}>
            {features.items.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '12px', lineHeight: '1.7' }}>
                {renderBoldText(item)}
              </li>
            ))}
          </ul>
        </section>

        {/* FAQs */}
        <section
          aria-label={faqs.heading}
          itemScope
          itemType="https://schema.org/FAQPage"
          style={{ marginBottom: '20px' }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '24px',
              paddingBottom: '10px',
              borderBottom: '2px solid #f1f5f9',
            }}
          >
            {faqs.heading}
          </h2>
          {faqs.items.map((faq, idx) => (
            <div
              key={idx}
              itemProp="mainEntity"
              itemScope
              itemType="https://schema.org/Question"
              style={{
                marginBottom: '24px',
                padding: '20px',
                background: '#f8fafc',
                borderRadius: '10px',
                borderLeft: '3px solid #2b5ce7',
              }}
            >
              <h3
                itemProp="name"
                style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '10px',
                  lineHeight: '1.5',
                }}
              >
                {faq.q}
              </h3>
              <div
                itemProp="acceptedAnswer"
                itemScope
                itemType="https://schema.org/Answer"
              >
                <p
                  itemProp="text"
                  style={{ fontSize: '15px', color: '#475569', margin: 0, lineHeight: '1.7' }}
                >
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </article>
  );
}
