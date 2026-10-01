import Papa from "papaparse";

export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, string>[];
  formattedText: string;
}

export function parseCsvContent(content: string): ParsedCsvResult {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = result.meta.fields || [];
  const rows = result.data;

  // Format CSV as structured readable text for AI processing and inspection
  let formattedText = `CSV DATA (${rows.length} records):\n`;
  formattedText += `Headers: ${headers.join(" | ")}\n\n`;

  rows.forEach((row, idx) => {
    const rowDetails = Object.entries(row)
      .filter(([_, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    formattedText += `Row ${idx + 1}: ${rowDetails}\n`;
  });

  return {
    headers,
    rows,
    formattedText,
  };
}
