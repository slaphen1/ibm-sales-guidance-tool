import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { parseFile } from "@/services/files/parser";
import type { ParsedFile } from "@/types";

export const config = {
  api: {
    bodyParser: false, // Required for formidable to handle multipart
  },
};

type ApiResponse = { files: ParsedFile[] } | { error: string };

/**
 * POST /api/upload
 *
 * Accepts multipart form data with one or more file uploads.
 * Returns parsed plain-text content for each file.
 *
 * Supported formats: .docx, .pdf, .xlsx, .xls, .csv
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10 MB limit

  try {
    const [, files] = await form.parse(req);

    const parsed: ParsedFile[] = [];

    for (const fileArray of Object.values(files)) {
      if (!fileArray) continue;
      for (const file of fileArray) {
        const buffer = fs.readFileSync(file.filepath);
        const parsedFile = await parseFile(
          buffer,
          file.originalFilename ?? file.newFilename,
          file.mimetype ?? ""
        );
        parsed.push(parsedFile);
        // Clean up temp file
        fs.unlinkSync(file.filepath);
      }
    }

    return res.status(200).json({ files: parsed });
  } catch (err) {
    console.error("[Upload API route error]", err);
    return res.status(500).json({ error: "Failed to parse uploaded files" });
  }
}
