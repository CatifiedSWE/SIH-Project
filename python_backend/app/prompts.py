import json

TYPES = {
    'FIR': ['fir_or_case_id', 'police_station', 'date', 'incident_date', 'complainant', 'victim', 'accused_or_suspect', 'incident_location', 'offences', 'incident_summary'],
    'CDR': ['phone_number', 'other_party_number', 'call_date', 'call_time', 'duration', 'call_type', 'cell_location', 'imei', 'imsi'],
    'BANK_STATEMENT': ['account_number', 'account_holder', 'bank_name', 'ifsc', 'transaction_date', 'transaction_id', 'description', 'debit', 'credit', 'balance', 'counterparty'],
    'INTELLIGENCE_REPORT': ['report_id', 'date', 'source_or_author', 'subjects', 'locations', 'organizations', 'events', 'findings', 'summary'],
    'UNKNOWN': ['title', 'dates', 'people', 'organizations', 'locations', 'phones', 'vehicles', 'accounts', 'events', 'facts', 'summary']
}
ALLOWED = set(TYPES)

def get_raw_text(source):
    """Extracts the full text as it is from the source pages, without any JSON structure."""
    if isinstance(source, dict) and 'pages' in source:
        return '\n\n'.join(p.get('text', '') for p in source['pages'] if p.get('text'))
    return str(source)

def classify(text):
    return (
        'Classify this evidentiary document into exactly one of: FIR, CDR, BANK_STATEMENT, INTELLIGENCE_REPORT, UNKNOWN.\n'
        'Return JSON: {"document_type":"...","confidence":0.0,"reason":"brief evidence-based reason","source":{"page_or_row":1,"exact_text":"short supporting quote"}}\n\n'
        'DOCUMENT TEXT (AS IS):\n'
        '---\n'
        + text[:24000]
        + '\n---'
    )

def extract(doc_type, source, det=None):
    fields = TYPES.get(doc_type, TYPES['UNKNOWN'])
    raw_document_text = get_raw_text(source)

    return f'''You are an expert criminal network analysis and intelligence extraction agent.
Read the full document text below exactly as it is, and extract all criminal entities, persons, accounts, phones, vehicles, locations, and events into JSON.

Allowed entity fields: {json.dumps(fields)}

DOCUMENT TEXT (AS IS):
---
{raw_document_text[:45000]}
---

Extract all facts from the text above. Return ONLY a valid JSON object matching this schema:
{{
  "document_type": "{doc_type}",
  "fields": {{
    "accused_or_suspect": {{"value": "Suspect Name", "source": {{"page_or_row": 1, "exact_text": "verbatim quote from text"}}}},
    "incident_location": {{"value": "Location Name", "source": {{"page_or_row": 1, "exact_text": "verbatim quote from text"}}}}
  }},
  "records": []
}}
For narrative documents like FIR or reports, populate "fields". For tabular rows like CDR or Bank, populate "records".
Do not invent anything. Use exact verbatim quotes for source text.
Return ONLY valid JSON:'''

def supervisor_coverage(doc_type, source):
    raw_document_text = get_raw_text(source)
    return f'''You are the Extraction Supervisor. Read the full document text below and audit what important information categories appear.
Return JSON: {{"status":"PASS|REVIEW","important_data_seen":["category"],"possible_missing_categories":["category"],"notes":["brief source note"]}}

DOCUMENT TYPE: {doc_type}

DOCUMENT TEXT (AS IS):
---
{raw_document_text[:45000]}
---'''

def supervisor_citations(extracted, source):
    raw_document_text = get_raw_text(source)
    return f'''You are the Extraction Supervisor. Check whether the extracted entities below actually appear in the source text.
Return JSON: {{"status":"PASS|REVIEW","issues":[{{"type":"UNSUPPORTED_VALUE|BAD_CITATION","field_or_record":"name","reason":"brief reason","source_check":"what was checked"}}]}}

EXTRACTED DATA:
{json.dumps(extracted)}

DOCUMENT TEXT (AS IS):
---
{raw_document_text[:45000]}
---'''
