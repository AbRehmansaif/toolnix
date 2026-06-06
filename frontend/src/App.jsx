import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import RelatedTools from './components/RelatedTools';
import SeoArticle from './components/SeoArticle';
import Breadcrumb from './components/Breadcrumb';
import BlogList from './pages/blog/BlogList';
import BlogPost from './pages/blog/BlogPost';
import { toolCategories } from './data/tools';
import { seoData } from './data/seoContent';

// Image Tools
import ImageToPdf from './pages/image-tools/ImageToPdf';
import PdfToImage from './pages/image-tools/PdfToImage';
import OcrImageToText from './pages/image-tools/OcrImageToText';
import ScreenshotToText from './pages/image-tools/ScreenshotToText';
import ColorPicker from './pages/image-tools/ColorPicker';
import HexToRgb from './pages/image-tools/HexToRgb';
import RgbToHex from './pages/image-tools/RgbToHex';
import ImageMetadata from './pages/image-tools/ImageMetadata';
import RemoveExif from './pages/image-tools/RemoveExif';
import QrCodeGenerator from './pages/image-tools/QrCodeGenerator';
import BgRemover from './pages/image-tools/BgRemover';
import ImageCompressor from './pages/image-tools/ImageCompressor';
import ImageToSvg from './pages/image-tools/ImageToSvg';
import SvgToImage from './pages/image-tools/SvgToImage';
import PassportPhotoMaker from './pages/image-tools/PassportPhotoMaker';

// Developer Tools
import FaviconGenerator from './pages/developer-tools/FaviconGenerator';

// PDF Editing Tools
import PdfMerge from './pages/pdf-tools/PdfMerge';
import PdfSplit from './pages/pdf-tools/PdfSplit';
import PdfCompress from './pages/pdf-tools/PdfCompress';
import PdfPageExtractor from './pages/pdf-tools/PdfPageExtractor';
import PdfPageRemover from './pages/pdf-tools/PdfPageRemover';
import PdfPageReorder from './pages/pdf-tools/PdfPageReorder';
import PdfRotatePages from './pages/pdf-tools/PdfRotatePages';
import PdfAddPageNumbers from './pages/pdf-tools/PdfAddPageNumbers';
import PdfWatermarkTool from './pages/pdf-tools/PdfWatermarkTool';
import PdfRemoveWatermark from './pages/pdf-tools/PdfRemoveWatermark';
import PdfEdit from './pages/pdf-tools/PdfEdit';
import PdfSign from './pages/pdf-tools/PdfSign';
import PdfFillForms from './pages/pdf-tools/PdfFillForms';
import PdfAddText from './pages/pdf-tools/PdfAddText';
import PdfAddImage from './pages/pdf-tools/PdfAddImage';
import PdfAnnotate from './pages/pdf-tools/PdfAnnotate';
import PdfHighlight from './pages/pdf-tools/PdfHighlight';
import PdfDraw from './pages/pdf-tools/PdfDraw';
import PdfViewerOnline from './pages/pdf-tools/PdfViewerOnline';
import PdfHeaderFooter from './pages/pdf-tools/PdfHeaderFooter';
import PdfProtect from './pages/pdf-tools/PdfProtect';

// PDF Conversion Tools
import PdfToWord from './pages/pdf-conversion/PdfToWord';
import WordToPdf from './pages/pdf-conversion/WordToPdf';
import PdfToJpg from './pages/pdf-conversion/PdfToJpg';
import JpgToPdf from './pages/pdf-conversion/JpgToPdf';
import PdfToPng from './pages/pdf-conversion/PdfToPng';
import PngToPdf from './pages/pdf-conversion/PngToPdf';
import ExcelToPdf from './pages/pdf-conversion/ExcelToPdf';
import PdfToExcel from './pages/pdf-conversion/PdfToExcel';
import PowerpointToPdf from './pages/pdf-conversion/PowerpointToPdf';
import PdfToPowerpoint from './pages/pdf-conversion/PdfToPowerpoint';
import PdfToZip from './pages/pdf-conversion/PdfToZip';

import './App.css';

const BASE_URL = 'https://toolnix.pro';
const OG_IMAGE = 'https://toolnix.pro/og-image.png';

// ─── Helper: set or create a <meta> tag ─────────────────────────────────────
function setMeta(selector, attribute, value) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    // Parse out the attribute name/value from the selector
    const match = selector.match(/\[([^\]=]+)="([^"]+)"\]/);
    if (match) el.setAttribute(match[1], match[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attribute, value);
}

// ─── Helper: set or create a <link> tag ──────────────────────────────────────
function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// ─── Find tool + category from path ──────────────────────────────────────────
function findToolAndCategory(pathname) {
  for (const category of toolCategories) {
    const tool = category.tools.find(t => t.path === pathname);
    if (tool) return { tool, category };
  }
  return { tool: null, category: null };
}

function Layout({ children }) {
  const location = useLocation();
  const isToolPage = location.pathname.startsWith('/tools/');
  const { tool, category } = findToolAndCategory(location.pathname);
  const currentToolId = tool?.id || null;

  useEffect(() => {
    const canonicalUrl = `${BASE_URL}${location.pathname}`;

    if (isToolPage && tool) {
      const toolSeo = seoData[tool.id] || {};
      const pageTitle = toolSeo.metaTitle || `${tool.title} | ToolNix Free Online Tool`;
      const metaDesc = toolSeo.metaDescription || tool.description;
      const metaKeywords = toolSeo.keywords || tool.description;

      // ── Primary tags ──────────────────────────────────────────────────────
      document.title = pageTitle;
      setMeta('meta[name="description"]', 'content', metaDesc);
      setMeta('meta[name="keywords"]', 'content', metaKeywords);
      setMeta('meta[name="robots"]', 'content', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');

      // ── Canonical ─────────────────────────────────────────────────────────
      setLink('canonical', canonicalUrl);

      // ── Open Graph ────────────────────────────────────────────────────────
      setMeta('meta[property="og:type"]', 'content', 'website');
      setMeta('meta[property="og:url"]', 'content', canonicalUrl);
      setMeta('meta[property="og:title"]', 'content', pageTitle);
      setMeta('meta[property="og:description"]', 'content', metaDesc);
      setMeta('meta[property="og:image"]', 'content', OG_IMAGE);
      setMeta('meta[property="og:site_name"]', 'content', 'ToolNix');

      // ── Twitter Card ──────────────────────────────────────────────────────
      setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
      setMeta('meta[name="twitter:title"]', 'content', pageTitle);
      setMeta('meta[name="twitter:description"]', 'content', metaDesc);
      setMeta('meta[name="twitter:image"]', 'content', OG_IMAGE);
    } else {
      // ── Homepage defaults ──────────────────────────────────────────────────
      document.title = 'ToolNix - Free Online PDF, Image & Developer Tools';
      setMeta('meta[name="description"]', 'content', 'ToolNix offers 40+ free online tools. Convert PDF to Word, edit PDFs, remove backgrounds, compress images, generate QR codes, and more! 100% free with no registration required.');
      setMeta('meta[name="robots"]', 'content', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
      setLink('canonical', `${BASE_URL}/`);
      setMeta('meta[property="og:url"]', 'content', `${BASE_URL}/`);
      setMeta('meta[property="og:title"]', 'content', 'ToolNix - Free Online PDF, Image & Developer Tools');
      setMeta('meta[property="og:description"]', 'content', 'Convert, edit, and compress PDFs and Images online for free. 40+ premium tools without registration.');
      setMeta('meta[name="twitter:title"]', 'content', 'ToolNix - Free Online PDF, Image & Developer Tools');
      setMeta('meta[name="twitter:description"]', 'content', 'Convert, edit, and compress PDFs and Images online for free. 40+ premium tools without registration.');
    }

    // ── Dynamic JSON-LD Injection ──────────────────────────────────────────
    const existingSchema = document.getElementById('dynamic-json-ld');
    if (existingSchema) existingSchema.remove();

    if (isToolPage && tool && seoData[tool.id]?.article?.faqs) {
      const faqs = seoData[tool.id].article.faqs.items;
      const pageTitle = seoData[tool.id]?.metaTitle || `${tool.title} | ToolNix Free Online Tool`;
      const metaDesc = seoData[tool.id]?.metaDescription || tool.description;

      // 1. SoftwareApplication Schema
      const softwareSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: tool.title,
        operatingSystem: 'Any',
        applicationCategory: 'UtilitiesApplication',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: metaDesc,
        url: canonicalUrl,
      };

      // 2. FAQPage Schema
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      };

      // 3. BreadcrumbList Schema
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: category?.label || 'Tools', item: `${BASE_URL}/#${category?.id || 'tools'}` },
          { '@type': 'ListItem', position: 3, name: tool.title, item: canonicalUrl },
        ],
      };

      const schemaScript = document.createElement('script');
      schemaScript.id = 'dynamic-json-ld';
      schemaScript.type = 'application/ld+json';
      schemaScript.text = JSON.stringify([softwareSchema, faqSchema, breadcrumbSchema]);
      document.head.appendChild(schemaScript);
    }
  }, [location, isToolPage, tool, category]);

  return (
    <>
      <Navbar />
      {isToolPage && tool && category && (
        <Breadcrumb tool={tool} category={category} />
      )}
      {children}
      {isToolPage && currentToolId && <SeoArticle toolId={currentToolId} />}
      {isToolPage && <RelatedTools currentPath={location.pathname} />}
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />

        {/* PDF Conversion Tools */}
        <Route path="/tools/pdf-to-word"        element={<Layout><PdfToWord /></Layout>} />
        <Route path="/tools/word-to-pdf"        element={<Layout><WordToPdf /></Layout>} />
        <Route path="/tools/pdf-to-jpg"         element={<Layout><PdfToJpg /></Layout>} />
        <Route path="/tools/jpg-to-pdf"         element={<Layout><JpgToPdf /></Layout>} />
        <Route path="/tools/pdf-to-png"         element={<Layout><PdfToPng /></Layout>} />
        <Route path="/tools/png-to-pdf"         element={<Layout><PngToPdf /></Layout>} />
        <Route path="/tools/excel-to-pdf"       element={<Layout><ExcelToPdf /></Layout>} />
        <Route path="/tools/pdf-to-excel"       element={<Layout><PdfToExcel /></Layout>} />
        <Route path="/tools/powerpoint-to-pdf"  element={<Layout><PowerpointToPdf /></Layout>} />
        <Route path="/tools/pdf-to-powerpoint"  element={<Layout><PdfToPowerpoint /></Layout>} />
        <Route path="/tools/pdf-to-zip"         element={<Layout><PdfToZip /></Layout>} />

        {/* PDF Editing Tools */}
        <Route path="/tools/pdf-merge"          element={<Layout><PdfMerge /></Layout>} />
        <Route path="/tools/pdf-split"          element={<Layout><PdfSplit /></Layout>} />
        <Route path="/tools/pdf-compress"       element={<Layout><PdfCompress /></Layout>} />
        <Route path="/tools/pdf-page-extractor" element={<Layout><PdfPageExtractor /></Layout>} />
        <Route path="/tools/pdf-page-remover"   element={<Layout><PdfPageRemover /></Layout>} />
        <Route path="/tools/pdf-page-reorder"   element={<Layout><PdfPageReorder /></Layout>} />
        <Route path="/tools/pdf-rotate-pages"   element={<Layout><PdfRotatePages /></Layout>} />
        <Route path="/tools/add-page-numbers"   element={<Layout><PdfAddPageNumbers /></Layout>} />
        <Route path="/tools/pdf-watermark"      element={<Layout><PdfWatermarkTool /></Layout>} />
        <Route path="/tools/remove-watermark"   element={<Layout><PdfRemoveWatermark /></Layout>} />
        <Route path="/tools/protect-pdf"        element={<Layout><PdfProtect /></Layout>} />
        <Route path="/tools/edit-pdf"           element={<Layout><PdfEdit /></Layout>} />
        <Route path="/tools/sign-pdf"           element={<Layout><PdfSign /></Layout>} />
        <Route path="/tools/fill-forms"         element={<Layout><PdfFillForms /></Layout>} />
        <Route path="/tools/add-text"           element={<Layout><PdfAddText /></Layout>} />
        <Route path="/tools/add-image"          element={<Layout><PdfAddImage /></Layout>} />
        <Route path="/tools/annotate-pdf"       element={<Layout><PdfAnnotate /></Layout>} />
        <Route path="/tools/highlight-pdf"      element={<Layout><PdfHighlight /></Layout>} />
        <Route path="/tools/draw-pdf"           element={<Layout><PdfDraw /></Layout>} />
        <Route path="/tools/view-pdf"           element={<Layout><PdfViewerOnline /></Layout>} />
        <Route path="/tools/add-header-footer"  element={<Layout><PdfHeaderFooter /></Layout>} />

        {/* Image Tools */}
        <Route path="/tools/image-to-pdf"       element={<Layout><ImageToPdf /></Layout>} />
        <Route path="/tools/pdf-to-image"       element={<Layout><PdfToImage /></Layout>} />
        <Route path="/tools/ocr-image-to-text"  element={<Layout><OcrImageToText /></Layout>} />
        <Route path="/tools/screenshot-to-text" element={<Layout><ScreenshotToText /></Layout>} />
        <Route path="/tools/color-picker"       element={<Layout><ColorPicker /></Layout>} />
        <Route path="/tools/hex-to-rgb"         element={<Layout><HexToRgb /></Layout>} />
        <Route path="/tools/rgb-to-hex"         element={<Layout><RgbToHex /></Layout>} />
        <Route path="/tools/image-metadata"     element={<Layout><ImageMetadata /></Layout>} />
        <Route path="/tools/remove-exif"        element={<Layout><RemoveExif /></Layout>} />
        <Route path="/tools/qr-code-generator"  element={<Layout><QrCodeGenerator /></Layout>} />
        <Route path="/tools/bg-remover"         element={<Layout><BgRemover /></Layout>} />
        <Route path="/tools/image-compressor"   element={<Layout><ImageCompressor /></Layout>} />
        <Route path="/tools/image-to-svg"       element={<Layout><ImageToSvg /></Layout>} />
        <Route path="/tools/svg-to-image"       element={<Layout><SvgToImage /></Layout>} />
        <Route path="/tools/passport-maker"     element={<Layout><PassportPhotoMaker /></Layout>} />

        {/* Developer Tools */}
        <Route path="/tools/favicon-generator"  element={<Layout><FaviconGenerator /></Layout>} />

        {/* Blog */}
        <Route path="/blog" element={<Layout><BlogList /></Layout>} />
        <Route path="/blog/:slug" element={<Layout><BlogPost /></Layout>} />

        {/* 404 Catch-All */}
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
