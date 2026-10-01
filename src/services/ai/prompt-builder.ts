import { DocumentType } from "@/types";
import { getSchemaForDocumentType } from "@/modules/schemas";

export function buildGemmaExtractionPrompt(
  docType: DocumentType,
  documentName: string,
  content: string
): string {
  const schemaConfig = getSchemaForDocumentType(docType);

  return `You are Gemma, an advanced AI Criminal Network Analysis Intelligence Agent for Cinder Bound.
Analyze the provided evidentiary document and extract structured entities, criminal events, and cross-entity relationships.

DOCUMENT METADATA:
- Name: ${documentName}
- Type: ${schemaConfig.name} (${docType})

DOCUMENT EXTRACTION GUIDELINES:
${schemaConfig.promptInstructions}

ALLOWED ENTITY TYPES:
- PERSON: Suspects, victims, witnesses, associates, account holders.
- PHONE: Mobile phone numbers, SIM cards, MSISDNs.
- BANK_ACCOUNT: Bank account numbers, UPI IDs, crypto wallets.
- LOCATION: Addresses, crime scenes, cell tower locations, cities, safe houses.
- ORGANIZATION: Shell companies, gangs, banks, front businesses, syndicates.
- VEHICLE: Cars, bikes, registration numbers, getaway vehicles.
- EVENT: Crimes, meetings, police raids, arrests, murders, extortions.
- TRANSACTION: Money transfers, cash drop-offs, hawala payments.

ALLOWED RELATIONSHIP TYPES:
- USES: (PERSON -> PHONE, PERSON -> VEHICLE)
- OWNS: (PERSON/ORG -> BANK_ACCOUNT, PERSON -> VEHICLE)
- CALLED: (PHONE -> PHONE)
- TRANSFERRED_TO: (BANK_ACCOUNT -> BANK_ACCOUNT)
- LOCATED_AT: (PERSON/EVENT/VEHICLE -> LOCATION)
- ASSOCIATED_WITH: (PERSON -> PERSON, PERSON -> ORGANIZATION)

CRITICAL PROVENANCE REQUIREMENT:
For every extracted entity, event, and relationship:
1. Provide the exact "sourceText" quoted verbatim from the document where the item was found.
2. Estimate the "page" number (default to 1 if not specified).

OUTPUT FORMAT:
Return ONLY a valid, raw JSON object (no markdown code blocks, no backticks, no explanatory commentary) with this exact schema:
{
  "entities": [
    {
      "id": "e_person_ravi_kumar",
      "name": "Ravi Kumar",
      "type": "PERSON",
      "properties": {
        "role": "Accused",
        "alias": "Ravi Shooter"
      },
      "provenance": {
        "sourceText": "Accused Ravi Kumar s/o Ramesh Chand...",
        "page": 1,
        "confidence": 0.95
      }
    }
  ],
  "events": [
    {
      "id": "ev_robbery_sector_18",
      "name": "Armed Robbery at Jeweler",
      "type": "ROBBERY",
      "timestamp": "2024-03-15T14:30:00",
      "description": "Armed robbery committed at Sector 18 Noida market",
      "location": "Sector 18 Noida",
      "provenance": {
        "sourceText": "incident occurred on 15/03/2024 at 14:30 hrs...",
        "page": 1,
        "confidence": 0.9
      }
    }
  ],
  "relationships": [
    {
      "id": "rel_ravi_uses_phone",
      "source": "e_person_ravi_kumar",
      "target": "e_phone_9876543210",
      "type": "USES",
      "label": "Uses mobile number",
      "properties": {
        "verified": true
      },
      "provenance": {
        "sourceText": "mobile phone 9876543210 recovered from possession of Ravi Kumar",
        "page": 1,
        "confidence": 0.95
      }
    }
  ]
}

DOCUMENT CONTENT:
---
${content}
---`;
}
