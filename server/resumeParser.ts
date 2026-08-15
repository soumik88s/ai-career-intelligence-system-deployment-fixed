import { createRequire } from "module";
import mammoth from "mammoth";
import fs from "fs";

const require = createRequire(import.meta.url);
const pdfModule = require("pdf-parse");

export interface ParsedResumeResult {
  extractedText: string;
  charCount: number;
  wordCount: number;
  lineCount: number;
  warning?: string;
}

/**
 * Normalizes and cleans raw extracted document text.
 * Structural cleaning only: removes null chars, normalizes newlines, trims whitespace.
 * Does NOT perform NLP or skill extraction.
 */
export function cleanExtractedText(rawText: string): string {
  if (!rawText) return "";

  return rawText
    // Remove null characters
    .replace(/\0/g, "")
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Replace non-breaking spaces and tabs with standard space
    .replace(/[\u00A0\t]/g, " ")
    // Remove excessive consecutive horizontal spaces (keep line breaks)
    .replace(/[ \t]{2,}/g, " ")
    // Trim spaces at the end of lines
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    // Reduce 3+ consecutive newlines to double newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extracts text from a PDF file using pdf-parse.
 */
export async function extractTextFromPdf(filePath: string): Promise<ParsedResumeResult> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    let rawText = "";

    if (typeof pdfModule === "function") {
      const pdfData = await pdfModule(dataBuffer);
      rawText = pdfData?.text || "";
    } else if (pdfModule && typeof pdfModule.PDFParse === "function") {
      const parser = new pdfModule.PDFParse({ data: dataBuffer });
      await parser.load();
      const res = await parser.getText();
      rawText = res?.text || "";
    } else if (pdfModule && typeof pdfModule.default === "function") {
      const pdfData = await pdfModule.default(dataBuffer);
      rawText = pdfData?.text || "";
    } else {
      throw new Error("PDF parser module does not export a compatible function or PDFParse class.");
    }

    const cleanedText = cleanExtractedText(rawText);

    if (!cleanedText || cleanedText.length === 0) {
      return {
        extractedText: "",
        charCount: 0,
        wordCount: 0,
        lineCount: 0,
        warning: "PDF contains no machine-readable text. OCR support can be added later.",
      };
    }

    const words = cleanedText.split(/\s+/).filter(Boolean);
    const lines = cleanedText.split("\n").filter(Boolean);

    return {
      extractedText: cleanedText,
      charCount: cleanedText.length,
      wordCount: words.length,
      lineCount: lines.length,
    };
  } catch (err: any) {
    if (err.message && err.message.includes("encrypted")) {
      throw new Error("Password-protected PDF files are not supported. Please remove password protection and try again.");
    }
    throw new Error(`Failed to parse PDF document: ${err.message || "Invalid or corrupted PDF file."}`);
  }
}

/**
 * Extracts text from a DOCX file using mammoth.
 */
export async function extractTextFromDocx(filePath: string): Promise<ParsedResumeResult> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });

    const rawText = result.value || "";
    const cleanedText = cleanExtractedText(rawText);

    if (!cleanedText || cleanedText.length === 0) {
      return {
        extractedText: "",
        charCount: 0,
        wordCount: 0,
        lineCount: 0,
        warning: "DOCX file contains no readable text content.",
      };
    }

    const words = cleanedText.split(/\s+/).filter(Boolean);
    const lines = cleanedText.split("\n").filter(Boolean);

    return {
      extractedText: cleanedText,
      charCount: cleanedText.length,
      wordCount: words.length,
      lineCount: lines.length,
    };
  } catch (err: any) {
    throw new Error(`Failed to parse DOCX document: ${err.message || "Invalid or corrupted DOCX file."}`);
  }
}

/**
 * Dispatches file parsing based on mimetype or extension.
 */
export async function parseResumeDocument(
  filePath: string,
  mimeType: string,
  originalFilename: string
): Promise<ParsedResumeResult> {
  const extension = originalFilename.split(".").pop()?.toLowerCase() || "";

  if (mimeType === "application/pdf" || extension === "pdf") {
    return await extractTextFromPdf(filePath);
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx"
  ) {
    return await extractTextFromDocx(filePath);
  } else if (mimeType === "text/plain" || extension === "txt") {
    const rawText = fs.readFileSync(filePath, "utf-8");
    const cleanedText = cleanExtractedText(rawText);
    const words = cleanedText.split(/\s+/).filter(Boolean);
    const lines = cleanedText.split("\n").filter(Boolean);
    return {
      extractedText: cleanedText,
      charCount: cleanedText.length,
      wordCount: words.length,
      lineCount: lines.length,
    };
  } else {
    throw new Error(`Unsupported file type (.${extension}). Only PDF and DOCX files are allowed.`);
  }
}
