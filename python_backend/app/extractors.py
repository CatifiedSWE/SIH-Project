from pathlib import Path
import re
import pandas as pd
from pypdf import PdfReader
import fitz
from docx import Document
from PIL import Image
import pytesseract

IMAGE={'.png','.jpg','.jpeg','.webp','.tif','.tiff','.bmp'}

def clean(s):
    s=(s or '').replace('\x00','')
    return re.sub(r'\n{3,}','\n\n',re.sub(r'[ \t]+',' ',s)).strip()

def extract_file(path,name):
    ext=Path(name).suffix.lower(); pages=[]
    if ext=='.pdf':
        try:
            pdf=fitz.open(path)
            for i,page in enumerate(pdf,1):
                text=clean(page.get_text())
                kind='page'
                if not text:
                    try:
                        reader=PdfReader(path)
                        if i-1 < len(reader.pages):
                            text=clean(reader.pages[i-1].extract_text())
                    except Exception: pass
                if not text:
                    try:
                        pix=page.get_pixmap(matrix=fitz.Matrix(2,2),alpha=False)
                        img=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
                        text=clean(pytesseract.image_to_string(img)); kind='page_ocr'
                    except Exception: pass
                pages.append({'page_or_row':i,'kind':kind,'text':text})
            pdf.close()
        except Exception:
            try:
                reader=PdfReader(path)
                for i,p in enumerate(reader.pages,1):
                    pages.append({'page_or_row':i,'kind':'page','text':clean(p.extract_text())})
            except Exception as e:
                raise ValueError(f"Failed to read PDF file: {e}")
    elif ext in IMAGE:
        try:
            pages=[{'page_or_row':1,'kind':'image','text':clean(pytesseract.image_to_string(Image.open(path)))}]
        except pytesseract.TesseractNotFoundError:
            raise RuntimeError('Tesseract OCR is not installed or not in PATH. Please install Tesseract to extract text from image files.')
    elif ext=='.docx':
        pages=[{'page_or_row':1,'kind':'document','text':clean('\n'.join(p.text for p in Document(path).paragraphs if p.text.strip()))}]
    elif ext in {'.txt','.md','.log'}:
        pages=[{'page_or_row':1,'kind':'text','text':clean(Path(path).read_text(encoding='utf-8',errors='replace'))}]
    elif ext=='.csv':
        df=pd.read_csv(path,dtype=str,keep_default_na=False)
        pages=[{'page_or_row':i+2,'kind':'row','text':' | '.join(f'{k}={v}' for k,v in r.to_dict().items() if str(v).strip())} for i,r in df.iterrows()]
    elif ext=='.xlsx':
        n=1
        for sheet,df in pd.read_excel(path,sheet_name=None,dtype=str).items():
            for _,r in df.fillna('').iterrows():
                pages.append({'page_or_row':n,'kind':'row','text':f'sheet={sheet} | '+' | '.join(f'{k}={v}' for k,v in r.to_dict().items() if str(v).strip())}); n+=1
    else: raise ValueError(f'Unsupported file type: {ext}')
    return {'document':name,'pages':pages}

def deterministic(source):
    out={k:[] for k in ['phone_numbers','dates','vehicle_numbers','account_numbers','ifsc_codes','case_ids','transaction_ids']}
    pats={
      'phone_numbers':r'(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)',
      'dates':r'\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b',
      'vehicle_numbers':r'\b[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{1,4}\b',
      'account_numbers':r'(?i)\b(?:account|a/c|acct(?:ount)?)\s*(?:no\.?|number)?\s*[:#-]?\s*\d{6,20}\b',
      'ifsc_codes':r'\b[A-Z]{4}0[A-Z0-9]{6}\b',
      'case_ids':r'(?i)\b(?:FIR|CASE|CRIME|CSR|C\.R\.)\s*(?:NO\.?|ID)?\s*[:#-]?\s*[A-Z0-9./-]{2,30}\b',
      'transaction_ids':r'(?i)\b(?:UTR|RRN|TXN|TRANSACTION)\s*(?:NO\.?|ID)?\s*[:#-]?\s*[A-Z0-9-]{5,40}\b'}
    for p in source['pages']:
        for field,pat in pats.items():
            for m in re.finditer(pat,p['text']): out[field].append({'value':m.group(0).strip(),'source':{'document':source['document'],'page_or_row':p['page_or_row'],'exact_text':m.group(0).strip()}})
    return out
