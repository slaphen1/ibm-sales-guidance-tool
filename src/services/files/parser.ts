import mammoth from "mammoth";
import * as XLSX from "xlsx";
import type { ParsedFile } from "@/types";

// pdf-parse ships CJS only — import via require to avoid ESM default export issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;

/**
 * Parse an uploaded file buffer into plain text based on its MIME type or extension.
 */
export async function parseFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ParsedFile> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  let content = "";

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    content = result.value.trim();
  } else if (mimeType === "application/pdf" || ext === "pdf") {
    const result = await pdfParse(buffer);
    content = result.text.trim();
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    ext === "xlsx" ||
    ext === "xls"
  ) {
    content = parseSpreadsheet(buffer);
  } else if (mimeType === "text/csv" || ext === "csv") {
    content = parseSpreadsheet(buffer);
  } else {
    // Fallback — treat as plain text
    content = buffer.toString("utf-8").trim();
  }

  return {
    fileName,
    fileType: ext,
    content,
  };
}

/**
 * Convert a spreadsheet (xlsx or csv) to a plain text table representation.
 */
function parseSpreadsheet(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const lines: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_csv(sheet);
    lines.push(`--- Sheet: ${sheetName} ---`);
    lines.push(rows.trim());
  }

  return lines.join("\n\n");
}
