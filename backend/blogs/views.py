from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView
from django.views.generic.edit import FormMixin
from django.urls import reverse
from .models import BlogPost, Category
from .forms import CommentForm

class BlogListView(ListView):
    model = BlogPost
    template_name = 'blogs/blog_list.html'
    context_object_name = 'posts'
    paginate_by = 10

    def get_queryset(self):
        return BlogPost.objects.filter(status='published').order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.all()
        return context

class BlogDetailView(FormMixin, DetailView):
    model = BlogPost
    template_name = 'blogs/blog_detail.html'
    context_object_name = 'post'
    form_class = CommentForm

    def get_queryset(self):
        # Allow admins to preview draft posts without getting a 404
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return BlogPost.objects.all()
        return BlogPost.objects.filter(status='published')

    def get_success_url(self):
        return reverse('blogs:blog_detail', kwargs={'slug': self.object.slug})

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['related_posts'] = BlogPost.objects.filter(
            category=self.object.category, 
            status='published'
        ).exclude(id=self.object.id)[:3]
        context['comments'] = self.object.comments.filter(active=True)
        if 'form' not in context:
            context['form'] = self.get_form()
        return context

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        
        # Security: Anti-Bot Honeypot Trap
        # Bots automatically fill hidden fields. If this is filled, we drop it silently.
        if request.POST.get('website_url_honeypot'):
            return redirect(self.get_success_url())

        form = self.get_form()
        if form.is_valid():
            return self.form_valid(form)
        else:
            return self.form_invalid(form)

    def form_valid(self, form):
        comment = form.save(commit=False)
        comment.post = self.object
        comment.save()
        return super().form_valid(form)
