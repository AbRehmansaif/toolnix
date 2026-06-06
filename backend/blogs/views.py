from rest_framework import generics, filters
from rest_framework.pagination import PageNumberPagination
from django.http import HttpResponse
from .models import BlogPost, Category
from .serializers import BlogPostListSerializer, BlogPostDetailSerializer, CategorySerializer
import xml.etree.ElementTree as ET
from datetime import datetime

class BlogPagination(PageNumberPagination):
    page_size = 9
    page_size_query_param = 'page_size'
    max_page_size = 50

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class BlogListView(generics.ListAPIView):
    serializer_class = BlogPostListSerializer
    pagination_class = BlogPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'excerpt', 'content']

    def get_queryset(self):
        queryset = BlogPost.objects.filter(status='published').order_by('-created_at')
        category_slug = self.request.query_params.get('category', None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset

class BlogDetailView(generics.RetrieveAPIView):
    serializer_class = BlogPostDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return BlogPost.objects.all()
        return BlogPost.objects.filter(status='published')

def blog_sitemap(request):
    """
    Dynamic XML Sitemap for Blog Posts.
    Ensures Google can index new blogs immediately without a rebuild.
    """
    posts = BlogPost.objects.filter(status='published').order_by('-updated_at')
    
    urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    
    base_url = request.build_absolute_uri('/')[:-1] # Remove trailing slash
    # Ensure it's the frontend URL if backend is on a different domain,
    # but normally for production we can hardcode or rely on HTTP_HOST.
    # We will assume the frontend is hosted on the same origin or we can use a setting.
    frontend_url = "https://toolnix.com" # Replace with actual domain if dynamic needed
    
    for post in posts:
        url = ET.SubElement(urlset, "url")
        loc = ET.SubElement(url, "loc")
        loc.text = f"{frontend_url}/blog/{post.slug}"
        
        lastmod = ET.SubElement(url, "lastmod")
        lastmod.text = post.updated_at.strftime('%Y-%m-%d')
        
        changefreq = ET.SubElement(url, "changefreq")
        changefreq.text = "weekly"
        
        priority = ET.SubElement(url, "priority")
        priority.text = "0.8"
        
    xml_str = ET.tostring(urlset, encoding='utf-8', method='xml')
    return HttpResponse(xml_str, content_type='application/xml')

