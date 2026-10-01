# Cinder Bound — AI-Powered Criminal Network Analysis System

> **Smart India Hackathon (SIH) Prototype**  
> Proving the core intelligence vertical slice:  
> **Evidence → AI Extraction → Structured JSON → Connected Graph ↔ Original Evidence**

---

## Overview

**Cinder Bound** is an intelligence analysis workspace designed for law enforcement, investigative agencies, and crime analysts. It ingests unorganized police evidence files—such as **First Information Reports (FIRs)**, **Call Detail Records (CDRs)**, **Bank Account Statements**, and **Field Dossiers**—uses **Gemma AI** to extract entities and criminal linkages into structured JSON, and constructs an **interactive, provable graph**.

Every entity, suspect, phone number, vehicle, and bank account on the graph retains verifiable provenance linking back to the exact paragraph, line, and page of the original source evidence.

---

## Key Features

- **Evidence Vault (Sidebar)**:
  - Multi-file drag-and-drop uploads supporting **PDF**, **CSV**, **TXT**, and **DOC/DOCX**.
  - Automatic document type detection (FIR, CDR, Bank Statement, Police Report).
  - Preloaded demonstration intelligence pack for instant one-click evaluation.
  - In-browser document inspection with highlighted source text.

- **AI Extraction Pipeline (Gemma)**:
  - Document-type specific schema prompts.
  - Extracts 8 core entity types: `PERSON`, `PHONE`, `BANK_ACCOUNT`, `LOCATION`, `ORGANIZATION`, `VEHICLE`, `EVENT`, `TRANSACTION`.
  - Extracts 6 relationship types: `USES`, `OWNS`, `CALLED`, `TRANSFERRED_TO`, `LOCATED_AT`, `ASSOCIATED_WITH`.
  - Zero-configuration local heuristic simulation engine for offline demos, plus live cloud Gemma/Gemini integration.

- **Interactive Canvas (React Flow)**:
  - Fluid pan, zoom, drag, and search across criminal entities.
  - Distinct color-coded nodes with link degree and property indicators.
  - Filter by entity type (`PERSON`, `PHONE`, `BANK_ACCOUNT`, etc.).
  - Side Inspector showing extracted properties and confidence score.
  - **Evidence Provenance**: Click any node or relationship to jump directly to the original document snippet!

- **100% Local & Private**:
  - Saved files and workspace state are stored locally in the browser (`localStorage`).
  - No mandatory backend or remote database required for the prototype.
  - Export and import workspace state as portable JSON.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Click **"Enter Workspace"** to launch the investigator canvas.
- The workspace automatically loads the pre-configured **Demonstration Intelligence Pack** showing linked robbery FIRs, CDR calls, Axis Bank transfers, and Special Cell dossiers.
- Click any node (e.g. `Ravi Kumar` or `A/C 918020019283741`) and click **"Inspect in Original Evidence"** to see provenance highlighting!

---

## Project Structure

```text
src/
├── app/
│   ├── page.tsx                     # Minimal Modern SaaS Landing Page
│   ├── workspace/
│   │   └── page.tsx                 # Investigator Workspace (Sidebar + Canvas + Inspector)
│   ├── layout.tsx                   # Dark theme root layout with PDF.js
│   └── globals.css                  # Tailored intelligence dark theme styles
├── components/
│   ├── workspace/                   # Workspace Header & Settings Modal
│   ├── evidence/                    # Evidence Sidebar & Document Inspector
│   └── graph/                       # Graph Canvas & Custom Criminal Node
├── modules/
│   ├── schemas/                     # Independent schema definitions (FIR, CDR, Bank, Generic)
│   └── graph/                       # Graph Builder & cross-document entity deduplication
├── services/
│   ├── ai/                          # AI Provider Abstraction (Gemma, Heuristic, Prompts)
│   ├── parser/                      # Client-side PDF, CSV, and text extractors
│   ├── ocr/                         # OCR interface abstraction
│   └── storage/                     # Local browser vault storage service
├── types/                           # Core TypeScript data models
└── config/                          # Demo intelligence files & configuration
```

---

## Documentation

Detailed architectural and technical guides:

* [ARCHITECTURE.md](file:///d:/SIH-Project/ARCHITECTURE.md) — System design, data flow, and modular architecture.
* [AI.md](file:///d:/SIH-Project/AI.md) — Gemma AI extraction prompt schema, provenance requirements, and provider abstraction.
* [DATA_MODEL.md](file:///d:/SIH-Project/DATA_MODEL.md) — Entities, relationships, and JSON schema definitions.
* [API.md](file:///d:/SIH-Project/API.md) — Internal service contracts and extension hooks.
* [SETUP.md](file:///d:/SIH-Project/SETUP.md) — Step-by-step setup, configuration, and model customization guide.

## Python Server 

python -m uvicorn app.main:app --port 8000
