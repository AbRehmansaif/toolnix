import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Monitor, Smartphone, Apple, Globe, Download, Upload,
  ChevronRight, X, CheckCircle, Loader2, Copy, Check,
  Layers, Zap, Code2, Package, Image as ImageIcon, Plus, Info, Camera, Map, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import JSZip from 'jszip';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import '../../styles/ToolPage.css';
import '../../styles/FaviconGenerator.css';

// ── Icon size definitions ──────────────────────────────────────────────────────

const FAVICON_SIZES = [
  { size: 16, label: 'favicon-16', desc: 'Browser tab (tiny)', group: 'favicon' },
  { size: 32, label: 'favicon-32', desc: 'Browser tab (normal)', group: 'favicon' },
  { size: 48, label: 'favicon-48', desc: 'Windows site icon', group: 'favicon' },
  { size: 64, label: 'favicon-64', desc: 'Shortcut icon', group: 'favicon' },
];

const IOS_SIZES = [
  { size: 57, label: 'apple-touch-icon', desc: 'iPhone (non-retina)', group: 'ios' },
  { size: 60, label: 'apple-touch-icon-60', desc: 'iPhone (iOS 7+)', group: 'ios' },
  { size: 72, label: 'apple-touch-icon-72', desc: 'iPad (non-retina)', group: 'ios' },
  { size: 76, label: 'apple-touch-icon-76', desc: 'iPad (iOS 7)', group: 'ios' },
  { size: 114, label: 'apple-touch-icon-114', desc: 'iPhone retina', group: 'ios' },
  { size: 120, label: 'apple-touch-icon-120', desc: 'iPhone retina (iOS 7)', group: 'ios' },
  { size: 144, label: 'apple-touch-icon-144', desc: 'iPad retina', group: 'ios' },
  { size: 152, label: 'apple-touch-icon-152', desc: 'iPad retina (iOS 7)', group: 'ios' },
  { size: 180, label: 'apple-touch-icon-180', desc: 'iPhone 6 Plus', group: 'ios' },
];

const ANDROID_SIZES = [
  { size: 36, label: 'android-icon-36', desc: 'LDPI (0.75x)', group: 'android' },
  { size: 48, label: 'android-icon-48', desc: 'MDPI (1x)', group: 'android' },
  { size: 72, label: 'android-icon-72', desc: 'HDPI (1.5x)', group: 'android' },
  { size: 96, label: 'android-icon-96', desc: 'XHDPI (2x)', group: 'android' },
  { size: 144, label: 'android-icon-144', desc: 'XXHDPI (3x)', group: 'android' },
  { size: 192, label: 'android-icon-192', desc: 'XXXHDPI / PWA', group: 'android' },
  { size: 512, label: 'android-icon-512', desc: 'Play Store / PWA', group: 'android' },
];

const WINDOWS_SIZES = [
  { size: 70, label: 'ms-icon-70', desc: 'Small tile', group: 'windows' },
  { size: 144, label: 'ms-icon-144', desc: 'Medium tile', group: 'windows' },
  { size: 150, label: 'ms-icon-150', desc: 'Large tile', group: 'windows' },
  { size: 310, label: 'ms-icon-310', desc: 'Wide tile', group: 'windows' },
];

const MACOS_SIZES = [
  { size: 16, label: 'mac-icon-16', desc: '16×16', group: 'macos' },
  { size: 32, label: 'mac-icon-32', desc: '32×32', group: 'macos' },
  { size: 64, label: 'mac-icon-64', desc: '64×64', group: 'macos' },
  { size: 128, label: 'mac-icon-128', desc: '128×128', group: 'macos' },
  { size: 256, label: 'mac-icon-256', desc: '256×256', group: 'macos' },
  { size: 512, label: 'mac-icon-512', desc: '512×512', group: 'macos' },
  { size: 1024, label: 'mac-icon-1024', desc: '1024×1024 (App Store)', group: 'macos' },
];

const PWA_SIZES = [
  { size: 192, label: 'pwa-icon-192', desc: 'PWA icon (192)', group: 'pwa' },
  { size: 512, label: 'pwa-icon-512', desc: 'PWA icon (512)', group: 'pwa' },
];

const ALL_SIZES = [...FAVICON_SIZES, ...IOS_SIZES, ...ANDROID_SIZES, ...WINDOWS_SIZES, ...MACOS_SIZES, ...PWA_SIZES];

const GROUP_META = {
  favicon: { label: 'Website Favicon', icon: Globe, color: '#e54040', bg: '#fef2f2' },
  ios: { label: 'iOS / Apple', icon: Apple, color: '#1a1a2e', bg: '#f3f4f6' },
  android: { label: 'Android', icon: Smartphone, color: '#22c55e', bg: '#f0fdf4' },
  windows: { label: 'Windows / MS Edge', icon: Monitor, color: '#0078d4', bg: '#eff6ff' },
  macos: { label: 'macOS', icon: Monitor, color: '#6366f1', bg: '#eef2ff' },
  pwa: { label: 'PWA', icon: Zap, color: '#f59e0b', bg: '#fffbeb' },
};

// ── Helper: draw image onto canvas with custom settings ──────────────────────
async function drawIconToCanvas(imgSrc, size, options) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const { mode, bgColor, borderRadius, imageSize, brightness } = options;

  ctx.clearRect(0, 0, size, size);

  if (mode === 'bg') {
    ctx.fillStyle = bgColor || '#ffffff';
    if (borderRadius > 0) {
      // Draw rounded rect or circle (borderRadius is percentage: 0 to 50%)
      const r = (borderRadius / 100) * size;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(size - r, 0);
      ctx.quadraticCurveTo(size, 0, size, r);
      ctx.lineTo(size, size - r);
      ctx.quadraticCurveTo(size, size, size - r, size);
      ctx.lineTo(r, size);
      ctx.quadraticCurveTo(0, size, 0, size - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fill();
      ctx.clip();
    } else {
      ctx.fillRect(0, 0, size, size);
    }
  }

  // Determine drawing bounds based on size scale
  let drawSize = size;
  if (mode === 'bg') {
    drawSize = size * ((imageSize || 80) / 100);
  }
  const pad = (size - drawSize) / 2;

  // Apply brightness filter if specified
  if (mode === 'brightness' && brightness !== undefined) {
    ctx.filter = `brightness(${brightness}%)`;
  }

  // Draw image
  let img = imgSrc;
  if (typeof imgSrc === 'string') {
    img = new Image();
    img.src = imgSrc;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });
  }

  const imgAspect = img.width / img.height;
  let w = drawSize;
  let h = drawSize;
  if (imgAspect > 1) {
    h = drawSize / imgAspect;
  } else {
    w = drawSize * imgAspect;
  }
  const x = pad + (drawSize - w) / 2;
  const y = pad + (drawSize - h) / 2;

  ctx.drawImage(img, x, y, w, h);
  ctx.filter = 'none';

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png', 1.0);
  });
}

// ── HTML snippet generator ────────────────────────────────────────────────────
function buildHtmlSnippet({ msColor, hasDarkIcon, framework = 'html' }) {
  let prefix = '/favicons/';
  let rootPrefix = '/';

  if (framework === 'laravel') {
    prefix = `{{ asset('favicons/`;
    rootPrefix = `{{ asset('`;
  } else if (framework === 'django') {
    prefix = `{% static 'favicons/`;
    rootPrefix = `{% static '`;
  }

  const formatHref = (path, isRoot = false) => {
    if (framework === 'laravel') return isRoot ? `${rootPrefix}${path}') }}` : `${prefix}${path}') }}`;
    if (framework === 'django') return isRoot ? `${rootPrefix}${path}' %}` : `${prefix}${path}' %}`;
    return isRoot ? `/${path}` : `/favicons/${path}`;
  };

  const closeTag = (framework === 'react' || framework === 'vue') ? ' />' : '>';

  let faviconTags = '';
  if (hasDarkIcon) {
    faviconTags = `<!-- Favicon (Light/Dark themes) -->
<link rel="icon" type="image/png" sizes="32x32" href="${formatHref('favicon-32.png')}" media="(prefers-color-scheme: no-preference)"${closeTag}
<link rel="icon" type="image/png" sizes="32x32" href="${formatHref('favicon-32.png')}" media="(prefers-color-scheme: light)"${closeTag}
<link rel="icon" type="image/png" sizes="32x32" href="${formatHref('favicon-dark-32.png')}" media="(prefers-color-scheme: dark)"${closeTag}
<link rel="icon" type="image/png" sizes="16x16" href="${formatHref('favicon-16.png')}" media="(prefers-color-scheme: no-preference)"${closeTag}
<link rel="icon" type="image/png" sizes="16x16" href="${formatHref('favicon-16.png')}" media="(prefers-color-scheme: light)"${closeTag}
<link rel="icon" type="image/png" sizes="16x16" href="${formatHref('favicon-dark-16.png')}" media="(prefers-color-scheme: dark)"${closeTag}
<link rel="shortcut icon" href="${formatHref('favicon-32.png')}"${closeTag}`;
  } else {
    faviconTags = `<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="${formatHref('favicon-32.png')}"${closeTag}
<link rel="icon" type="image/png" sizes="16x16" href="${formatHref('favicon-16.png')}"${closeTag}
<link rel="shortcut icon" href="${formatHref('favicon-32.png')}"${closeTag}`;
  }

  let snippet = `${faviconTags}

<!-- iOS / Apple Touch Icons -->
<link rel="apple-touch-icon" sizes="180x180" href="${formatHref('apple-touch-icon-180.png')}"${closeTag}
<link rel="apple-touch-icon" sizes="152x152" href="${formatHref('apple-touch-icon-152.png')}"${closeTag}
<link rel="apple-touch-icon" sizes="120x120" href="${formatHref('apple-touch-icon-120.png')}"${closeTag}
<link rel="apple-touch-icon" sizes="76x76"   href="${formatHref('apple-touch-icon-76.png')}"${closeTag}

<!-- Android / Chrome -->
<link rel="manifest" href="${formatHref('manifest.json', true)}"${closeTag}
<meta name="theme-color" content="${msColor}"${closeTag}

<!-- Windows / Edge -->
<meta name="msapplication-TileColor" content="${msColor}"${closeTag}
<meta name="msapplication-TileImage" content="${formatHref('ms-icon-144.png')}"${closeTag}
<meta name="msapplication-config" content="${formatHref('browserconfig.xml', true)}"${closeTag}`;

  if (framework === 'react') {
    snippet = snippet.replace(/<!-- (.*?) -->/g, '{/* $1 */}');
    snippet = `import { Helmet } from 'react-helmet';\n\n<Helmet>\n${snippet.split('\n').map(line => '  ' + line).join('\n')}\n</Helmet>`;
  }

  return snippet;
}

function buildManifest(appName, shortName, themeColor, bgColor) {
  return JSON.stringify({
    name: appName || 'My WebSite',
    short_name: shortName || 'MySite',
    icons: [
      { src: '/favicons/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicons/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: themeColor || '#e54040',
    background_color: bgColor || '#ffffff',
    display: 'standalone',
  }, null, 2);
}

function buildBrowserConfig(msColor) {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="/favicons/ms-icon-70.png"/>
      <square150x150logo src="/favicons/ms-icon-150.png"/>
      <wide310x150logo src="/favicons/ms-icon-310.png"/>
      <square310x310logo src="/favicons/ms-icon-310.png"/>
      <TileColor>${msColor}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
}

function getContrastColor(hexColor) {
  if (!hexColor || hexColor === 'transparent') return '#000000';
  const hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  }
  return '#000000';
}


// ── Main Component ────────────────────────────────────────────────────────────
export default function FaviconGenerator() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | generating | done
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState({}); // { label: blobUrl }
  const [copied, setCopied] = useState(false);
  const [activePanel, setActivePanel] = useState('icons'); // icons | logo | snippet
  const [activeTab, setActiveTab] = useState('favicon');

  // --- Section 1: Classic and SVG favicons ---
  const [classicMode, setClassicMode] = useState('bg'); // 'as-is' | 'bg' | 'brightness'
  const [classicBgColor, setClassicBgColor] = useState('#ffffff');
  const [classicBorderRadius, setClassicBorderRadius] = useState(10); // in percent (0 - 50%)
  const [classicImageSize, setClassicImageSize] = useState(80); // percentage (50 - 100%)
  const [classicBrightness, setClassicBrightness] = useState(100); // 0 - 200%
  const [darkIconMode, setDarkIconMode] = useState('regular'); // 'regular' | 'custom'
  const [darkFile, setDarkFile] = useState(null);
  const [darkPreviewUrl, setDarkPreviewUrl] = useState(null);

  // --- Section 2: Apple Touch Icon ---
  const [appleMode, setAppleMode] = useState('bg'); // 'as-is' | 'bg'
  const [appleBgColor, setAppleBgColor] = useState('#ffffff');
  const [appleImageSize, setAppleImageSize] = useState(80);
  const [appleAppName, setAppleAppName] = useState('MyWebsite');
  const [appleSource, setAppleSource] = useState('main'); // 'main' | 'dedicated'
  const [appleFile, setAppleFile] = useState(null);
  const [applePreviewUrl, setApplePreviewUrl] = useState(null);

  // --- Section 3: Web app manifest ---
  const [androidMode, setAndroidMode] = useState('bg'); // 'as-is' | 'bg'
  const [androidBgColor, setAndroidBgColor] = useState('#ffffff');
  const [androidImageSize, setAndroidImageSize] = useState(80);
  const [manifestBgColor, setManifestBgColor] = useState('#ffffff');
  const [manifestThemeColor, setManifestThemeColor] = useState('#e54040');
  const [manifestName, setManifestName] = useState('MyWebSite');
  const [manifestShortName, setManifestShortName] = useState('MySite');
  const [androidSource, setAndroidSource] = useState('main'); // 'main' | 'dedicated'
  const [androidFile, setAndroidFile] = useState(null);
  const [androidPreviewUrl, setAndroidPreviewUrl] = useState(null);

  // --- Navbar logo preview strip states ---
  const [navbarBrandName, setNavbarBrandName] = useState('ToolNix');
  const [navbarPreset, setNavbarPreset] = useState(0);
  const [customNavbarBg, setCustomNavbarBg] = useState('#1e293b');
  const [customNavbarText, setCustomNavbarText] = useState('#ffffff');
  const [navbarLogoBg, setNavbarLogoBg] = useState('transparent'); // bg behind the logo icon itself
  const [navbarLogoShape, setNavbarLogoShape] = useState('rounded'); // 'none' | 'square' | 'rounded' | 'circle'

  const [snippetFramework, setSnippetFramework] = useState('html');

  // Crop states
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
  const imgRef = useRef(null);

  const inputRef = useRef();
  const darkInputRef = useRef();
  const appleInputRef = useRef();
  const androidInputRef = useRef();

  const handleFiles = (files) => {
    const f = files[0];
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setGenerated({});
    setStatus('idle');
    setIsCropping(true); // Automatically open cropper
    setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 }); // Provide default visible crop box
  };

  const handleDarkFile = (e) => {
    const f = e.target.files[0];
    if (!f || !f.type.startsWith('image/')) return;
    setDarkFile(f);
    setDarkPreviewUrl(URL.createObjectURL(f));
    setGenerated({});
    setStatus('idle');
  };

  const handleAppleFile = (e) => {
    const f = e.target.files[0];
    if (!f || !f.type.startsWith('image/')) return;
    setAppleFile(f);
    setApplePreviewUrl(URL.createObjectURL(f));
    setGenerated({});
    setStatus('idle');
  };

  const handleAndroidFile = (e) => {
    const f = e.target.files[0];
    if (!f || !f.type.startsWith('image/')) return;
    setAndroidFile(f);
    setAndroidPreviewUrl(URL.createObjectURL(f));
    setGenerated({});
    setStatus('idle');
  };

  const finishCrop = async () => {
    if (!crop || !crop.width || !crop.height || !imgRef.current) {
      setIsCropping(false);
      return;
    }
    const canvas = document.createElement('canvas');
    const image = imgRef.current;

    let cropPx = { x: 0, y: 0, width: 0, height: 0 };
    if (crop.unit === '%') {
      cropPx.x = (crop.x / 100) * image.naturalWidth;
      cropPx.y = (crop.y / 100) * image.naturalHeight;
      cropPx.width = (crop.width / 100) * image.naturalWidth;
      cropPx.height = (crop.height / 100) * image.naturalHeight;
    } else {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      cropPx.x = crop.x * scaleX;
      cropPx.y = crop.y * scaleY;
      cropPx.width = crop.width * scaleX;
      cropPx.height = crop.height * scaleY;
    }

    canvas.width = cropPx.width;
    canvas.height = cropPx.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      cropPx.x,
      cropPx.y,
      cropPx.width,
      cropPx.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
      setIsCropping(false);
      return;
    }

    const newUrl = URL.createObjectURL(blob);
    setPreviewUrl(newUrl);
    const newFile = new File([blob], file.name, { type: 'image/png' });
    setFile(newFile);
    setIsCropping(false);
  };

  // Generate all icons
  const generate = async () => {
    if (!file) return;
    setStatus('generating');
    setProgress(0);

    try {
      const results = {};

      // Determine size array (including dark icons if custom uploaded)
      const sizesList = [...ALL_SIZES];
      if (darkIconMode === 'custom' && darkPreviewUrl) {
        sizesList.push(
          { size: 16, label: 'favicon-dark-16', desc: 'Dark theme browser tab (tiny)', group: 'favicon' },
          { size: 32, label: 'favicon-dark-32', desc: 'Dark theme browser tab (normal)', group: 'favicon' }
        );
      }

      const total = sizesList.length;
      let done = 0;

      for (const def of sizesList) {
        // 1. Pick correct source image
        let currentSource = previewUrl;
        if (def.label.includes('dark')) {
          currentSource = darkPreviewUrl;
        } else if (def.group === 'ios') {
          currentSource = appleSource === 'dedicated' && applePreviewUrl ? applePreviewUrl : previewUrl;
        } else if (def.group === 'android' || def.group === 'pwa') {
          currentSource = androidSource === 'dedicated' && androidPreviewUrl ? androidPreviewUrl : previewUrl;
        }

        // 2. Build draw options
        let options = { mode: 'as-is', bgColor: '#ffffff', borderRadius: 0, imageSize: 80, brightness: 100 };

        if (def.group === 'favicon') {
          options = {
            mode: classicMode,
            bgColor: classicBgColor,
            borderRadius: classicBorderRadius,
            imageSize: classicImageSize,
            brightness: classicBrightness
          };
        } else if (def.group === 'ios') {
          options = {
            mode: appleMode,
            bgColor: appleBgColor,
            borderRadius: 0,
            imageSize: appleImageSize
          };
        } else if (def.group === 'android' || def.group === 'pwa') {
          options = {
            mode: androidMode,
            bgColor: androidBgColor,
            borderRadius: androidMode === 'bg' ? 50 : 0,
            imageSize: androidImageSize
          };
        } else if (def.group === 'windows') {
          options = {
            mode: androidMode,
            bgColor: androidBgColor,
            borderRadius: 0,
            imageSize: androidImageSize
          };
        }

        const blob = await drawIconToCanvas(currentSource, def.size, options);
        results[def.label] = URL.createObjectURL(blob);
        done++;
        setProgress(Math.round((done / total) * 100));
      }

      setGenerated(results);
      setStatus('done');
    } catch (e) {
      console.error(e);
      setStatus('idle');
      alert('Error generating icons: ' + e.message);
    }
  };

  // Download a single icon
  const downloadSingle = (label, url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download all as ZIP
  const downloadZip = async () => {
    if (!Object.keys(generated).length) return;
    const zip = new JSZip();
    const favFolder = zip.folder('favicons');

    // Add generated icons
    for (const label of Object.keys(generated)) {
      const url = generated[label];
      if (!url) continue;
      const resp = await fetch(url);
      const blob = await resp.blob();
      favFolder.file(`${label}.png`, blob);
    }

    // Add a favicon.ico renamed from favicon-32.png in the root for compatibility
    if (generated['favicon-32']) {
      const resp = await fetch(generated['favicon-32']);
      const blob = await resp.blob();
      zip.file('favicon.ico', blob);
    }

    // Add helper files
    const hasDarkIcon = (darkIconMode === 'custom' && darkPreviewUrl !== null);
    zip.file('html-snippet.html', buildHtmlSnippet({ msColor: manifestThemeColor, hasDarkIcon, framework: 'html' }));
    zip.file('manifest.json', buildManifest(manifestName, manifestShortName, manifestThemeColor, manifestBgColor));
    zip.file('browserconfig.xml', buildBrowserConfig(manifestThemeColor));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = 'favicon-package.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy HTML snippet
  const copySnippet = () => {
    const hasDarkIcon = (darkIconMode === 'custom' && darkPreviewUrl !== null);
    navigator.clipboard.writeText(buildHtmlSnippet({ msColor: manifestThemeColor, hasDarkIcon, framework: snippetFramework }));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getNavbarStyle = () => {
    let bg = '#ffffff';
    let color = '#0f172a';

    if (navbarPreset === -1) {
      bg = customNavbarBg;
      color = customNavbarText;
    } else {
      const presets = [
        { bg: '#0f172a', textColor: '#ffffff' }, // Dark Header
        { bg: '#ffffff', textColor: '#0f172a' }, // Light Header
        { bg: '#e54040', textColor: '#ffffff' }, // Brand Color
        { bg: 'linear-gradient(135deg,#667eea,#764ba2)', textColor: '#ffffff' }, // Gradient
        { bg: '#f1f5f9', textColor: '#334155' }, // Minimal Gray
      ];
      bg = presets[navbarPreset]?.bg || bg;
      color = presets[navbarPreset]?.textColor || color;
    }

    return {
      background: bg,
      color: color,
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    };
  };

  const downloadNavbarStrip = () => {
    let currentBg = '#ffffff';
    let currentText = '#000000';
    if (navbarPreset === -1) {
      currentBg = customNavbarBg;
      currentText = customNavbarText;
    } else {
      const presets = [
        { bg: '#0f172a', textColor: '#ffffff' },
        { bg: '#ffffff', textColor: '#0f172a' },
        { bg: '#e54040', textColor: '#ffffff' },
        { bg: 'linear-gradient(135deg,#667eea,#764ba2)', textColor: '#ffffff' },
        { bg: '#f1f5f9', textColor: '#334155' },
      ];
      currentBg = presets[navbarPreset]?.bg || currentBg;
      currentText = presets[navbarPreset]?.textColor || currentText;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // Background
    if (currentBg.startsWith('linear-gradient')) {
      const grd = ctx.createLinearGradient(0, 0, 640, 80);
      grd.addColorStop(0, '#667eea');
      grd.addColorStop(1, '#764ba2');
      ctx.fillStyle = grd;
    } else {
      ctx.fillStyle = currentBg;
    }
    ctx.fillRect(0, 0, 640, 80);

    const img = new Image();
    img.onload = () => {
      const boxSize = 48;
      const iconPad = 16;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = boxSize;
      tempCanvas.height = boxSize;
      const tempCtx = tempCanvas.getContext('2d');

      const drawOpts = {
        mode: classicMode,
        bgColor: classicBgColor,
        borderRadius: classicBorderRadius,
        imageSize: classicImageSize,
        brightness: classicBrightness
      };

      if (drawOpts.mode === 'bg') {
        tempCtx.fillStyle = drawOpts.bgColor || '#ffffff';
        if (drawOpts.borderRadius > 0) {
          const r = (drawOpts.borderRadius / 100) * boxSize;
          tempCtx.beginPath();
          tempCtx.moveTo(r, 0); tempCtx.lineTo(boxSize - r, 0);
          tempCtx.quadraticCurveTo(boxSize, 0, boxSize, r);
          tempCtx.lineTo(boxSize, boxSize - r);
          tempCtx.quadraticCurveTo(boxSize, boxSize, boxSize - r, boxSize);
          tempCtx.lineTo(r, boxSize);
          tempCtx.quadraticCurveTo(0, boxSize, 0, boxSize - r);
          tempCtx.lineTo(0, r);
          tempCtx.quadraticCurveTo(0, 0, r, 0);
          tempCtx.closePath();
          tempCtx.fill();
          tempCtx.clip();
        } else {
          tempCtx.fillRect(0, 0, boxSize, boxSize);
        }
      }

      let innerSize = boxSize;
      if (drawOpts.mode === 'bg') {
        innerSize = boxSize * (drawOpts.imageSize / 100);
      }
      const innerPad = (boxSize - innerSize) / 2;

      if (drawOpts.mode === 'brightness') {
        tempCtx.filter = `brightness(${drawOpts.brightness}%)`;
      }

      const imgAspect = img.width / img.height;
      let w = innerSize;
      let h = innerSize;
      if (imgAspect > 1) {
        h = innerSize / imgAspect;
      } else {
        w = innerSize * imgAspect;
      }
      const x = innerPad + (innerSize - w) / 2;
      const y = innerPad + (innerSize - h) / 2;

      tempCtx.drawImage(img, x, y, w, h);
      tempCtx.filter = 'none';

      ctx.drawImage(tempCanvas, iconPad, (80 - boxSize) / 2);

      if (navbarBrandName) {
        ctx.fillStyle = currentText;
        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.fillText(navbarBrandName, iconPad + boxSize + 14, 50);
      }

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'website-logo.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = previewUrl;
  };

  const grouped = {};
  for (const def of ALL_SIZES) {
    if (!grouped[def.group]) grouped[def.group] = [];
    grouped[def.group].push(def);
  }

  // Previews styling helpers (Live CSS Previews)
  const getRegularIconStyle = () => {
    if (classicMode === 'as-is') {
      return { width: '100%', height: '100%', objectFit: 'contain' };
    }
    if (classicMode === 'bg') {
      return {
        width: '100%', height: '100%', objectFit: 'contain',
        backgroundColor: classicBgColor,
        borderRadius: `${classicBorderRadius}%`,
        padding: `${(100 - classicImageSize) / 2}%`,
        boxSizing: 'border-box'
      };
    }
    if (classicMode === 'brightness') {
      return {
        width: '100%', height: '100%', objectFit: 'contain',
        filter: `brightness(${classicBrightness}%)`
      };
    }
    return {};
  };

  const getDarkIconStyle = () => {
    // Uses the same filters/colors from classic mode settings, but applies to the dark icon preview
    return getRegularIconStyle();
  };

  const getAppleIconStyle = () => {
    if (appleMode === 'as-is') {
      return { width: '100%', height: '100%', objectFit: 'contain' };
    }
    return {
      width: '100%', height: '100%', objectFit: 'contain',
      backgroundColor: appleBgColor,
      padding: `${(100 - appleImageSize) / 2}%`,
      boxSizing: 'border-box'
    };
  };

  const getAndroidIconStyle = () => {
    if (androidMode === 'as-is') {
      return { width: '100%', height: '100%', objectFit: 'contain' };
    }
    return {
      width: '100%', height: '100%', objectFit: 'contain',
      backgroundColor: androidBgColor,
      padding: `${(100 - androidImageSize) / 2}%`,
      boxSizing: 'border-box'
    };
  };

  const darkIconUrl = (darkIconMode === 'custom' && darkPreviewUrl) ? darkPreviewUrl : previewUrl;
  const appleIconUrl = (appleSource === 'dedicated' && applePreviewUrl) ? applePreviewUrl : previewUrl;
  const androidIconUrl = (androidSource === 'dedicated' && androidPreviewUrl) ? androidPreviewUrl : previewUrl;

  const hasDarkIcon = (darkIconMode === 'custom' && darkPreviewUrl !== null);
  const htmlSnippetOutput = buildHtmlSnippet({ msColor: manifestThemeColor, hasDarkIcon, framework: snippetFramework });

  return (
    <div className="tool-page">
      {/* Breadcrumb */}
      <div className="tool-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <Link to="/#developer-tools">Developer Tools</Link>
        <ChevronRight size={14} className="tool-breadcrumb-sep" />
        <span className="tool-breadcrumb-current">Favicon & Icon Generator</span>
      </div>

      {/* Header */}
      <div className="tool-header">
        <div className="tool-header-inner">
          <div className="tool-header-icon" style={{ background: 'linear-gradient(135deg,#fef2f2,#ffe4e6)' }}>
            <Layers size={36} color="#e54040" strokeWidth={1.6} />
          </div>
          <div className="tool-header-content">
            <div className="tool-header-title">Favicon & App Icon Generator</div>
            <div className="tool-header-desc">
              Upload any image and instantly generate a complete icon package — website favicons, iOS, Android, macOS, Windows tiles, PWA icons, and website logo strip. Download everything as a ready-to-use ZIP.
            </div>
            <div className="info-chips" style={{ marginTop: 16 }}>
              <span className="info-chip">✓ 35+ Icon Sizes</span>
              <span className="info-chip">✓ iOS / Android / Windows / macOS</span>
              <span className="info-chip">✓ PWA Ready</span>
              <span className="info-chip">✓ HTML Snippet</span>
              <span className="info-chip">✓ ZIP Package</span>
              <span className="info-chip">✓ 100% Offline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="tool-main" style={{ gridTemplateColumns: '1fr' }}>

        {/* Upload zone */}
        {!file ? (
          <div
            className={`upload-zone${drag ? ' dragover' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
            <div className="upload-zone-icon">
              <Layers size={32} color="#e54040" />
            </div>
            <div className="upload-zone-title">Drop your logo / image here</div>
            <div className="upload-zone-sub">PNG, SVG, JPG, WebP — best results with a square PNG with transparent background</div>
            <div className="upload-zone-btn" style={{ background: 'linear-gradient(135deg,#e54040,#c0392b)' }}>
              <Upload size={14} /> Select Image
            </div>
          </div>
        ) : isCropping ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Crop / Trim Your Logo</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
              Drag a box to trim excess whitespace around your logo. We will automatically center it perfectly inside your favicons!
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, display: 'inline-block', maxWidth: '100%', marginBottom: 20, border: '1px dashed #cbd5e1' }}>
              <ReactCrop
                crop={crop}
                onChange={(c, percentCrop) => setCrop(percentCrop)}
              >
                <img ref={imgRef} src={previewUrl} alt="Crop preview" style={{ maxHeight: '60vh', maxWidth: '100%' }} />
              </ReactCrop>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 10 }}>
              <button
                onClick={() => setIsCropping(false)}
                style={{ padding: '12px 28px', borderRadius: 10, background: '#f1f5f9', color: '#475569', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 14 }}
              >
                Skip Cropping
              </button>
              <button
                onClick={finishCrop}
                style={{ padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#e54040,#c0392b)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(229,64,64,0.3)', fontSize: 14 }}
              >
                Confirm Crop
              </button>
            </div>
          </div>
        ) : (
          <div className="tool-main-layout">
            {/* Image preview bar */}
            <div className="fav-preview-bar">
              <div className="fav-preview-thumb-wrap">
                <img src={previewUrl} alt="Source" className="fav-preview-thumb" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 4 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB</div>
                {status === 'done' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <CheckCircle size={14} color="#22c55e" />
                    <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Icons generated successfully</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setGenerated({});
                  setStatus('idle');
                  setDarkFile(null);
                  setDarkPreviewUrl(null);
                  setAppleFile(null);
                  setApplePreviewUrl(null);
                  setAndroidFile(null);
                  setAndroidPreviewUrl(null);
                }}
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            {/* ── Section 1: Classic and SVG favicons ── */}
            <div className="favicon-section-card">
              <div className="favicon-section-title">
                <Globe size={18} color="#e54040" /> Classic and SVG favicons
              </div>
              <div className="favicon-grid-2col">
                {/* Previews */}
                <div className="preview-container">
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Browser Preview</div>
                  <div className="browser-mockup-wrapper">
                    {/* Light theme */}
                    <div className="browser-mockup light">
                      <div className="browser-tab-bar">
                        <div className="browser-tab active">
                          <img src={previewUrl} style={getRegularIconStyle()} className="browser-tab-icon" alt="Favicon" />
                          <span className="browser-tab-title">{navbarBrandName}</span>
                          <span className="browser-tab-close">×</span>
                        </div>
                        <div className="browser-plus-btn">+</div>
                      </div>
                      <div className="browser-content-area"></div>
                    </div>
                    {/* Dark theme */}
                    <div className="browser-mockup dark">
                      <div className="browser-tab-bar">
                        <div className="browser-tab active">
                          <img src={darkIconUrl} style={getDarkIconStyle()} className="browser-tab-icon" alt="Favicon" />
                          <span className="browser-tab-title">{navbarBrandName}</span>
                          <span className="browser-tab-close">×</span>
                        </div>
                        <div className="browser-plus-btn">+</div>
                      </div>
                      <div className="browser-content-area"></div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginTop: 12 }}>Google Result Page Preview</div>
                  <div className="google-mockup-wrapper">
                    {/* Light theme */}
                    <div className="google-mockup light">
                      <div className="google-header">
                        <div className="google-favicon-circle">
                          <img src={previewUrl} style={getRegularIconStyle()} className="google-favicon" alt="Favicon" />
                        </div>
                        <div className="google-meta">
                          <span className="google-source-name">Example</span>
                          <span className="google-url">https://example.com</span>
                        </div>
                      </div>
                      <div className="google-title">{navbarBrandName}</div>
                      <div className="google-snippet">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea...
                      </div>
                    </div>
                    {/* Dark theme */}
                    <div className="google-mockup dark">
                      <div className="google-header">
                        <div className="google-favicon-circle">
                          <img src={darkIconUrl} style={getDarkIconStyle()} className="google-favicon" alt="Favicon" />
                        </div>
                        <div className="google-meta">
                          <span className="google-source-name">Example</span>
                          <span className="google-url">https://example.com</span>
                        </div>
                      </div>
                      <div className="google-title">{navbarBrandName}</div>
                      <div className="google-snippet">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea...
                      </div>
                    </div>
                  </div>

                  {/* ── Logo Variant Previews ── */}
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginTop: 12, marginBottom: 8 }}>Logo Icon Previews</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                    {[
                      { bg: '#ffffff', border: '1px solid #e2e8f0', label: 'Light', shadow: '0 2px 8px rgba(0,0,0,0.06)' },
                      { bg: '#0f172a', border: '1px solid #1e293b', label: 'Dark', shadow: '0 2px 8px rgba(0,0,0,0.25)' },
                      { bg: navbarLogoBg === 'transparent' ? 'repeating-conic-gradient(#e2e8f0 0% 25%, transparent 0% 50%) 0 0 / 10px 10px' : navbarLogoBg, border: '1px solid #e2e8f0', label: 'Custom', shadow: '0 2px 8px rgba(0,0,0,0.08)' },
                      { bg: 'repeating-conic-gradient(#e2e8f0 0% 25%, transparent 0% 50%) 0 0 / 10px 10px', border: '1px dashed #cbd5e1', label: 'No BG', shadow: 'none' },
                    ].map(({ bg, border, label, shadow }) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <div style={{
                          width: 54, height: 54, background: bg, border,
                          borderRadius: navbarLogoShape === 'circle' ? '50%' : navbarLogoShape === 'rounded' ? '12px' : navbarLogoShape === 'square' ? '4px' : '0',
                          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: shadow, flexShrink: 0,
                        }}>
                          <img src={previewUrl} style={getRegularIconStyle()} alt={label} />
                        </div>
                        <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{label}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Horizontal Logo</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {[
                      { bg: '#ffffff', textColor: '#0f172a', border: '1px solid #e2e8f0', label: 'Light' },
                      { bg: '#0f172a', textColor: '#ffffff', border: '1px solid #1e293b', label: 'Dark' },
                    ].map(({ bg, textColor, border, label }) => (
                      <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: bg, border, borderRadius: 8, padding: '8px 12px', minWidth: 0 }}>
                        <div style={{
                          width: 26, height: 26, flexShrink: 0,
                          background: navbarLogoBg === 'transparent' ? 'transparent' : navbarLogoBg,
                          borderRadius: navbarLogoShape === 'circle' ? '50%' : navbarLogoShape === 'rounded' ? '6px' : navbarLogoShape === 'square' ? '3px' : '0',
                          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <img src={previewUrl} style={getRegularIconStyle()} alt="Logo" />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{navbarBrandName}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Stacked Logo</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {[
                      { bg: '#ffffff', textColor: '#0f172a', border: '1px solid #e2e8f0' },
                      { bg: '#0f172a', textColor: '#ffffff', border: '1px solid #1e293b' },
                    ].map(({ bg, textColor, border }, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: bg, border, borderRadius: 8, padding: '10px 8px', minWidth: 0 }}>
                        <div style={{
                          width: 36, height: 36,
                          background: navbarLogoBg === 'transparent' ? 'transparent' : navbarLogoBg,
                          borderRadius: navbarLogoShape === 'circle' ? '50%' : navbarLogoShape === 'rounded' ? '8px' : navbarLogoShape === 'square' ? '4px' : '0',
                          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <img src={previewUrl} style={getRegularIconStyle()} alt="Logo" />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 10, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{navbarBrandName}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Navbar Strip</div>
                  <div style={getNavbarStyle()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, flexShrink: 0,
                        background: navbarLogoBg === 'transparent' ? 'transparent' : navbarLogoBg,
                        borderRadius: navbarLogoShape === 'circle' ? '50%' : navbarLogoShape === 'rounded' ? '6px' : navbarLogoShape === 'square' ? '3px' : '0',
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <img src={previewUrl} style={getRegularIconStyle()} alt="Logo" />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{navbarBrandName}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 500, opacity: 0.8 }}>
                      <span>Home</span>
                      <span>Tools</span>
                      <span>Pricing</span>
                    </div>
                  </div>
                  <button className="custom-btn-outline" style={{ marginTop: 8, alignSelf: 'flex-start' }} onClick={downloadNavbarStrip}>
                    <Download size={12} /> Download Navbar Strip (PNG)
                  </button>
                </div>

                {/* Settings */}
                <div className="settings-container">
                  {/* Regular Icon */}
                  <div className="settings-card">
                    <div className="settings-card-title">Regular icon</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                      The regular icon is displayed in most situations.
                    </div>
                    <div className="settings-option-group">
                      <label className="settings-radio-label">
                        <input type="radio" name="classicMode" checked={classicMode === 'as-is'} onChange={() => setClassicMode('as-is')} />
                        Use the icon as is
                      </label>

                      <label className="settings-radio-label">
                        <input type="radio" name="classicMode" checked={classicMode === 'bg'} onChange={() => setClassicMode('bg')} />
                        Add a plain background and margins
                      </label>
                      {classicMode === 'bg' && (
                        <div className="settings-nested-controls">
                          <div className="settings-slider-control">
                            <div className="settings-slider-label">Corners radius <span>{classicBorderRadius}%</span></div>
                            <input type="range" min="0" max="50" value={classicBorderRadius} onChange={e => setClassicBorderRadius(parseInt(e.target.value))} />
                          </div>
                          <div className="settings-slider-control">
                            <div className="settings-slider-label">Background Color</div>
                            <div className="color-picker-row">
                              <div className="color-input-badge">
                                <input type="color" value={classicBgColor} onChange={e => setClassicBgColor(e.target.value)} />
                              </div>
                              <input type="text" className="color-text-input" value={classicBgColor} onChange={e => setClassicBgColor(e.target.value)} />
                            </div>
                          </div>
                          <div className="settings-slider-control">
                            <div className="settings-slider-label">Image size <span>{classicImageSize}%</span></div>
                            <input type="range" min="50" max="100" value={classicImageSize} onChange={e => setClassicImageSize(parseInt(e.target.value))} />
                          </div>
                        </div>
                      )}

                      <label className="settings-radio-label">
                        <input type="radio" name="classicMode" checked={classicMode === 'brightness'} onChange={() => setClassicMode('brightness')} />
                        Change brightness
                      </label>
                      {classicMode === 'brightness' && (
                        <div className="settings-nested-controls">
                          <div className="settings-slider-control">
                            <div className="settings-slider-label">Brightness <span>{classicBrightness}%</span></div>
                            <input type="range" min="0" max="200" value={classicBrightness} onChange={e => setClassicBrightness(parseInt(e.target.value))} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dark Icon */}
                  <div className="settings-card">
                    <div className="settings-card-title">Dark icon</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                      Define a dark icon if you want your favicon to be different in dark themes.
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className={`custom-btn-outline${darkIconMode === 'regular' ? ' active' : ''}`} onClick={() => setDarkIconMode('regular')}>
                        Start from the regular icon
                      </button>
                      <button className={`custom-btn-outline${darkIconMode === 'custom' ? ' active' : ''}`} onClick={() => { setDarkIconMode('custom'); darkInputRef.current?.click(); }}>
                        Use another icon
                      </button>
                      <input ref={darkInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleDarkFile} />
                    </div>
                    {darkIconMode === 'custom' && darkFile && (
                      <div style={{ marginTop: 10, fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={12} /> Custom dark icon: {darkFile.name}
                      </div>
                    )}
                  </div>

                  {/* Navbar / Logo settings card */}
                  <div className="settings-card">
                    <div className="settings-card-title">Logo &amp; Navbar Settings</div>

                    {/* Brand Name */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>App / Brand Name</label>
                      <input
                        type="text"
                        className="tool-input"
                        style={{ width: '100%', padding: '8px 10px', fontSize: 12 }}
                        value={navbarBrandName}
                        onChange={e => setNavbarBrandName(e.target.value)}
                        placeholder="e.g. ToolNix"
                      />
                    </div>

                    {/* Logo icon background — for transparent images */}
                    <div style={{ marginBottom: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px' }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#166534', display: 'block', marginBottom: 4 }}>Logo Icon Background <span style={{ fontWeight: 400, color: '#4ade80' }}>(for transparent images)</span></label>
                      <div style={{ fontSize: 11, color: '#16a34a', marginBottom: 10 }}>If your logo has no background, set a fill color here so it's visible on any surface.</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="color-input-badge" style={{ width: 36, height: 36 }}>
                          <input type="color" value={navbarLogoBg === 'transparent' ? '#ffffff' : navbarLogoBg}
                            onChange={e => setNavbarLogoBg(e.target.value)} />
                        </div>
                        <input type="text" className="color-text-input" value={navbarLogoBg}
                          onChange={e => setNavbarLogoBg(e.target.value)} style={{ flex: 1, maxWidth: 120 }} />
                        <button
                          onClick={() => setNavbarLogoBg('transparent')}
                          style={{ padding: '5px 10px', fontSize: 10, fontWeight: 600, borderRadius: 6, border: navbarLogoBg === 'transparent' ? '2px solid #22c55e' : '1px solid #e2e8f0', background: navbarLogoBg === 'transparent' ? '#f0fdf4' : '#fff', color: navbarLogoBg === 'transparent' ? '#16a34a' : '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Transparent
                        </button>
                      </div>
                    </div>

                    {/* Logo shape */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 8 }}>Logo Icon Shape</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[
                          { key: 'none', label: 'None' },
                          { key: 'square', label: 'Square' },
                          { key: 'rounded', label: 'Rounded' },
                          { key: 'circle', label: 'Circle' },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setNavbarLogoShape(key)}
                            style={{
                              flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 10, fontWeight: 600,
                              cursor: 'pointer',
                              border: navbarLogoShape === key ? '2px solid #e54040' : '1px solid #e2e8f0',
                              background: navbarLogoShape === key ? '#fff0f0' : '#fff',
                              color: navbarLogoShape === key ? '#e54040' : '#475569',
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Navbar background preset */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 8 }}>Navbar Background Style</label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {[
                          { label: 'Dark Header' },
                          { label: 'Light Header' },
                          { label: 'Brand Color' },
                          { label: 'Gradient' },
                          { label: 'Minimal Gray' }
                        ].map((p, i) => (
                          <button
                            key={i}
                            onClick={() => setNavbarPreset(i)}
                            style={{
                              padding: '5px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                              border: navbarPreset === i ? '2px solid #e54040' : '1px solid #e2e8f0',
                              background: navbarPreset === i ? '#fff0f0' : '#fff',
                              color: navbarPreset === i ? '#e54040' : '#475569',
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setNavbarPreset(-1)}
                          style={{
                            padding: '5px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                            border: navbarPreset === -1 ? '2px solid #e54040' : '1px solid #e2e8f0',
                            background: navbarPreset === -1 ? '#fff0f0' : '#fff',
                            color: navbarPreset === -1 ? '#e54040' : '#475569',
                          }}
                        >
                          Custom Colors
                        </button>
                      </div>

                      {navbarPreset === -1 && (
                        <div style={{ display: 'flex', gap: 10, background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <div>
                            <label style={{ fontSize: 9, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Background</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input type="color" value={customNavbarBg} onChange={e => setCustomNavbarBg(e.target.value)} style={{ width: 22, height: 22, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }} />
                              <input type="text" value={customNavbarBg} onChange={e => setCustomNavbarBg(e.target.value)} className="tool-input" style={{ width: 70, padding: '2px 4px', fontSize: 10 }} />
                            </div>
                          </div>
                          <div>
                            <label style={{ fontSize: 9, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Text Color</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input type="color" value={customNavbarText} onChange={e => setCustomNavbarText(e.target.value)} style={{ width: 22, height: 22, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }} />
                              <input type="text" value={customNavbarText} onChange={e => setCustomNavbarText(e.target.value)} className="tool-input" style={{ width: 70, padding: '2px 4px', fontSize: 10 }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 2: Apple Touch Icon ── */}
            <div className="favicon-section-card">
              <div className="favicon-section-title">
                <Apple size={18} color="#0f172a" /> Apple Touch Icon
              </div>
              <div className="favicon-grid-2col">
                {/* Previews */}
                <div className="preview-container">
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>iOS Home Screen Preview</div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className="device-frame">
                      <div className="device-notch"></div>
                      <div className="device-screen" style={{ backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                        <div className="app-grid">
                          <div className="app-icon-wrapper">
                            <div className="ios-app-icon" style={{ background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)' }}>
                              <Camera size={20} color="#475569" />
                            </div>
                            <span className="app-label">Camera</span>
                          </div>
                          <div className="app-icon-wrapper">
                            <div className="ios-app-icon" style={{ background: 'linear-gradient(135deg, #eff6ff, #bfdbfe)' }}>
                              <Map size={20} color="#1d4ed8" />
                            </div>
                            <span className="app-label">Maps</span>
                          </div>
                          <div className="app-icon-wrapper">
                            <div className="ios-app-icon" style={{ background: 'linear-gradient(135deg, #fffbeb, #fde68a)' }}>
                              <FileText size={20} color="#d97706" />
                            </div>
                            <span className="app-label">Notes</span>
                          </div>
                          <div className="app-icon-wrapper">
                            <div className="ios-app-icon" style={{ borderRadius: '22%' }}>
                              <img src={appleIconUrl} style={getAppleIconStyle()} alt="App Icon" />
                            </div>
                            <span className="app-label">{appleAppName || 'MyWebsite'}</span>
                          </div>
                        </div>
                        <div></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="settings-container">
                  <div className="settings-card">
                    <div className="settings-option-group">
                      <label className="settings-radio-label">
                        <input type="radio" name="appleMode" checked={appleMode === 'as-is'} onChange={() => setAppleMode('as-is')} />
                        Use the icon as is
                      </label>
                      <label className="settings-radio-label">
                        <input type="radio" name="appleMode" checked={appleMode === 'bg'} onChange={() => setAppleMode('bg')} />
                        Add a plain background and margins
                      </label>

                      {appleMode === 'bg' && (
                        <div className="settings-nested-controls">
                          <div className="settings-slider-control">
                            <div className="settings-slider-label">Background Color</div>
                            <div className="color-picker-row">
                              <div className="color-input-badge">
                                <input type="color" value={appleBgColor} onChange={e => setAppleBgColor(e.target.value)} />
                              </div>
                              <input type="text" className="color-text-input" value={appleBgColor} onChange={e => setAppleBgColor(e.target.value)} />
                            </div>
                          </div>
                          <div className="settings-slider-control">
                            <div className="settings-slider-label">Image size <span>{appleImageSize}%</span></div>
                            <input type="range" min="50" max="100" value={appleImageSize} onChange={e => setAppleImageSize(parseInt(e.target.value))} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>App name</label>
                      <input type="text" className="tool-input" style={{ width: '100%', padding: '10px' }} value={appleAppName} onChange={e => setAppleAppName(e.target.value)} placeholder="MyWebsite" />
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>If empty, iOS will use the page title</div>
                    </div>

                    <div className="settings-option-group" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                      <label className="settings-radio-label">
                        <input type="radio" name="appleSource" checked={appleSource === 'main'} onChange={() => setAppleSource('main')} />
                        Use the main icon
                      </label>
                      <label className="settings-radio-label">
                        <input type="radio" name="appleSource" checked={appleSource === 'dedicated'} onChange={() => { setAppleSource('dedicated'); appleInputRef.current?.click(); }} />
                        Use a dedicated icon
                      </label>
                      <input ref={appleInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAppleFile} />
                      {appleSource === 'dedicated' && (
                        <button className="custom-btn-outline" onClick={() => appleInputRef.current?.click()}>Pick icon</button>
                      )}
                      {appleSource === 'dedicated' && appleFile && (
                        <div style={{ fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={12} /> Dedicated icon: {appleFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 3: Web app manifest ── */}
            <div className="favicon-section-card">
              <div className="favicon-section-title">
                <Smartphone size={18} color="#22c55e" /> Web app manifest
              </div>
              <div className="favicon-grid-2col">
                {/* Previews */}
                <div className="preview-container">
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Android previews (Home, Splash, Switch)</div>
                  <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10 }}>
                    {/* Home screen */}
                    <div className="device-frame" style={{ flexShrink: 0 }}>
                      <div className="device-notch"></div>
                      <div className="device-screen" style={{ backgroundImage: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
                        <div className="app-grid">
                          <div className="app-icon-wrapper">
                            <div className="android-app-icon" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: 18 }}>✉️</span>
                            </div>
                            <span className="app-label">Gmail</span>
                          </div>
                          <div className="app-icon-wrapper">
                            <div className="android-app-icon" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: 18 }}>🔺</span>
                            </div>
                            <span className="app-label">Drive</span>
                          </div>
                          <div className="app-icon-wrapper">
                            <div className="android-app-icon" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: 18 }}>📍</span>
                            </div>
                            <span className="app-label">Maps</span>
                          </div>
                          <div className="app-icon-wrapper">
                            <div className="android-app-icon">
                              <img src={androidIconUrl} style={getAndroidIconStyle()} alt="Android Icon" />
                            </div>
                            <span className="app-label">{manifestShortName || 'MySite'}</span>
                          </div>
                        </div>
                        <div></div>
                      </div>
                    </div>

                    {/* Splash Screen */}
                    <div className="device-frame" style={{ flexShrink: 0 }}>
                      <div className="device-notch"></div>
                      <div className="device-screen" style={{ backgroundColor: manifestBgColor, padding: '24px 12px' }}>
                        <div className="splash-preview">
                          <div className="splash-icon" style={{ backgroundColor: androidBgColor }}>
                            <img src={androidIconUrl} style={getAndroidIconStyle()} alt="Splash icon" />
                          </div>
                          <div className="splash-title" style={{ color: getContrastColor(manifestBgColor) }}>
                            {manifestName || 'MyWebSite'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Task Switcher */}
                    <div className="device-frame" style={{ flexShrink: 0 }}>
                      <div className="device-notch"></div>
                      <div className="device-screen" style={{ backgroundColor: '#18181b' }}>
                        <div className="android-switch-wrapper">
                          <div className="android-switch-card">
                            <div className="android-switch-header">
                              <div className="android-switch-badge">
                                <img src={androidIconUrl} style={getAndroidIconStyle()} alt="Switcher Icon" />
                              </div>
                              <span style={{ color: '#fff', fontSize: 10, flex: 1, marginLeft: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {manifestShortName || 'MySite'}
                              </span>
                              <span style={{ color: '#a1a1aa', fontSize: 10 }}>🔗</span>
                            </div>
                            <div className="android-switch-body">
                              <span style={{ color: '#3f3f46', fontSize: 9 }}>Card Preview</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="settings-container">
                  <div className="settings-card">
                    <div className="settings-option-group">
                      <label className="settings-radio-label">
                        <input type="radio" name="androidMode" checked={androidMode === 'as-is'} onChange={() => setAndroidMode('as-is')} />
                        Use the icon as is
                      </label>
                      <label className="settings-radio-label">
                        <input type="radio" name="androidMode" checked={androidMode === 'bg'} onChange={() => setAndroidMode('bg')} />
                        Add a plain background and margins
                      </label>

                      {androidMode === 'bg' && (
                        <div className="settings-nested-controls">
                          <div className="settings-slider-control">
                            <div className="settings-slider-label">Background Color</div>
                            <div className="color-picker-row">
                              <div className="color-input-badge">
                                <input type="color" value={androidBgColor} onChange={e => setAndroidBgColor(e.target.value)} />
                              </div>
                              <input type="text" className="color-text-input" value={androidBgColor} onChange={e => setAndroidBgColor(e.target.value)} />
                            </div>
                          </div>
                          <div className="settings-slider-control">
                            <div className="settings-slider-label">Image size <span>{androidImageSize}%</span></div>
                            <input type="range" min="50" max="100" value={androidImageSize} onChange={e => setAndroidImageSize(parseInt(e.target.value))} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                      <div className="settings-slider-control">
                        <div className="settings-slider-label">Background color</div>
                        <div className="color-picker-row">
                          <div className="color-input-badge">
                            <input type="color" value={manifestBgColor} onChange={e => setManifestBgColor(e.target.value)} />
                          </div>
                          <input type="text" className="color-text-input" value={manifestBgColor} onChange={e => setManifestBgColor(e.target.value)} />
                        </div>
                      </div>
                      <div className="settings-slider-control">
                        <div className="settings-slider-label">Theme color</div>
                        <div className="color-picker-row">
                          <div className="color-input-badge">
                            <input type="color" value={manifestThemeColor} onChange={e => setManifestThemeColor(e.target.value)} />
                          </div>
                          <input type="text" className="color-text-input" value={manifestThemeColor} onChange={e => setManifestThemeColor(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Name</label>
                        <input type="text" className="tool-input" style={{ width: '100%', padding: '10px' }} value={manifestName} onChange={e => setManifestName(e.target.value)} placeholder="MyWebSite" />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Short name</label>
                        <input type="text" className="tool-input" style={{ width: '100%', padding: '10px' }} value={manifestShortName} onChange={e => setManifestShortName(e.target.value)} placeholder="MySite" />
                      </div>
                    </div>

                    <div className="settings-option-group" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                      <label className="settings-radio-label">
                        <input type="radio" name="androidSource" checked={androidSource === 'main'} onChange={() => setAndroidSource('main')} />
                        Use the main icon
                      </label>
                      <label className="settings-radio-label">
                        <input type="radio" name="androidSource" checked={androidSource === 'dedicated'} onChange={() => { setAndroidSource('dedicated'); androidInputRef.current?.click(); }} />
                        Use a dedicated icon
                      </label>
                      <input ref={androidInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAndroidFile} />
                      {androidSource === 'dedicated' && (
                        <button className="custom-btn-outline" onClick={() => androidInputRef.current?.click()}>Pick icon</button>
                      )}
                      {androidSource === 'dedicated' && androidFile && (
                        <div style={{ fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={12} /> Dedicated icon: {androidFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Generate Action Area ── */}
            <div className="favicon-section-card" style={{ background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#475569', textAlign: 'center' }}>
                Ready to generate your custom favicon package containing all {ALL_SIZES.length} sizes?
              </div>

              {/* Progress bar */}
              {status === 'generating' && (
                <div className="progress-wrap" style={{ width: '100%', maxWidth: 400 }}>
                  <div className="progress-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Loader2 size={14} className="animate-spin" /> Generating...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#e54040,#f97316)' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  className="tool-action-btn"
                  style={{ background: 'linear-gradient(135deg,#e54040,#c0392b)', marginTop: 0, padding: '12px 28px' }}
                  disabled={!file || status === 'generating'}
                  onClick={generate}
                >
                  {status === 'generating' ? (
                    <><Loader2 className="animate-spin" size={18} /> Generating...</>
                  ) : (
                    <><Layers size={18} /> Generate All Icons</>
                  )}
                </button>

                {status === 'done' && (
                  <button
                    className="download-btn"
                    style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', padding: '12px 28px' }}
                    onClick={downloadZip}
                  >
                    <Package size={16} /> Download ZIP Package
                  </button>
                )}
              </div>
            </div>

            {/* ── Tabs for generated content ── */}
            {status === 'done' && (
              <>
                <div className="fav-panel-tabs">
                  <button className={`fav-panel-tab${activePanel === 'icons' ? ' active' : ''}`} onClick={() => setActivePanel('icons')}>
                    <Layers size={14} /> All Generated Icons
                  </button>
                  <button className={`fav-panel-tab${activePanel === 'snippet' ? ' active' : ''}`} onClick={() => setActivePanel('snippet')}>
                    <Code2 size={14} /> HTML Snippets & Configs
                  </button>
                </div>

                {/* Tab: All Icons */}
                {activePanel === 'icons' && (
                  <div>
                    {/* Group Subtabs */}
                    <div className="fav-group-tabs">
                      {Object.keys(grouped).map(g => {
                        const meta = GROUP_META[g];
                        const Icon = meta.icon;
                        return (
                          <button
                            key={g}
                            className={`fav-group-tab${activeTab === g ? ' active' : ''}`}
                            style={activeTab === g ? { borderColor: meta.color, color: meta.color, background: meta.bg } : {}}
                            onClick={() => setActiveTab(g)}
                          >
                            <Icon size={13} /> {meta.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Icon Grid */}
                    <div className="fav-icon-grid">
                      {(grouped[activeTab] || []).map(def => {
                        const url = generated[def.label];
                        const meta = GROUP_META[def.group];
                        return (
                          <div key={def.label} className="fav-icon-card">
                            <div className="fav-icon-card-preview" style={{ '--bg': meta.bg }}>
                              {url && <img src={url} alt={def.label} width={Math.min(def.size, 96)} height={Math.min(def.size, 96)} style={{ imageRendering: def.size <= 32 ? 'pixelated' : 'auto' }} />}
                            </div>
                            <div className="fav-icon-card-info">
                              <div className="fav-icon-size">{def.size}×{def.size}</div>
                              <div className="fav-icon-label">{def.label}</div>
                              <div className="fav-icon-desc">{def.desc}</div>
                            </div>
                            <button className="fav-icon-dl-btn" onClick={() => downloadSingle(def.label, url)} title="Download">
                              <Download size={14} /> Download
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}


                {/* Tab: Snippets & Configs */}
                {activePanel === 'snippet' && (
                  <div className="fav-snippet-panel">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Implementation Snippet</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <select
                          value={snippetFramework}
                          onChange={e => setSnippetFramework(e.target.value)}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', cursor: 'pointer', background: '#fff' }}
                        >
                          <option value="html">HTML (Default)</option>
                          <option value="react">React / Next.js</option>
                          <option value="vue">Vue.js</option>
                          <option value="laravel">Laravel (Blade)</option>
                          <option value="django">Django</option>
                        </select>
                        <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copySnippet}>
                          {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Code</>}
                        </button>
                      </div>
                    </div>
                    <pre className="fav-code-block">{htmlSnippetOutput}</pre>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>manifest.json</div>
                      <button className="copy-btn" onClick={() => copyToClipboard(buildManifest(manifestName, manifestShortName, manifestThemeColor, manifestBgColor))}>
                        <Copy size={12} /> Copy JSON
                      </button>
                    </div>
                    <pre className="fav-code-block">{buildManifest(manifestName, manifestShortName, manifestThemeColor, manifestBgColor)}</pre>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>browserconfig.xml</div>
                      <button className="copy-btn" onClick={() => copyToClipboard(buildBrowserConfig(manifestThemeColor))}>
                        <Copy size={12} /> Copy XML
                      </button>
                    </div>
                    <pre className="fav-code-block">{buildBrowserConfig(manifestThemeColor)}</pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
