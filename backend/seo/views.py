import json
import os
import re

from django.conf import settings
from django.http import HttpResponse, Http404

from .seo_data import SEO_DATA, DEFAULT_SEO

# Default OG image used site-wide
OG_IMAGE_URL = 'https://toolnix.pro/og-image.png'


def _escape_attr(value: str) -> str:
    """Escape characters that would break an HTML attribute value."""
    return value.replace('&', '&amp;').replace('"', '&quot;')


def _build_tool_jsonld(seo: dict, canonical_url: str, tool_id: str) -> str:
    """
    Build a per-page JSON-LD <script> block for a tool page.
    Uses a pre-authored schema from SEO_DATA if available,
    otherwise auto-generates a SoftwareApplication schema.
    """
    # Use the rich hand-authored schema if provided
    if 'json_ld' in seo:
        return json.dumps(seo['json_ld'], ensure_ascii=False, indent=2)

    # Auto-generate a basic SoftwareApplication schema from title/description
    _developer_tools = {
        'favicon-generator', 'color-picker', 'hex-to-rgb', 'rgb-to-hex', 'qr-code-generator',
    }
    _multimedia_tools = {
        'bg-remover', 'image-compressor', 'image-to-svg', 'svg-to-image', 'passport-maker',
        'image-to-pdf', 'pdf-to-image', 'image-metadata', 'remove-exif',
        'ocr-image-to-text', 'screenshot-to-text',
    }
    if tool_id in _developer_tools:
        category = 'DeveloperApplication'
    elif tool_id in _multimedia_tools:
        category = 'MultimediaApplication'
    else:
        category = 'UtilitiesApplication'

    # Extract a clean short name from the full title
    name = seo['title'].split(' — ')[0].split(' | ')[0].strip()
    name = re.sub(r'\s+(Free Online|Online Free|Free)$', '', name).strip()

    schema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': name,
        'url': canonical_url,
        'description': seo['description'],
        'applicationCategory': category,
        'operatingSystem': 'Web Browser',
        'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD',
        },
    }
    return json.dumps(schema, ensure_ascii=False, indent=2)


def serve_frontend(request):
    """
    Serve the React index.html with route-specific meta tags injected.
    This runs server-side so Google sees the correct title/description
    in the raw HTML — no JavaScript execution required.
    """
    path = request.path.strip('/')

    # Resolve tool ID from URL: /tools/<tool-id> → <tool-id>
    parts = path.split('/')
    tool_id = None
    if len(parts) >= 2 and parts[0] == 'tools':
        tool_id = parts[1]

    seo = SEO_DATA.get(tool_id, DEFAULT_SEO) if tool_id else DEFAULT_SEO

    title = _escape_attr(seo['title'])
    description = _escape_attr(seo['description'])
    keywords = _escape_attr(seo.get('keywords', DEFAULT_SEO['keywords']))
    canonical_url = f'https://toolnix.pro/{path}' if path else 'https://toolnix.pro/'

    # Read index.html from the built frontend
    dist_path = os.path.join(settings.FRONTEND_DIST_PATH, 'index.html')
    try:
        with open(dist_path, 'r', encoding='utf-8') as f:
            html = f.read()
    except FileNotFoundError:
        raise Http404('Frontend not built yet. Run: npm run build')

    # ── Inject <title> ──────────────────────────────────────────────────────
    html = re.sub(
        r'<title[^>]*>.*?</title>',
        f'<title>{title}</title>',
        html,
        flags=re.DOTALL,
    )

    # ── Inject meta description ─────────────────────────────────────────────
    html = re.sub(
        r'<meta\s+(?:[^>]*?\s+)?name=["\']description["\'][^>]*?>',
        f'<meta name="description" content="{description}" />',
        html,
        flags=re.IGNORECASE,
    )

    # ── Inject meta keywords ────────────────────────────────────────────────
    html = re.sub(
        r'<meta\s+(?:[^>]*?\s+)?name=["\']keywords["\'][^>]*?>',
        f'<meta name="keywords" content="{keywords}" />',
        html,
        flags=re.IGNORECASE,
    )

    # ── Inject canonical ────────────────────────────────────────────────────
    html = re.sub(
        r'<link\s+(?:[^>]*?\s+)?rel=["\']canonical["\'][^>]*/?>',
        f'<link rel="canonical" href="{canonical_url}" />',
        html,
        flags=re.IGNORECASE,
    )

    # ── Inject OG tags ──────────────────────────────────────────────────────
    html = re.sub(
        r'<meta\s+(?:[^>]*?\s+)?property=["\']og:title["\'][^>]*?>',
        f'<meta property="og:title" content="{title}" />',
        html,
        flags=re.IGNORECASE,
    )
    html = re.sub(
        r'<meta\s+(?:[^>]*?\s+)?property=["\']og:description["\'][^>]*?>',
        f'<meta property="og:description" content="{description}" />',
        html,
        flags=re.IGNORECASE,
    )
    html = re.sub(
        r'<meta\s+(?:[^>]*?\s+)?property=["\']og:url["\'][^>]*?>',
        f'<meta property="og:url" content="{canonical_url}" />',
        html,
        flags=re.IGNORECASE,
    )
    html = re.sub(
        r'<meta\s+(?:[^>]*?\s+)?property=["\']og:image["\'][^>]*?>',
        f'<meta property="og:image" content="{OG_IMAGE_URL}" />',
        html,
        flags=re.IGNORECASE,
    )

    # ── Inject Twitter Card tags ─────────────────────────────────────────────
    html = re.sub(
        r'<meta\s+(?:[^>]*?\s+)?name=["\']twitter:title["\'][^>]*?>',
        f'<meta name="twitter:title" content="{title}" />',
        html,
        flags=re.IGNORECASE,
    )
    html = re.sub(
        r'<meta\s+(?:[^>]*?\s+)?name=["\']twitter:description["\'][^>]*?>',
        f'<meta name="twitter:description" content="{description}" />',
        html,
        flags=re.IGNORECASE,
    )
    html = re.sub(
        r'<meta\s+(?:[^>]*?\s+)?name=["\']twitter:image["\'][^>]*?>',
        f'<meta name="twitter:image" content="{OG_IMAGE_URL}" />',
        html,
        flags=re.IGNORECASE,
    )

    # ── Inject per-page JSON-LD schema (tool pages only) ────────────────────
    if tool_id and tool_id in SEO_DATA:
        jsonld_str = _build_tool_jsonld(seo, canonical_url, tool_id)
        tool_schema_block = (
            '\n    <!-- Per-page structured data injected by Django SEO view -->'
            f'\n    <script type="application/ld+json">\n{jsonld_str}\n    </script>'
        )
        html = html.replace('</head>', tool_schema_block + '\n  </head>', 1)

    return HttpResponse(html, content_type='text/html; charset=utf-8')
