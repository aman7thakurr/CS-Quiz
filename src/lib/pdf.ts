// pdf-parse must run in Node.js runtime
import pdfParse from "pdf-parse";

export interface ExtractedPdfResult {
  text: string;
  numPages: number;
  charCount: number;
  isScannedLikely: boolean;
  warning?: string;
}

/**
 * Extract clean text and metadata from a PDF buffer
 */
export async function extractPdfText(buffer: Buffer): Promise<ExtractedPdfResult> {
  const data = await pdfParse(buffer);

  const rawText = data.text || "";
  const cleanText = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const charCount = cleanText.length;
  const numPages = data.numpages || 1;

  // Average chars per page in a normal text PDF is > 300
  // If char count is very low compared to page count, it's likely scanned/image-only
  const avgCharsPerPage = charCount / numPages;
  const isScannedLikely = avgCharsPerPage < 80;

  let warning: string | undefined;
  if (isScannedLikely) {
    warning =
      "This PDF appears to be scanned or image-based (OCR is not supported). Very little text was detected. Please upload a text-based PDF for best results.";
  }

  return {
    text: cleanText,
    numPages,
    charCount,
    isScannedLikely,
    warning,
  };
}

/**
 * Split text into overlapping chunks of ~4000 characters
 */
export function chunkText(
  text: string,
  chunkSize: number = 4000,
  overlap: number = 300
): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < text.length) {
      // Try to break at a paragraph or sentence boundary
      const nextBreak = text.lastIndexOf("\n\n", endIndex);
      if (nextBreak > startIndex + chunkSize * 0.7) {
        endIndex = nextBreak;
      } else {
        const sentenceBreak = text.lastIndexOf(". ", endIndex);
        if (sentenceBreak > startIndex + chunkSize * 0.7) {
          endIndex = sentenceBreak + 1;
        }
      }
    }

    chunks.push(text.slice(startIndex, endIndex).trim());
    startIndex = endIndex - overlap;
  }

  return chunks.filter((c) => c.length > 50);
}
