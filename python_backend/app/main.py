import asyncio,os,shutil,tempfile,uuid
from pathlib import Path
from fastapi import FastAPI,File,UploadFile
from fastapi.responses import FileResponse,JSONResponse
from .extractors import extract_file,deterministic
from .llm import Ollama
from .prompts import classify,extract,supervisor_coverage,supervisor_citations,ALLOWED
from fastapi.middleware.cors import CORSMiddleware
BASE=Path(__file__).resolve().parent.parent
app=FastAPI(title='Cinderbound Extraction Agent')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
@app.get('/')
async def home(): return FileResponse(BASE/'static'/'index.html')
@app.get('/api/health')
async def health(): return {'ok':True,'model':os.getenv('OLLAMA_MODEL','gemma4:2b')}
async def one(f):
    suffix=Path(f.filename or '').suffix; p=Path(tempfile.gettempdir())/f'cinder_{uuid.uuid4().hex}{suffix}'
    try:
        await f.seek(0)
        with p.open('wb') as out: shutil.copyfileobj(f.file,out)
        source=await asyncio.to_thread(extract_file,str(p),f.filename or 'document')
        text='\n'.join(x['text'] for x in source['pages'])
        if not text.strip(): raise ValueError('No text was extracted from this file.')
        det=await asyncio.to_thread(deterministic,source); llm=Ollama()
        c=await llm.json('You classify evidence documents. Do not infer a type without source evidence.',classify(text))
        typ=c.get('document_type','UNKNOWN'); typ=typ if typ in ALLOWED else 'UNKNOWN'
        # Extraction and supervisor coverage run in parallel.
        e_task=llm.json('You are a strict extraction engine. Extract and restructure only. No correlation or interpretation. Never invent values.',extract(typ,source,det))
        cov_task=llm.json('You are the Extraction Supervisor. Run a parallel coverage audit only; do not extract or interpret.',supervisor_coverage(typ,source))
        e,cov=await asyncio.gather(e_task,cov_task)
        if isinstance(e, dict) and 'fields' not in e:
            known = {'accused_or_suspect','complainant','victim','incident_location','police_station','offences','incident_summary','phone_number','account_number','organizations','vehicles','dates','findings','summary','people','subjects'}
            f_dict = {k: v for k, v in e.items() if k in known or (isinstance(v, dict) and 'value' in v)}
            e = {'document_type': typ, 'fields': f_dict, 'records': e.get('records', [])}
        # Citation checking requires the extraction result, so it runs immediately after.
        cit=await llm.json('You are the Extraction Supervisor. Verify extraction values and citations against source only.',supervisor_citations(e,source))
        return {
            'document': f.filename,
            'document_type': c,
            'extraction': e,
            'deterministic_candidates': det,
            'raw_text': text,
            'pages': source.get('pages', []),
            'extraction_supervisor': {'parallel_coverage_audit': cov, 'citation_audit': cit}
        }
    finally:
        try: p.unlink(missing_ok=True)
        except: pass
        try: await f.close()
        except: pass
@app.post('/api/extract')
async def run(files:list[UploadFile]=File(...)):
    results=[]
    for f in files:
        try: results.append(await one(f))
        except Exception as e: results.append({'document':f.filename,'error':str(e)})
    return {'results':results}
