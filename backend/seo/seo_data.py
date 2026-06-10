# SEO meta data for every tool page on ToolNix.
# Mirrors the metaTitle and metaDescription from frontend/src/data/seoContent.js
# Django injects these into index.html before serving — so Google sees them in raw HTML.

DEFAULT_SEO = {
    'title': 'ToolNix - Free Online PDF, Image & Developer Tools',
    'description': 'ToolNix offers 40+ free online tools. Convert PDF to Word, edit PDFs, remove backgrounds, compress images, generate QR codes, and more! 100% free with no registration required.',
    'keywords': 'free online tools, pdf tools, image tools, developer tools, toolnix',
}

SEO_DATA = {
    # ── PDF Conversion ────────────────────────────────────────────────────────
    'pdf-to-word': {
        'title': 'PDF to Word Converter — Convert PDF to DOCX Free Online | ToolNix',
        'description': 'Convert PDF to editable Word documents (DOC & DOCX) instantly — free, accurate, and no registration needed. Preserves formatting, tables & text. Try ToolNix PDF to Word now!',
        'keywords': 'pdf to word converter, convert pdf to word online free, pdf to docx, free pdf to word no registration',
    },
    'word-to-pdf': {
        'title': 'Word to PDF Converter — Convert DOCX to PDF Free Online | ToolNix',
        'description': 'Convert Word documents (DOC & DOCX) to PDF instantly online — free, no registration, no watermarks. Preserves your formatting perfectly. Try ToolNix Word to PDF now!',
        'keywords': 'word to pdf converter, convert word to pdf online free, docx to pdf, doc to pdf',
    },
    'pdf-to-jpg': {
        'title': 'PDF to JPG Free Online - High Quality & Secure | ToolNix',
        'description': 'Convert each PDF page into a JPG or extract all images contained in a PDF. Free, fast, and completely secure. No registration or installation required.',
        'keywords': 'pdf to jpg, free pdf to jpg, online pdf to jpg, best pdf to jpg converter',
    },
    'jpg-to-pdf': {
        'title': 'JPG to PDF Converter — Convert Images to PDF Free Online | ToolNix',
        'description': 'Convert JPG images to PDF online for free — instantly turn single or multiple JPEG photos into a professional PDF. Adjust page size and orientation. No registration.',
        'keywords': 'jpg to pdf converter, convert jpg to pdf online free, jpeg to pdf, multiple jpg to pdf',
    },
    'pdf-to-png': {
        'title': 'PDF to PNG Free Online - High Quality & Secure | ToolNix',
        'description': 'Convert PDF pages into PNG images with high quality output. Free, fast, and completely secure. No registration or installation required.',
        'keywords': 'pdf to png, free pdf to png, online pdf to png, best pdf to png converter',
    },
    'png-to-pdf': {
        'title': 'PNG to PDF Free Online - High Quality & Secure | ToolNix',
        'description': 'Convert PNG images to PDF format quickly and easily. Free, fast, and completely secure. No registration or installation required.',
        'keywords': 'png to pdf, free png to pdf, online png to pdf, best png to pdf converter',
    },
    'excel-to-pdf': {
        'title': 'Excel to PDF Free Online - High Quality & Secure | ToolNix',
        'description': 'Make Excel spreadsheets easy to read by converting them to PDF. Free, fast, and completely secure. No registration or installation required.',
        'keywords': 'excel to pdf, free excel to pdf, online excel to pdf, best excel to pdf converter',
    },
    'pdf-to-excel': {
        'title': 'PDF to Excel Free Online - High Quality & Secure | ToolNix',
        'description': 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds. Free, fast, and completely secure. No registration or installation required.',
        'keywords': 'pdf to excel, free pdf to excel, online pdf to excel, best pdf to excel converter',
    },
    'powerpoint-to-pdf': {
        'title': 'PowerPoint to PDF Free Online - High Quality & Secure | ToolNix',
        'description': 'Make PPT and PPTX slideshows easy to view by converting them to PDF. Free, fast, and completely secure. No registration or installation required.',
        'keywords': 'powerpoint to pdf, free powerpoint to pdf, ppt to pdf, pptx to pdf',
    },
    'pdf-to-powerpoint': {
        'title': 'PDF to PowerPoint Free Online - High Quality & Secure | ToolNix',
        'description': 'Turn your PDF files into easy to edit PPT and PPTX slideshows. Free, fast, and completely secure. No registration or installation required.',
        'keywords': 'pdf to powerpoint, free pdf to powerpoint, pdf to ppt, pdf to pptx',
    },
    'pdf-to-zip': {
        'title': 'PDFs to ZIP Free Online - High Quality & Secure | ToolNix',
        'description': 'Compress multiple PDF files into a single ZIP archive, with optional password protection. Free, fast, and completely secure.',
        'keywords': 'pdfs to zip, free pdfs to zip, online pdfs to zip, compress pdf to zip',
    },

    # ── PDF Editing ───────────────────────────────────────────────────────────
    'pdf-merge': {
        'title': 'Merge PDF Files Online Free — Combine PDFs Instantly | ToolNix',
        'description': 'Merge multiple PDF files into one in seconds — free, fast, and secure. Drag, drop, and reorder pages before combining. No sign-up required.',
        'keywords': 'merge pdf online free, combine pdf files, pdf merger, merge pdf files into one',
    },
    'pdf-split': {
        'title': 'Split PDF Online Free — Separate PDF Pages Instantly | ToolNix',
        'description': 'Split PDF files online for free — extract individual pages or page ranges into separate PDFs. Fast, secure, no registration required.',
        'keywords': 'split pdf online free, pdf splitter, separate pdf pages, extract pages from pdf',
    },
    'pdf-compress': {
        'title': 'Compress PDF Online Free — Reduce PDF File Size Instantly | ToolNix',
        'description': 'Compress PDF files online and reduce their size by up to 80% without losing quality. Free, fast, no registration. Perfect for email attachments.',
        'keywords': 'compress pdf online free, reduce pdf file size, pdf compressor, make pdf smaller',
    },
    'pdf-page-extractor': {
        'title': 'PDF Page Extractor Free Online — Extract PDF Pages | ToolNix',
        'description': 'Extract specific pages from a PDF file online for free. Select page ranges and download as a new PDF. No registration required.',
        'keywords': 'pdf page extractor, extract pages from pdf, pdf page remover online free',
    },
    'pdf-page-remover': {
        'title': 'Remove Pages from PDF Free Online | ToolNix',
        'description': 'Delete specific pages from a PDF online for free. Select and remove unwanted pages instantly. No registration or software required.',
        'keywords': 'remove pages from pdf free, delete pdf pages online, pdf page remover',
    },
    'pdf-page-reorder': {
        'title': 'Reorder PDF Pages Free Online | ToolNix',
        'description': 'Rearrange and reorder pages in your PDF online for free. Drag and drop pages into the order you want. No signup required.',
        'keywords': 'reorder pdf pages, rearrange pdf pages online free, pdf page organizer',
    },
    'pdf-rotate-pages': {
        'title': 'Rotate PDF Pages Free Online | ToolNix',
        'description': 'Rotate PDF pages online for free — rotate individual pages or the entire PDF. Supports 90°, 180°, 270°. No registration.',
        'keywords': 'rotate pdf pages free online, rotate pdf online, pdf page rotator',
    },
    'add-page-numbers': {
        'title': 'Add Page Numbers to PDF Free Online | ToolNix',
        'description': 'Add page numbers to PDF documents online for free. Choose position, style, and starting number. No software required.',
        'keywords': 'add page numbers to pdf free, pdf page numbering online',
    },
    'pdf-watermark': {
        'title': 'Add Watermark to PDF Free Online | ToolNix',
        'description': 'Add text or image watermarks to PDF files online for free. Customize opacity, position, and font. No registration required.',
        'keywords': 'add watermark to pdf free online, pdf watermark tool',
    },
    'remove-watermark': {
        'title': 'Remove Watermark from PDF Free Online | ToolNix',
        'description': 'Remove watermarks from PDF documents online for free. Clean your PDFs instantly without any software installation.',
        'keywords': 'remove watermark from pdf free online, pdf watermark remover',
    },
    'protect-pdf': {
        'title': 'Protect PDF with Password Free Online | ToolNix',
        'description': 'Add password protection to your PDF documents online for free. Encrypt PDFs with 128-bit AES encryption. No registration required.',
        'keywords': 'protect pdf with password free online, encrypt pdf, pdf password protect',
    },
    'edit-pdf': {
        'title': 'Edit PDF Online Free — PDF Editor | ToolNix',
        'description': 'Edit PDF files online for free. Add text, images, annotations, and more. No software installation or registration required.',
        'keywords': 'edit pdf online free, pdf editor online, edit pdf without software',
    },
    'sign-pdf': {
        'title': 'Sign PDF Online Free — Electronic Signature | ToolNix',
        'description': 'Sign PDF documents online for free. Draw, type or upload your signature. Legally binding e-signatures. No registration required.',
        'keywords': 'sign pdf online free, pdf electronic signature, esign pdf free',
    },
    'fill-forms': {
        'title': 'Fill PDF Forms Online Free | ToolNix',
        'description': 'Fill out PDF forms online for free without downloading. Complete forms, checkboxes, and text fields directly in your browser.',
        'keywords': 'fill pdf forms online free, fill out pdf form online, pdf form filler',
    },
    'add-text': {
        'title': 'Add Text to PDF Free Online | ToolNix',
        'description': 'Add text to PDF documents online for free. Choose font, size, color, and position. No registration or software required.',
        'keywords': 'add text to pdf free online, pdf text adder, type on pdf online free',
    },
    'add-image': {
        'title': 'Add Image to PDF Free Online | ToolNix',
        'description': 'Insert images into PDF files online for free. Upload and position any image on your PDF pages. No software required.',
        'keywords': 'add image to pdf free online, insert image into pdf, pdf image adder',
    },
    'annotate-pdf': {
        'title': 'Annotate PDF Online Free | ToolNix',
        'description': 'Annotate PDF documents online for free. Add comments, sticky notes, arrows, and shapes to any PDF file.',
        'keywords': 'annotate pdf online free, pdf annotation tool, add annotations to pdf',
    },
    'highlight-pdf': {
        'title': 'Highlight PDF Online Free | ToolNix',
        'description': 'Highlight text in PDF documents online for free. Choose highlight color and mark important sections instantly.',
        'keywords': 'highlight pdf online free, pdf highlighter tool, highlight text in pdf',
    },
    'draw-pdf': {
        'title': 'Draw on PDF Online Free | ToolNix',
        'description': 'Draw and sketch on PDF documents online for free. Freehand drawing tool for adding diagrams and signatures to PDFs.',
        'keywords': 'draw on pdf online free, pdf drawing tool, freehand draw on pdf',
    },
    'view-pdf': {
        'title': 'View PDF Online Free — PDF Viewer | ToolNix',
        'description': 'View PDF files online for free without downloading. Fast, secure online PDF viewer for any device. No software required.',
        'keywords': 'view pdf online free, pdf viewer online, open pdf in browser',
    },
    'add-header-footer': {
        'title': 'Add Header and Footer to PDF Free Online | ToolNix',
        'description': 'Add professional headers and footers to PDF files online for free. Customize text, date, page numbers, and position.',
        'keywords': 'add header footer to pdf free online, pdf header footer tool',
    },

    # ── Image Tools ───────────────────────────────────────────────────────────
    'image-to-pdf': {
        'title': 'Image to PDF Converter Free Online | ToolNix',
        'description': 'Convert images to PDF online for free. Combine multiple images into a single PDF. Supports JPG, PNG, WEBP, BMP. No registration.',
        'keywords': 'image to pdf converter free online, convert image to pdf, photo to pdf',
    },
    'pdf-to-image': {
        'title': 'PDF to Image Converter Free Online | ToolNix',
        'description': 'Convert PDF pages to images online for free. Export PDF as JPG, PNG, or WEBP with high quality output.',
        'keywords': 'pdf to image converter free online, pdf to jpg, pdf to png',
    },
    'ocr-image-to-text': {
        'title': 'OCR Image to Text Free Online — Extract Text from Images | ToolNix',
        'description': 'Extract text from images online for free using OCR. Convert scanned photos, screenshots, and documents to editable text. No signup required.',
        'keywords': 'ocr image to text free online, extract text from image, image to text converter',
    },
    'screenshot-to-text': {
        'title': 'Screenshot to Text Free Online — OCR Tool | ToolNix',
        'description': 'Convert screenshots to text online for free. Extract and copy text from any screenshot using OCR technology. Instant results.',
        'keywords': 'screenshot to text free online, extract text from screenshot, ocr screenshot',
    },
    'color-picker': {
        'title': 'Color Picker Online Free — HEX RGB HSL Color Codes | ToolNix',
        'description': 'Pick colors online for free. Get HEX, RGB, HSL, CMYK codes instantly. Extract color from any image. Build palettes, convert formats, check contrast. No signup.',
        'keywords': 'color picker online free, hex color picker, rgb color picker, html color picker',
        'json_ld': {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'SoftwareApplication',
                    'name': 'Color Picker — ToolNix',
                    'url': 'https://toolnix.pro/tools/color-picker',
                    'applicationCategory': 'DeveloperApplication',
                    'operatingSystem': 'Web Browser',
                    'description': 'Free online color picker. Get HEX, RGB, HSL, CMYK color codes instantly. Pick colors from any image with eyedropper. WCAG contrast checker included.',
                    'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
                    'featureList': [
                        'HEX, RGB, HSL, RGBA, CMYK color codes',
                        'Pick color from uploaded image',
                        'Color format converter',
                        'WCAG contrast checker',
                        'Color palette builder',
                        'Color harmony suggestions',
                        'No registration required',
                    ],
                },
                {
                    '@type': 'FAQPage',
                    'mainEntity': [
                        {
                            '@type': 'Question',
                            'name': 'How do I find the HEX color code of any color online for free?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Open ToolNix Color Picker and either select a color from the gradient, enter a known value, or upload an image and use the eyedropper to click any pixel. The HEX, RGB, and HSL codes appear instantly.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'How do I pick a color from a website or image?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Take a screenshot of the website or image, upload it to ToolNix Color Picker\'s image eyedropper, and click on any color to get its HEX and RGB codes immediately.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'What is the difference between HEX, RGB, and HSL?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'HEX represents color as a 6-digit code (e.g. #FF5733). RGB uses three numbers 0–255 for Red, Green, Blue. HSL uses Hue (0–360°), Saturation (%), and Lightness (%). All three describe the same color in different notation systems.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'Can I build a full color palette with this tool?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Yes. Add any color to the palette builder and save a full set for your project. Export your palette as CSS variables, HEX codes, or a PNG swatch image.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'What is CMYK used for?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'CMYK (Cyan, Magenta, Yellow, Key/Black) is the color model used in print design. If you are preparing designs for physical printing — business cards, brochures, packaging — you need CMYK values for the print vendor.',
                            },
                        },
                    ],
                },
            ],
        },
    },
    'hex-to-rgb': {
        'title': 'HEX to RGB Converter Free Online — Color Code Tool | ToolNix',
        'description': 'Convert HEX color codes to RGB values online for free. Enter any HEX code and instantly get RGB, HSL, and CMYK values. Free, fast, no signup.',
        'keywords': 'hex to rgb converter online free, hex to rgb color code, convert hex to rgb',
        'json_ld': {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'SoftwareApplication',
                    'name': 'HEX to RGB Converter — ToolNix',
                    'url': 'https://toolnix.pro/tools/hex-to-rgb',
                    'applicationCategory': 'DeveloperApplication',
                    'operatingSystem': 'Web Browser',
                    'description': 'Free online HEX to RGB color code converter. Enter any HEX value and instantly get RGB, RGBA, HSL, and CMYK values. Supports 3-digit, 6-digit, and 8-digit HEX codes.',
                    'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
                    'featureList': [
                        'Real-time HEX to RGB conversion',
                        'Supports 3-digit, 6-digit, and 8-digit HEX',
                        '8-digit HEX to RGBA with alpha',
                        'Shows RGB, RGBA, HSL, and CMYK simultaneously',
                        'Color preview swatch',
                        'No registration required',
                    ],
                },
                {
                    '@type': 'FAQPage',
                    'mainEntity': [
                        {
                            '@type': 'Question',
                            'name': 'How do I convert a HEX color code to RGB online for free?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Enter your HEX code (e.g. #3B82F6) in the ToolNix HEX to RGB converter. The RGB, HSL, and CMYK values appear instantly in real time. Free, no signup required.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'What is #FF5733 in RGB?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': '#FF5733 converts to rgb(255, 87, 51) — Red: FF = 255, Green: 57 = 87, Blue: 33 = 51.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'Can I convert an 8-digit HEX code with alpha to RGBA?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Yes. Enter an 8-digit HEX like #FF573380 and ToolNix converts it to rgba(255, 87, 51, 0.50). The last two hex digits represent the alpha/opacity channel.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'What is #FFFFFF in RGB?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': '#FFFFFF is rgb(255, 255, 255) — pure white.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'Does ToolNix convert 3-digit HEX codes?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Yes. 3-digit HEX shorthand like #F53 is automatically expanded to #FF5533 before converting to rgb(255, 85, 51).',
                            },
                        },
                    ],
                },
            ],
        },
    },
    'rgb-to-hex': {
        'title': 'RGB to HEX Converter Free Online — Color Code Tool | ToolNix',
        'description': 'Convert RGB to HEX color codes online for free. Enter R, G, B values and instantly get the HEX code. Supports RGBA to HEX with alpha. Free, fast, no signup.',
        'keywords': 'rgb to hex converter online free, rgb to hex color code, convert rgb to hex',
        'json_ld': {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'SoftwareApplication',
                    'name': 'RGB to HEX Converter — ToolNix',
                    'url': 'https://toolnix.pro/tools/rgb-to-hex',
                    'applicationCategory': 'DeveloperApplication',
                    'operatingSystem': 'Web Browser',
                    'description': 'Free online RGB to HEX color code converter. Enter R, G, B values and instantly get the HEX code. Also converts RGBA to 8-digit HEX. Shows HSL and CMYK simultaneously.',
                    'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
                    'featureList': [
                        'Real-time RGB to HEX conversion',
                        'RGBA to 8-digit HEX with alpha',
                        'Shows HEX, HSL, and CMYK simultaneously',
                        'One-click copy to clipboard',
                        'Color preview swatch',
                        'No registration required',
                    ],
                },
                {
                    '@type': 'FAQPage',
                    'mainEntity': [
                        {
                            '@type': 'Question',
                            'name': 'How do I convert RGB to HEX online for free?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Enter your Red, Green, and Blue values (0–255 each) in the ToolNix RGB to HEX converter. The HEX code appears instantly in real time. Free, no signup required.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'What is RGB(59, 130, 246) in HEX?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'RGB(59, 130, 246) converts to #3B82F6 in HEX. Red 59 = 3B, Green 130 = 82, Blue 246 = F6.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'Can I convert RGBA to HEX with transparency?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Yes. Enter an RGBA value and ToolNix converts it to an 8-digit HEX code. The last two digits represent the alpha channel — e.g. 50% opacity becomes 80 in hex.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'What is the HEX code for pure red, green, and blue?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Pure red rgb(255,0,0) = #FF0000. Pure green rgb(0,255,0) = #00FF00. Pure blue rgb(0,0,255) = #0000FF. Black rgb(0,0,0) = #000000. White rgb(255,255,255) = #FFFFFF.',
                            },
                        },
                    ],
                },
            ],
        },
    },
    'image-metadata': {
        'title': 'Image Metadata Viewer Free Online — Read EXIF Data | ToolNix',
        'description': 'View image metadata online for free. Read EXIF data from any photo — GPS location, camera settings, date taken, and more. No registration. Instant results.',
        'keywords': 'image metadata viewer online free, read exif data from photo online, view image metadata online free, exif data viewer online, check photo metadata online free, see gps location from photo, how to view metadata of an image online free, read exif data from jpg online no software, view gps coordinates in photo online free, check where a photo was taken from metadata, online exif reader no signup, view camera settings from photo free, what metadata is in my photo online check, read iptc xmp data from image free online, find location of photo using metadata free, exif data reader online free tool',
        'json_ld': {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'SoftwareApplication',
                    'name': 'Image Metadata Viewer — ToolNix',
                    'url': 'https://toolnix.pro/tools/image-metadata',
                    'applicationCategory': 'UtilitiesApplication',
                    'operatingSystem': 'Web Browser',
                    'description': 'Free online image metadata viewer. Read EXIF, IPTC, and XMP data from any photo. View GPS location, camera settings, date taken, and more.',
                    'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
                    'featureList': [
                        'View GPS location from photos',
                        'Read camera make, model, and settings',
                        'Display EXIF, IPTC, and XMP metadata',
                        'Map view for GPS coordinates',
                        'Supports JPG, PNG, WEBP, HEIC, RAW',
                        'No registration required',
                    ],
                },
                {
                    '@type': 'FAQPage',
                    'mainEntity': [
                        {
                            '@type': 'Question',
                            'name': 'How do I view EXIF data from a photo online for free?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Upload your image to ToolNix Image Metadata Viewer. All EXIF, IPTC, and XMP data displays instantly — including GPS coordinates, camera model, and date taken. Free, no signup.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'Can I see where a photo was taken using metadata?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Yes. If the photo contains GPS data, ToolNix displays the exact coordinates and shows the location on an interactive map.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'What is the difference between EXIF, IPTC, and XMP metadata?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'EXIF stores technical camera data like settings, GPS, and timestamps. IPTC stores editorial data like captions and copyright. XMP is Adobe\'s standard for edit history and ratings. ToolNix reads all three.',
                            },
                        },
                    ],
                },
            ],
        },
    },
    'remove-exif': {
        'title': 'Remove EXIF Data from Images Free Online — No Signup | ToolNix',
        'description': 'Remove EXIF metadata from photos online for free. Strip GPS location, camera model, date, and hidden data from JPG, PNG, WEBP. No registration. Privacy protected.',
        'keywords': 'remove exif data online free, strip exif data from image, remove metadata from photo online, exif remover free online, delete exif data from jpg free, remove gps from photo online free, remove exif data from photo before sharing online, how to remove location data from photo free, strip metadata from image online no signup, remove hidden data from jpg online free, exif data remover tool free no registration, remove camera metadata from photo free online, delete gps coordinates from photo online, how to remove exif data from iphone photos free, remove exif data from image batch free online, privacy photo cleaner free online tool',
        'json_ld': {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'SoftwareApplication',
                    'name': 'Remove EXIF Data — ToolNix',
                    'url': 'https://toolnix.pro/tools/remove-exif',
                    'applicationCategory': 'UtilitiesApplication',
                    'operatingSystem': 'Web Browser',
                    'description': 'Free online tool to remove EXIF metadata from photos. Strip GPS location, camera model, date, and hidden data from JPG, PNG, WEBP images. No registration required.',
                    'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
                    'featureList': [
                        'Remove GPS coordinates from photos',
                        'Strip camera make and model data',
                        'Remove date and time metadata',
                        'Batch EXIF removal',
                        'No registration required',
                        'Files auto-deleted within 1 hour',
                    ],
                },
                {
                    '@type': 'FAQPage',
                    'mainEntity': [
                        {
                            '@type': 'Question',
                            'name': 'How do I remove EXIF data from a photo online for free?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Upload your photo to ToolNix EXIF Remover, click Remove EXIF, and download the clean image. No registration or software required.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'Does removing EXIF data affect image quality?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'No. EXIF data is separate from pixel data. Removing it has zero effect on your image\'s visual quality or resolution.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'Can I remove GPS location data from iPhone photos for free?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Yes. Upload your iPhone HEIC or JPG photo and ToolNix removes all GPS coordinates and location data completely free.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'Does social media automatically remove EXIF data?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Facebook and Instagram strip most EXIF on upload, but direct file sharing via email, WhatsApp, or Telegram preserves all metadata. Always strip EXIF before sharing files directly.',
                            },
                        },
                    ],
                },
                {
                    '@type': 'HowTo',
                    'name': 'How to Remove EXIF Data from a Photo Online',
                    'description': 'Strip GPS, camera, and hidden metadata from images in 3 steps',
                    'totalTime': 'PT1M',
                    'step': [
                        {
                            '@type': 'HowToStep',
                            'position': 1,
                            'name': 'Upload your image',
                            'text': 'Click upload and select your JPG, PNG, or WEBP photo file.',
                        },
                        {
                            '@type': 'HowToStep',
                            'position': 2,
                            'name': 'Review metadata',
                            'text': 'Preview all EXIF data found in the image, including GPS coordinates and camera info.',
                        },
                        {
                            '@type': 'HowToStep',
                            'position': 3,
                            'name': 'Remove and download',
                            'text': 'Click Remove EXIF and download your clean, privacy-safe image.',
                        },
                    ],
                },
            ],
        },
    },
    'qr-code-generator': {
        'title': 'QR Code Generator Free Online — Create Custom QR Codes | ToolNix',
        'description': 'Generate QR codes online for free. Create QR codes for URLs, text, email, WiFi, and more. Download PNG or SVG. No registration, no watermark, no expiry. Free forever.',
        'keywords': 'qr code generator free online, create qr code for website free, free qr code generator no expiry',
    },
    'bg-remover': {
        'title': 'Remove Background from Image Free Online — AI Tool | ToolNix',
        'description': 'Remove image backgrounds online for free using AI. Get a transparent PNG in seconds. No signup, no watermark. Works on photos, logos, and products.',
        'keywords': 'remove background from image free online, background remover, transparent background maker',
    },
    'image-compressor': {
        'title': 'Compress Image Online Free — Reduce Image File Size | ToolNix',
        'description': 'Compress images online for free without losing quality. Reduce JPG, PNG, WEBP file sizes by up to 90%. Batch compression supported. No registration.',
        'keywords': 'compress image online free, reduce image file size, image compressor online',
    },
    'image-to-svg': {
        'title': 'Image to SVG Converter Free Online | ToolNix',
        'description': 'Convert PNG, JPG, and other images to SVG format online for free. Vectorize images for scalable graphics. No registration required.',
        'keywords': 'image to svg converter free online, png to svg, jpg to svg, vectorize image free',
    },
    'svg-to-image': {
        'title': 'SVG to Image Converter Free Online — SVG to PNG JPG | ToolNix',
        'description': 'Convert SVG files to PNG, JPG, or WEBP images online for free. Choose output size and format. No software or registration required.',
        'keywords': 'svg to image converter free online, svg to png, svg to jpg, convert svg online',
    },
    'passport-maker': {
        'title': 'Passport Photo Maker Free Online | ToolNix',
        'description': 'Create passport photos online for free. Resize and format your photo to meet passport requirements for any country. Download instantly.',
        'keywords': 'passport photo maker free online, passport photo creator, id photo maker online',
    },

    # ── Developer Tools ───────────────────────────────────────────────────────
    'favicon-generator': {
        'title': 'Favicon Generator Free Online — Create Website Icons | ToolNix',
        'description': 'Generate favicon icons for your website free. Upload any image and get ICO, PNG, Apple Touch Icon, and PWA icons in all sizes. No registration. Instant download.',
        'keywords': 'favicon generator free online, create favicon online free, favicon maker online free, generate favicon from image free, ico file generator online free, website icon generator free, favicon generator from png free online, how to create a favicon for my website free, favicon generator from image no signup, create ico file from png free online, apple touch icon generator free online, pwa icon generator free online, favicon generator all sizes free download, favicon creator free for wordpress, make a favicon from logo free, generate favicon html code free online, favicon generator 16x16 32x32 free, best free favicon generator online 2025, favicon from text free online tool, create favicon without photoshop free',
        'json_ld': {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'SoftwareApplication',
                    'name': 'Favicon Generator — ToolNix',
                    'url': 'https://toolnix.pro/tools/favicon-generator',
                    'applicationCategory': 'DeveloperApplication',
                    'operatingSystem': 'Web Browser',
                    'description': 'Free online favicon generator. Upload any image and download ICO, PNG, Apple Touch Icon, and PWA icons in all required sizes. Includes ready-to-paste HTML code.',
                    'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
                    'featureList': [
                        'Generates ICO, PNG, Apple Touch Icon, and PWA icons',
                        'All sizes: 16x16, 32x32, 48x48, 180x180, 192x192, 512x512',
                        'Includes ready-to-paste HTML code',
                        'Supports PNG, JPG, SVG, WEBP input',
                        'Generate from text or image',
                        'No registration required',
                    ],
                },
                {
                    '@type': 'FAQPage',
                    'mainEntity': [
                        {
                            '@type': 'Question',
                            'name': 'How do I create a favicon for my website for free?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Upload your logo or image to ToolNix Favicon Generator, download the ZIP package with all favicon sizes, and paste the provided HTML code into your website\'s head section. Free, no signup required.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'What sizes does the favicon generator create?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'ToolNix generates favicons at 16x16, 32x32, 48x48, 180x180 (Apple Touch Icon), 192x192, and 512x512 pixels, plus a bundled favicon.ico file.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'How do I add a favicon to WordPress?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Go to Appearance > Customize > Site Identity > Site Icon in WordPress admin. Upload the 512x512px PNG from your ToolNix favicon download.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'What is the best image format to upload for a favicon?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'PNG is ideal — transparent backgrounds are preserved and quality is lossless. SVG also works and scales perfectly. Minimum recommended size: 512x512px square.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'Why is my favicon not showing in Google search results?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Google requires a favicon.ico or PNG in your site root, correct link rel=icon tags in your HTML head, and your page indexed by Google. New favicons can take days to weeks to appear in search results.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'What is an Apple Touch Icon?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'The Apple Touch Icon (apple-touch-icon.png, 180x180px) is the icon shown on iPhone and iPad home screens when a user saves your website as a shortcut.',
                            },
                        },
                    ],
                },
            ],
        },
    },
    'color-picker': {
        'title': 'Color Picker Online Free — HEX RGB HSL Color Codes | ToolNix',
        'description': 'Pick colors online for free. Get HEX, RGB, HSL, CMYK codes instantly. Extract color from any image. Build palettes, convert formats, check contrast. No signup.',
        'keywords': 'color picker online free, hex color picker online free, rgb color picker free, html color picker free online, color code finder online, pick color from image online free, online color picker with hex rgb and hsl, color picker from image online free, html hex color picker no signup, pick color code from website screenshot free, color palette generator from image free, color picker for web design free online, css color picker online free tool, eyedropper tool online free no download, color picker with cmyk values free, wcag color contrast checker free online, find color code from image online free, color picker tool for designers free, hex color code finder from image online, color picker online free for developers',
        'json_ld': {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'SoftwareApplication',
                    'name': 'Color Picker — ToolNix',
                    'url': 'https://toolnix.pro/tools/color-picker',
                    'applicationCategory': 'DeveloperApplication',
                    'operatingSystem': 'Web Browser',
                    'description': 'Free online color picker. Get HEX, RGB, HSL, CMYK color codes instantly. Pick colors from any image with eyedropper. WCAG contrast checker included.',
                    'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
                    'featureList': [
                        'HEX, RGB, HSL, RGBA, CMYK color codes',
                        'Pick color from uploaded image',
                        'Color format converter',
                        'WCAG contrast checker',
                        'Color palette builder',
                        'Color harmony suggestions',
                        'No registration required',
                    ],
                },
                {
                    '@type': 'FAQPage',
                    'mainEntity': [
                        {
                            '@type': 'Question',
                            'name': 'How do I find the HEX color code of any color online for free?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Open ToolNix Color Picker and either select a color from the gradient, enter a known value, or upload an image and use the eyedropper to click any pixel. The HEX, RGB, and HSL codes appear instantly.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'How do I pick a color from a website or image?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Take a screenshot of the website or image, upload it to ToolNix Color Picker\'s image eyedropper, and click on any color to get its HEX and RGB codes immediately.',
                            },
                        },
                    ],
                },
            ],
        },
    },
    'rgb-to-hex': {
        'title': 'RGB to HEX Converter Free Online - Color Code Tool | ToolNix',
        'description': 'Convert RGB to HEX color codes online for free. Enter R, G, B values and instantly get the HEX code. Supports RGBA to HEX with alpha. Free, fast, no signup.',
        'keywords': 'rgb to hex converter online free, rgb to hex color code, convert rgb to hex online, rgb to hex calculator free, rgb color to hex code online, rgba to hex converter free, rgb to hex converter online free no signup, convert rgb values to hex code free, rgb to hex color converter for web design, how to convert rgb to hex code manually, rgba to hex with transparency converter, rgb 255 to hex online free, rgb to hex real time converter online, rgb(255 87 51) to hex online free, rgb to hex css color code converter, best rgb to hex converter online free, rgb to hex and hsl converter free, rgb to hex converter for developers free',
        'json_ld': {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'SoftwareApplication',
                    'name': 'RGB to HEX Converter — ToolNix',
                    'url': 'https://toolnix.pro/tools/rgb-to-hex',
                    'applicationCategory': 'DeveloperApplication',
                    'operatingSystem': 'Web Browser',
                    'description': 'Free online RGB to HEX color code converter. Enter R, G, B values and instantly get the HEX code. Also converts RGBA to 8-digit HEX. Shows HSL and CMYK simultaneously.',
                    'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
                    'featureList': [
                        'Real-time RGB to HEX conversion',
                        'RGBA to 8-digit HEX with alpha',
                        'Shows HEX, HSL, and CMYK simultaneously',
                        'One-click copy to clipboard',
                        'Color preview swatch',
                        'No registration required',
                    ],
                },
                {
                    '@type': 'FAQPage',
                    'mainEntity': [
                        {
                            '@type': 'Question',
                            'name': 'How do I convert RGB to HEX online for free?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Enter your Red, Green, and Blue values (0–255 each) in the ToolNix RGB to HEX converter. The HEX code appears instantly in real time. Free, no signup required.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'What is RGB(59, 130, 246) in HEX?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'RGB(59, 130, 246) converts to #3B82F6 in HEX. Red 59 = 3B, Green 130 = 82, Blue 246 = F6.',
                            },
                        },
                        {
                            '@type': 'Question',
                            'name': 'Can I convert RGBA to HEX with transparency?',
                            'acceptedAnswer': {
                                '@type': 'Answer',
                                'text': 'Yes. Enter an RGBA value and ToolNix converts it to an 8-digit HEX code. The last two digits represent the alpha channel — e.g. 50% opacity becomes 80 in hex.',
                            },
                        },
                    ],
                },
            ],
        },
    },
}
