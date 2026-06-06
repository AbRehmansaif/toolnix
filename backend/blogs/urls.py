from django.urls import path
from .views import BlogListView, BlogDetailView, CategoryListView, blog_sitemap

app_name = 'blogs'

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('posts/', BlogListView.as_view(), name='blog_list'),
    path('posts/<str:slug>/', BlogDetailView.as_view(), name='blog_detail'),
    path('sitemap.xml', blog_sitemap, name='blog_sitemap'),
]
