export function parsePlainText(content: string): string {
  // Normalize line endings, remove non-printable characters while preserving indentation
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}
