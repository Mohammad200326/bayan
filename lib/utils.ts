import { TextSegment } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DEFAULT_VOICE, voiceOptions } from "./constants";
import { slugify } from "transliteration";
import { createWorker } from "tesseract.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Serialize Mongoose documents to plain JSON objects (strips ObjectId, Date, etc.)
export const serializeData = <T>(data: T): T =>
  JSON.parse(JSON.stringify(data));

// Auto generate slug
export function generateSlug(text: string): string {
  return slugify(text.replace(/\.[^/.]+$/, ""), {
    lowercase: true,
    separator: "-",
  });
}

// Escape regex special characters to prevent ReDoS attacks
export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Splits text content into segments for MongoDB storage and search
export const splitIntoSegments = (
  text: string,
  segmentSize: number = 500, // Maximum words per segment
  overlapSize: number = 50, // Words to overlap between segments for context
): TextSegment[] => {
  if (segmentSize <= 0) {
    throw new Error("segmentSize must be greater than 0");
  }
  if (overlapSize < 0 || overlapSize >= segmentSize) {
    throw new Error("overlapSize must be >= 0 and < segmentSize");
  }

  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const segments: TextSegment[] = [];

  let segmentIndex = 0;
  let startIndex = 0;

  while (startIndex < words.length) {
    const endIndex = Math.min(startIndex + segmentSize, words.length);
    const segmentWords = words.slice(startIndex, endIndex);
    const segmentText = segmentWords.join(" ");

    segments.push({
      text: segmentText,
      segmentIndex,
      wordCount: segmentWords.length,
    });

    segmentIndex++;

    if (endIndex >= words.length) break;
    startIndex = endIndex - overlapSize;
  }

  return segments;
};

// Get voice data by persona key or voice ID
export const getVoice = (persona?: string) => {
  if (!persona) return voiceOptions[DEFAULT_VOICE];

  const voiceEntry = Object.values(voiceOptions).find((v) => v.id === persona);
  if (voiceEntry) return voiceEntry;

  const voiceByKey = voiceOptions[persona as keyof typeof voiceOptions];
  if (voiceByKey) return voiceByKey;

  return voiceOptions[DEFAULT_VOICE];
};

// Format duration in seconds to MM:SS format
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// تنظيف النص الناتج من OCR
export const cleanOCRText = (text: string): string => {
  return text
    .replace(/\r/g, "")
    .replace(/[ـ]+/g, "") // إزالة التطويل
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

// تحويل canvas إلى blob لاستخدامه مع OCR
export const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to convert canvas to blob"));
          return;
        }
        resolve(blob);
      },
      "image/png",
      1,
    );
  });
};

export async function parsePDFFile(file: File) {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

  try {
    const pdfjsLib = await import("pdfjs-dist");

    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
    }

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    // Render first page as cover image
    const firstPage = await pdfDocument.getPage(1);
    const coverViewport = firstPage.getViewport({ scale: 2 });

    const coverCanvas = document.createElement("canvas");
    coverCanvas.width = Math.ceil(coverViewport.width);
    coverCanvas.height = Math.ceil(coverViewport.height);

    const coverContext = coverCanvas.getContext("2d");
    if (!coverContext) {
      throw new Error("Could not get canvas context");
    }

    await firstPage.render({
      canvas: coverCanvas,
      viewport: coverViewport,
    }).promise;

    // Convert canvas to data URL
    const coverDataURL = coverCanvas.toDataURL("image/png");

    // Create OCR worker for Arabic
    worker = await createWorker("ara");

    // Extract text from all pages using OCR
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);

      // دقة أعلى لتحسين OCR
      const viewport = page.getViewport({ scale: 2.5 });

      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error(`Could not get canvas context for page ${pageNum}`);
      }

      await page.render({
        canvas,
        viewport,
      }).promise;

      const imageBlob = await canvasToBlob(canvas);
      const result = await worker.recognize(imageBlob);

      const pageText = cleanOCRText(result.data.text);
      fullText += pageText + "\n\n";
    }

    // Split text into segments for search
    const segments = splitIntoSegments(fullText);

    // Clean up resources
    await worker.terminate();
    await pdfDocument.destroy();

    return {
      content: segments,
      cover: coverDataURL,
    };
  } catch (error) {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // ignore cleanup error
      }
    }

    console.error("Error parsing PDF:", error);
    throw new Error(
      `Failed to parse PDF file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
