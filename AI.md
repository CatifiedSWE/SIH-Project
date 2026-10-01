# AI Extraction Engine — Cinder Bound

## 1. Principles of AI Extraction

In Cinder Bound:
1. **The AI generates JSON, not the visual graph.**
2. **Every extracted entity and relationship MUST retain verbatim provenance.**
3. **The AI provider is strictly abstracted** so models can be swapped without touching graph or UI code.

---

## 2. Gemma Prompt Schema

The AI extraction prompt instructs Gemma to analyze evidentiary text and return strict valid JSON matching the following structure:

```json
{
  "entities": [
    {
      "id": "person_ravi_kumar",
      "name": "Ravi Kumar",
      "type": "PERSON",
      "properties": {
        "role": "Accused",
        "alias": "Ravi Shooter"
      },
      "provenance": {
        "sourceText": "Accused Ravi Kumar s/o Ramesh Chand... Mobile: +91 9876543210",
        "page": 1,
        "confidence": 0.95
      }
    }
  ],
  "events": [
    {
      "id": "event_armed_robbery",
      "name": "Armed Robbery at Verma Jewellers",
      "type": "ROBBERY",
      "timestamp": "2024-03-14T14:15:00",
      "description": "Armed robbery committed at Sector 18 Noida market",
      "location": "Sector 18 Noida",
      "provenance": {
        "sourceText": "On 14-03-2024 at approximately 14:15 hrs, two armed assailants...",
        "page": 1,
        "confidence": 0.92
      }
    }
  ],
  "relationships": [
    {
      "id": "rel_ravi_uses_phone",
      "source": "person_ravi_kumar",
      "target": "phone_9876543210",
      "type": "USES",
      "label": "Registered Phone",
      "properties": {
        "verified": true
      },
      "provenance": {
        "sourceText": "mobile handset recovered from possession of accused Ravi Kumar bearing MSISDN 9876543210",
        "page": 1,
        "confidence": 0.96
      }
    }
  ]
}
```

---

## 3. Supported Entity & Relationship Types

### Entity Types
- `PERSON`: Suspects, complainants, accomplices, account owners.
- `PHONE`: Mobile numbers, MSISDNs, SIM identifiers.
- `BANK_ACCOUNT`: Bank accounts, UPI handles, crypto addresses.
- `LOCATION`: Crime scenes, BTS cell towers, hideouts, addresses.
- `ORGANIZATION`: Front companies, gangs, banks, transport syndicates.
- `VEHICLE`: Getaway cars, motorcycles, registration numbers.
- `EVENT`: Crimes, FIR registrations, police raids, arrests.
- `TRANSACTION`: Wire transfers, cash hauls, hawala settlements.

### Relationship Types
- `USES`: `PERSON` → `PHONE` or `PERSON` → `VEHICLE`
- `OWNS`: `PERSON` → `BANK_ACCOUNT` or `PERSON` → `VEHICLE`
- `CALLED`: `PHONE` → `PHONE` (includes call duration and frequency)
- `TRANSFERRED_TO`: `BANK_ACCOUNT` → `BANK_ACCOUNT` (includes transfer amount)
- `LOCATED_AT`: `PERSON` / `VEHICLE` / `EVENT` → `LOCATION`
- `ASSOCIATED_WITH`: Cross-person criminal complicity or organizational links

---

## 4. Dual Provider Architecture

### 1. Live Gemma / Gemini Provider (`gemma-provider.ts`)
- Direct integration with Google Generative AI REST API.
- Configured via `NEXT_PUBLIC_GEMINI_API_KEY` or workspace settings modal.
- Generates outputs using `gemini-1.5-flash` or `gemma-2-9b-it`.

### 2. Heuristic Gemma Engine (`heuristic-provider.ts`)
- Built-in deterministic pattern engine.
- Extracts Indian phone numbers (`+91`), bank accounts, vehicle license plates (`UP 16 AB 9081`), suspect names, and transactions.
- Produces identical schema outputs with verbatim sentence-level source provenance.
- Ensures the prototype functions 100% reliably in zero-internet or credential-free hackathon environments.
