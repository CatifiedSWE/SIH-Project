import { DocumentType } from "@/types";

/**
 * Automatically inspects the raw text content of an uploaded file
 * and detects whether it is an FIR, CDR, Bank Statement, or Police Report.
 */
export function detectDocumentType(fileName: string, textContent: string): DocumentType {
  const lowerName = fileName.toLowerCase();
  const lowerText = textContent.toLowerCase();

  // 1. File name hints
  if (lowerName.includes("fir") || lowerName.includes("complaint")) {
    return "FIR";
  }
  if (lowerName.includes("cdr") || lowerName.includes("call") || lowerName.includes("telecom")) {
    return "CDR";
  }
  if (lowerName.includes("bank") || lowerName.includes("statement") || lowerName.includes("passbook") || lowerName.includes("axis") || lowerName.includes("sbi") || lowerName.includes("hdfc")) {
    return "BANK_STATEMENT";
  }
  if (lowerName.includes("police") || lowerName.includes("report") || lowerName.includes("intel") || lowerName.includes("memo") || lowerName.includes("surveillance")) {
    return "POLICE_REPORT";
  }

  // 2. Text keyword detection
  const firKeywords = ["first information report", "police station", "ipc section", "complainant", "accused", "cr. no", "cognizable", "ps "];
  const firMatches = firKeywords.filter(k => lowerText.includes(k)).length;

  const cdrKeywords = ["caller", "receiver", "calling number", "dialed number", "duration", "imei", "msisdn", "cell id", "tower location", "call type"];
  const cdrMatches = cdrKeywords.filter(k => lowerText.includes(k)).length;

  const bankKeywords = ["account number", "ifsc", "debit", "credit", "balance", "transaction id", "upi", "neft", "rtgs", "bank statement", "branch"];
  const bankMatches = bankKeywords.filter(k => lowerText.includes(k)).length;

  const intelKeywords = ["intelligence memo", "suspect", "confidential", "surveillance", "gang", "syndicate", "operation", "field report"];
  const intelMatches = intelKeywords.filter(k => lowerText.includes(k)).length;

  const maxMatches = Math.max(firMatches, cdrMatches, bankMatches, intelMatches);

  if (maxMatches >= 2) {
    if (firMatches === maxMatches) return "FIR";
    if (cdrMatches === maxMatches) return "CDR";
    if (bankMatches === maxMatches) return "BANK_STATEMENT";
    if (intelMatches === maxMatches) return "POLICE_REPORT";
  }

  // Default fallback if ambiguous
  return "OTHER";
}
