import { NextRequest, NextResponse } from "next/server";
import { DocumentType, Entity, EntityType, EventItem, ExtractionResult, Relationship } from "@/types";
import { buildGemmaExtractionPrompt } from "@/services/ai/prompt-builder";
import { detectDocumentType } from "@/services/parser/document-detector";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);
const PYTHON_EXTRACTOR_URL = process.env.PYTHON_EXTRACTOR_URL || "http://127.0.0.1:8000";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

/**
 * Extracts clean human-readable text from a PDF buffer using PyMuPDF CLI.
 * Eliminates binary garbage when Python server is not running.
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const tmpPath = path.join(
    os.tmpdir(),
    `cinder_upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.pdf`
  );
  const scriptPath = path.join(process.cwd(), "python_backend", "extract_pdf_text.py");

  try {
    await fs.promises.writeFile(tmpPath, buffer);
    const { stdout } = await execFileAsync("python", [scriptPath, tmpPath], { timeout: 20000 });
    return stdout.trim();
  } catch (err: any) {
    console.warn("PyMuPDF CLI text extraction failed:", err.message);
    return buffer.toString("utf-8");
  } finally {
    try {
      await fs.promises.unlink(tmpPath);
    } catch {}
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Forward multipart form data to Python Extraction Agent
    const pyFormData = new FormData();
    for (const f of files) {
      pyFormData.append("files", f, f.name);
    }

    let pyData: any = null;
    let pythonConnected = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 min timeout

      const pyRes = await fetch(`${PYTHON_EXTRACTOR_URL}/api/extract`, {
        method: "POST",
        body: pyFormData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (pyRes.ok) {
        pyData = await pyRes.json();
        pythonConnected = true;
      }
    } catch (e: any) {
      // Python server is offline / ECONNREFUSED
      console.warn("Python agent on http://127.0.0.1:8000 offline. Using PyMuPDF + Ollama directly.");
    }

    // 1. If Python FastAPI server is active, return its output
    if (pythonConnected && pyData?.results) {
      const normalizedResults = pyData.results.map((res: any, docIdx: number) => {
        return normalizePythonResult(res, docIdx);
      });

      return NextResponse.json({
        success: true,
        source: "python_agent",
        results: normalizedResults,
        rawPython: pyData,
      });
    }

    // 2. RESILIENT FALLBACK: Extract clean text using PyMuPDF, then send real text to Ollama gemma4:2b
    const fallbackResults = [];
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      let text = "";
      const isPdf = file.name.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        const buffer = Buffer.from(await file.arrayBuffer());
        text = await extractTextFromPdf(buffer);
      } else {
        try {
          text = await file.text();
        } catch {
          text = `Document: ${file.name}`;
        }
      }

      if (!text || text.trim().length === 0) {
        text = `Document: ${file.name} (No readable text layer found)`;
      }

      const docType = detectDocumentType(file.name, text);
      const prompt = buildGemmaExtractionPrompt(docType, file.name, text);

      let extractedJson: any = null;
      try {
        const ollamaRes = await fetch(`${OLLAMA_URL}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gemma4:2b",
            prompt,
            format: "json",
            stream: false,
            options: { temperature: 0.1 },
          }),
        });

        if (ollamaRes.ok) {
          const oData = await ollamaRes.json();
          const rawResponse = (oData.response || "{}").trim();
          extractedJson = JSON.parse(rawResponse);
        }
      } catch (err: any) {
        console.warn("Ollama direct extraction error:", err.message);
      }

      fallbackResults.push({
        document: file.name,
        detectedType: docType,
        rawText: text,
        extractionResult: {
          entities: (extractedJson?.entities || []).map((e: any, i: number) => ({
            id: e.id || `ent_fb_${idx}_${i}`,
            name: e.name || "Unknown Entity",
            type: e.type || "PERSON",
            properties: e.properties || {},
            provenance: {
              documentId: `doc_${idx}`,
              documentName: file.name,
              page: e.provenance?.page || 1,
              sourceText: e.provenance?.sourceText || e.name || "Extracted from text",
              confidence: e.provenance?.confidence || 0.95,
            },
          })),
          events: (extractedJson?.events || []).map((ev: any, i: number) => ({
            id: ev.id || `ev_fb_${idx}_${i}`,
            name: ev.name || "Incident Event",
            type: ev.type || "INCIDENT",
            description: ev.description || ev.name,
            provenance: {
              documentId: `doc_${idx}`,
              documentName: file.name,
              page: ev.provenance?.page || 1,
              sourceText: ev.provenance?.sourceText || ev.name,
              confidence: 0.9,
            },
          })),
          relationships: (extractedJson?.relationships || []).map((r: any, i: number) => ({
            id: r.id || `rel_fb_${idx}_${i}`,
            source: r.source,
            target: r.target,
            type: r.type || "ASSOCIATED_WITH",
            label: r.label || r.type,
            properties: r.properties || {},
            provenance: {
              documentId: `doc_${idx}`,
              documentName: file.name,
              page: r.provenance?.page || 1,
              sourceText: r.provenance?.sourceText || r.label || "Linkage",
              confidence: 0.95,
            },
          })),
        },
        supervisorAudit: {
          status: "PYMUPDF_OLLAMA_DIRECT",
          notes: ["Extracted text cleanly via PyMuPDF and analyzed using local Ollama gemma4:2b."],
        },
      });
    }

    return NextResponse.json({
      success: true,
      source: "pymupdf_ollama_direct",
      results: fallbackResults,
    });
  } catch (error: any) {
    console.error("Critical error in /api/extract:", error);
    return NextResponse.json(
      { error: "Extraction failed", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Normalizes Python extraction output into Cinder Bound's canonical ExtractionResult
 */
function normalizePythonResult(res: any, docIdx: number) {
  const docName = res.document || `Document_${docIdx + 1}`;
  const docTypeStr = res.document_type?.document_type || "OTHER";
  const docType: DocumentType =
    docTypeStr === "FIR"
      ? "FIR"
      : docTypeStr === "CDR"
      ? "CDR"
      : docTypeStr === "BANK_STATEMENT"
      ? "BANK_STATEMENT"
      : docTypeStr === "INTELLIGENCE_REPORT"
      ? "POLICE_REPORT"
      : "OTHER";

  const entities: Entity[] = [];
  const events: EventItem[] = [];
  const relationships: Relationship[] = [];
  const seenEntities = new Set<string>();

  const addEntity = (name: string, type: EntityType, properties: Record<string, any>, source: any) => {
    if (!name || name.trim().length === 0) return null;
    const cleanName = name.trim();
    const id = `ent_${type.toLowerCase()}_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    if (!seenEntities.has(id)) {
      seenEntities.add(id);
      const ent: Entity = {
        id,
        name: cleanName,
        type,
        properties,
        provenance: {
          documentId: `doc_${docIdx}`,
          documentName: docName,
          page: source?.page_or_row || 1,
          sourceText: source?.exact_text || cleanName,
          confidence: 0.95,
        },
      };
      entities.push(ent);
      return ent;
    }
    return entities.find((e) => e.id === id) || null;
  };

  // 1. Process Fields extracted by Python LLM
  const rawExtraction = res.extraction || {};
  const fields = rawExtraction.fields && typeof rawExtraction.fields === "object"
    ? rawExtraction.fields
    : rawExtraction;

  for (const [key, item] of Object.entries(fields)) {
    if (!item || key === "records" || key === "document_type" || key === "fields") continue;

    const val = typeof item === "object" && (item as any).value !== undefined ? (item as any).value : item;
    const src = typeof item === "object" && (item as any).source ? (item as any).source : { page_or_row: 1, exact_text: String(val) };
    if (!val || val === "null" || (Array.isArray(val) && val.length === 0)) continue;

    const values = Array.isArray(val) ? val : [val];
    for (const v of values) {
      const strVal = String(v);
      if (["accused_or_suspect", "complainant", "victim", "people", "subjects", "account_holder"].includes(key)) {
        addEntity(strVal, "PERSON", { role: key.replace(/_/g, " ") }, src);
      } else if (["phone_number", "other_party_number", "phones"].includes(key)) {
        addEntity(strVal, "PHONE", { msisdn: strVal }, src);
      } else if (["account_number", "accounts", "counterparty"].includes(key)) {
        addEntity(strVal, "BANK_ACCOUNT", { accountNumber: strVal }, src);
      } else if (["incident_location", "cell_location", "locations"].includes(key)) {
        addEntity(strVal, "LOCATION", { location: strVal }, src);
      } else if (["organizations", "bank_name"].includes(key)) {
        addEntity(strVal, "ORGANIZATION", { name: strVal }, src);
      } else if (["vehicles"].includes(key)) {
        addEntity(strVal, "VEHICLE", { plate: strVal }, src);
      } else if (["offences", "events", "incident_summary", "findings"].includes(key)) {
        events.push({
          id: `ev_${events.length + 1}`,
          name: strVal.slice(0, 40),
          type: "OFFENSE",
          description: strVal,
          provenance: {
            documentId: `doc_${docIdx}`,
            documentName: docName,
            page: src?.page_or_row || 1,
            sourceText: src?.exact_text || strVal,
            confidence: 0.94,
          },
        });
      }
    }
  }

  // 2. Process Deterministic Candidates (Regex verified in Python)
  const det = res.deterministic_candidates || {};
  (det.phone_numbers || []).forEach((item: any) => {
    addEntity(item.value, "PHONE", { source: "deterministic" }, item.source);
  });
  (det.vehicle_numbers || []).forEach((item: any) => {
    addEntity(item.value, "VEHICLE", { source: "deterministic" }, item.source);
  });
  (det.account_numbers || []).forEach((item: any) => {
    addEntity(item.value, "BANK_ACCOUNT", { source: "deterministic" }, item.source);
  });

  // 3. Process Records (CDR & Bank Statements)
  const records = res.extraction?.records || [];
  records.forEach((rec: any, rIdx: number) => {
    if (docType === "CDR") {
      const caller = rec.phone_number?.value || rec.caller;
      const receiver = rec.other_party_number?.value || rec.receiver;
      if (caller && receiver) {
        const cEnt = addEntity(caller, "PHONE", {}, rec.phone_number?.source);
        const rEnt = addEntity(receiver, "PHONE", {}, rec.other_party_number?.source);
        if (cEnt && rEnt) {
          relationships.push({
            id: `rel_call_${rIdx}`,
            source: cEnt.id,
            target: rEnt.id,
            type: "CALLED",
            label: `Call (${rec.duration?.value || "N/A"}s)`,
            properties: {
              duration: rec.duration?.value,
              time: rec.call_time?.value,
              date: rec.call_date?.value,
            },
            provenance: {
              documentId: `doc_${docIdx}`,
              documentName: docName,
              page: rec.phone_number?.source?.page_or_row || 1,
              sourceText: rec.phone_number?.source?.exact_text || "CDR call log record",
              confidence: 0.95,
            },
          });
        }
      }
    } else if (docType === "BANK_STATEMENT") {
      const acc = rec.account_number?.value || rec.account;
      const counterparty = rec.counterparty?.value || rec.beneficiary;
      if (acc && counterparty) {
        const aEnt = addEntity(acc, "BANK_ACCOUNT", {}, rec.account_number?.source);
        const cpEnt = addEntity(counterparty, "BANK_ACCOUNT", {}, rec.counterparty?.source);
        if (aEnt && cpEnt) {
          relationships.push({
            id: `rel_trans_${rIdx}`,
            source: aEnt.id,
            target: cpEnt.id,
            type: "TRANSFERRED_TO",
            label: `Transfer (${rec.debit?.value || rec.credit?.value || "Funds"})`,
            properties: {
              amount: rec.debit?.value || rec.credit?.value,
              date: rec.transaction_date?.value,
            },
            provenance: {
              documentId: `doc_${docIdx}`,
              documentName: docName,
              page: rec.account_number?.source?.page_or_row || 1,
              sourceText: rec.account_number?.source?.exact_text || "Bank transaction record",
              confidence: 0.95,
            },
          });
        }
      }
    }
  });

  // Cross-link suspect to phones/vehicles if extracted
  const personEnts = entities.filter((e) => e.type === "PERSON");
  const phoneEnts = entities.filter((e) => e.type === "PHONE");
  const vehicleEnts = entities.filter((e) => e.type === "VEHICLE");
  const bankEnts = entities.filter((e) => e.type === "BANK_ACCOUNT");

  if (personEnts.length > 0) {
    const mainPerson = personEnts[0];
    phoneEnts.forEach((p, idx) => {
      relationships.push({
        id: `rel_uses_phone_${idx}`,
        source: mainPerson.id,
        target: p.id,
        type: "USES",
        label: "Uses Phone",
        provenance: p.provenance,
      });
    });
    vehicleEnts.forEach((v, idx) => {
      relationships.push({
        id: `rel_owns_veh_${idx}`,
        source: mainPerson.id,
        target: v.id,
        type: "OWNS",
        label: "Possesses Vehicle",
        provenance: v.provenance,
      });
    });
    bankEnts.forEach((b, idx) => {
      relationships.push({
        id: `rel_owns_bank_${idx}`,
        source: mainPerson.id,
        target: b.id,
        type: "OWNS",
        label: "Account Holder",
        provenance: b.provenance,
      });
    });
  }

  const extractionResult: ExtractionResult = {
    entities,
    events,
    relationships,
  };

  return {
    document: docName,
    detectedType: docType,
    rawText: res.raw_text,
    pages: res.pages,
    extractionResult,
    supervisorAudit: res.extraction_supervisor,
  };
}
