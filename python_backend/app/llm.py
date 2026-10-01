import json,httpx,re
class Ollama:
    def __init__(self):
        import os
        self.base=os.getenv('OLLAMA_BASE_URL','http://127.0.0.1:11434').rstrip('/')
        self.model=os.getenv('OLLAMA_MODEL','gemma4:2b')
        self.timeout=float(os.getenv('OLLAMA_TIMEOUT','180'))
    async def json(self,system,user):
        payload={'model':self.model,'stream':False,'format':'json','messages':[{'role':'system','content':system},{'role':'user','content':'Return ONLY valid JSON. Never invent unsupported values. '+user}],'options':{'temperature':0}}
        async with httpx.AsyncClient(timeout=self.timeout) as c:
            r=await c.post(self.base+'/api/chat',json=payload); r.raise_for_status()
        raw=r.json()['message']['content'].strip()
        if raw.startswith('```'):
            raw=re.sub(r'^```(?:json)?\s*','',raw,flags=re.IGNORECASE)
            raw=re.sub(r'\s*```$','',raw)
        return json.loads(raw)
