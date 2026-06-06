import os
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from django.core.files.storage import FileSystemStorage

from pdf2docx import Converter
from docx2pdf import convert as convert_docx_to_pdf

# PDF to Excel
import pdfplumber
import openpyxl

# Excel to PDF (Basic)
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# PowerPoint
from pptx import Presentation

import tempfile
import uuid

def handle_upload(request):
    if request.method != 'POST' or not request.FILES.get('file'):
        return None, "No file uploaded"
    
    file = request.FILES['file']
    fs = FileSystemStorage(location=settings.MEDIA_ROOT)
    ext = os.path.splitext(file.name)[1]
    filename = fs.save(f"{uuid.uuid4()}{ext}", file)
    return os.path.join(settings.MEDIA_ROOT, filename), file.name

@csrf_exempt
@api_view(['POST'])
def pdf_to_word(request):
    input_path, original_name = handle_upload(request)
    if not input_path:
        return JsonResponse({'error': 'No file uploaded'}, status=400)
    
    output_path = input_path.replace('.pdf', '.docx')
    try:
        cv = Converter(input_path)
        cv.convert(output_path, start=0, end=None)
        cv.close()
        
        with open(output_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            response['Content-Disposition'] = f'attachment; filename="{os.path.splitext(original_name)[0]}.docx"'
            return response
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    finally:
        if os.path.exists(input_path): os.remove(input_path)
        if os.path.exists(output_path): os.remove(output_path)

@csrf_exempt
@api_view(['POST'])
def word_to_pdf(request):
    input_path, original_name = handle_upload(request)
    if not input_path:
        return JsonResponse({'error': 'No file uploaded'}, status=400)
    
    output_path = input_path.replace('.docx', '.pdf').replace('.doc', '.pdf')
    try:
        # Requires MS Word installed on Windows
        convert_docx_to_pdf(input_path, output_path)
        
        with open(output_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{os.path.splitext(original_name)[0]}.pdf"'
            return response
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    finally:
        if os.path.exists(input_path): os.remove(input_path)
        if os.path.exists(output_path): os.remove(output_path)

@csrf_exempt
@api_view(['POST'])
def excel_to_pdf(request):
    input_path, original_name = handle_upload(request)
    if not input_path:
        return JsonResponse({'error': 'No file uploaded'}, status=400)
    
    output_path = input_path.replace('.xlsx', '.pdf').replace('.xls', '.pdf')
    try:
        wb = openpyxl.load_workbook(input_path, data_only=True)
        sheet = wb.active
        
        c = canvas.Canvas(output_path, pagesize=letter)
        y = 750
        for row in sheet.iter_rows(values_only=True):
            text = " | ".join([str(cell) if cell is not None else "" for cell in row])
            c.drawString(50, y, text[:100]) # simple text render
            y -= 20
            if y < 50:
                c.showPage()
                y = 750
        c.save()
        
        with open(output_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{os.path.splitext(original_name)[0]}.pdf"'
            return response
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    finally:
        if os.path.exists(input_path): os.remove(input_path)
        if os.path.exists(output_path): os.remove(output_path)

@csrf_exempt
@api_view(['POST'])
def pdf_to_excel(request):
    input_path, original_name = handle_upload(request)
    if not input_path:
        return JsonResponse({'error': 'No file uploaded'}, status=400)
    
    output_path = input_path.replace('.pdf', '.xlsx')
    try:
        wb = openpyxl.Workbook()
        ws = wb.active
        
        with pdfplumber.open(input_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    for line in text.split('\n'):
                        ws.append([line])
                        
        wb.save(output_path)
        
        with open(output_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="{os.path.splitext(original_name)[0]}.xlsx"'
            return response
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    finally:
        if os.path.exists(input_path): os.remove(input_path)
        if os.path.exists(output_path): os.remove(output_path)

@csrf_exempt
@api_view(['POST'])
def pptx_to_pdf(request):
    input_path, original_name = handle_upload(request)
    if not input_path:
        return JsonResponse({'error': 'No file uploaded'}, status=400)
    
    output_path = input_path.replace('.pptx', '.pdf').replace('.ppt', '.pdf')
    try:
        prs = Presentation(input_path)
        c = canvas.Canvas(output_path, pagesize=letter)
        for slide in prs.slides:
            y = 700
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    c.drawString(50, y, shape.text[:100])
                    y -= 20
            c.showPage()
        c.save()
        
        with open(output_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{os.path.splitext(original_name)[0]}.pdf"'
            return response
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    finally:
        if os.path.exists(input_path): os.remove(input_path)
        if os.path.exists(output_path): os.remove(output_path)

@csrf_exempt
@api_view(['POST'])
def pdf_to_pptx(request):
    input_path, original_name = handle_upload(request)
    if not input_path:
        return JsonResponse({'error': 'No file uploaded'}, status=400)
    
    output_path = input_path.replace('.pdf', '.pptx')
    try:
        prs = Presentation()
        title_slide_layout = prs.slide_layouts[0]
        
        with pdfplumber.open(input_path) as pdf:
            for page in pdf.pages:
                slide = prs.slides.add_slide(title_slide_layout)
                title = slide.shapes.title
                title.text = page.extract_text()[:50] if page.extract_text() else "Slide"
                
        prs.save(output_path)
        
        with open(output_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/vnd.openxmlformats-officedocument.presentationml.presentation')
            response['Content-Disposition'] = f'attachment; filename="{os.path.splitext(original_name)[0]}.pptx"'
            return response
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    finally:
        if os.path.exists(input_path): os.remove(input_path)
        if os.path.exists(output_path): os.remove(output_path)
