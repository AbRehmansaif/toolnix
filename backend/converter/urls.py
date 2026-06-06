from django.urls import path
from . import views

urlpatterns = [
    path('pdf-to-word/', views.pdf_to_word, name='pdf_to_word'),
    path('word-to-pdf/', views.word_to_pdf, name='word_to_pdf'),
    path('excel-to-pdf/', views.excel_to_pdf, name='excel_to_pdf'),
    path('pdf-to-excel/', views.pdf_to_excel, name='pdf_to_excel'),
    path('pptx-to-pdf/', views.pptx_to_pdf, name='pptx_to_pdf'),
    path('pdf-to-pptx/', views.pdf_to_pptx, name='pdf_to_pptx'),
]
