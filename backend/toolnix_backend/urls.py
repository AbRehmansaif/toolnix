"""
URL configuration for toolnix_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from seo.views import serve_frontend

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('converter.urls')),
    path('api/blogs/', include('blogs.urls')),
    path('ckeditor/', include('ckeditor_uploader.urls')),

    # ── Media files (uploaded images, etc.) ──────────────────────────────────
    # Nginx proxies /api/ to Django, so we must serve them explicitly.
    # We optionally match /serve to support the BypassNginxStorage.
    re_path(r'^api/media/(?P<path>.*?)(?:/serve)?$', serve, {'document_root': settings.MEDIA_ROOT}),

    # ── Frontend catch-all ────────────────────────────────────────────────────
    # Every non-API URL is served by Django with SEO meta tags injected.
    # Static assets (JS, CSS, images) are served directly by Nginx — never reach here.
    re_path(r'^.*$', serve_frontend),
]
