import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';

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

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
