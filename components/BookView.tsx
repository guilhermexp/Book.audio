import React, { useEffect, useState } from "react";
import SparklesIcon from "./icons/SparklesIcon";
import type { BookPage } from "../App";

// Helper functions to extract and format content
function extractChapterTitle(text: string): string {
  // Look for chapter patterns like "Chapter X" or numbered titles
  const lines = text.split('\n').filter(line => line.trim());

  // Check first few lines for chapter/title pattern
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim();
    if (line.match(/^(Chapter|CHAPTER|Cap\u00edtulo|CAP\u00cdTULO)\s+\d+/i) ||
        line.match(/^\d+\s*[-\.]\s*\w+/) ||
        (line.length < 100 && line.length > 5 && !line.endsWith('.'))) {
      // Found potential title, check if next line could be subtitle
      if (i + 1 < lines.length && lines[i + 1].length < 100 && !lines[i + 1].endsWith('.')) {
        return `${line}\n${lines[i + 1]}`;
      }
      return line;
    }
  }
  return '';
}

function extractQuote(text: string): string {
  // Look for italicized quotes or epigraphs (often at chapter beginnings)
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('"') || line.includes('\u201c') ||
        (line.length < 150 && line.length > 20 && line.includes(','))) {
      // Might be a quote
      const cleaned = line.trim();
      if (cleaned.length > 20 && cleaned.length < 200) {
        return cleaned;
      }
    }
  }
  return '';
}

function formatTextContent(text: string): string {
  if (!text) return '';

  // Clean up the text
  let formatted = text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Preserve paragraph breaks
    .replace(/\.\s+([A-Z])/g, '.</p><p>$1')
    // Add proper paragraph tags
    .split('\n\n')
    .map(para => {
      const trimmed = para.trim();
      if (trimmed) {
        // Don't wrap chapter titles
        if (trimmed.match(/^(Chapter|CHAPTER|Cap\u00edtulo|CAP\u00cdTULO)\s+\d+/i)) {
          return ''; // Skip, already shown in header
        }
        return `<p class="mb-6 text-justify first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-2 first-letter:leading-none">${trimmed}</p>`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');

  // If no paragraphs were created, wrap everything
  if (!formatted.includes('<p>')) {
    formatted = `<p class="mb-6 text-justify">${text}</p>`;
  }

  return formatted;
}

interface BookViewProps {
  page: BookPage | null;
  currentPage: number;
  title: string;
  onSummarize: () => void;
  summary: string;
  isSummarizing: boolean;
  pdfDocument: any;
  previewCache: React.MutableRefObject<Map<number, string>>;
}

const BookView: React.FC<BookViewProps> = ({
  page,
  currentPage,
  title,
  onSummarize,
  summary,
  isSummarizing,
  pdfDocument,
  previewCache,
}) => {
  const pageText = page?.text || page?.displayText || "";
  const richText = page?.text ?? page?.displayText ?? "";
  const images = page?.images ?? [];
  const hasContent = page?.hasContent ?? richText.trim().length > 0;
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  useEffect(() => {
    if (!pdfDocument || !page) {
      setPageImageUrl(null);
      return;
    }

    const cached = previewCache.current.get(page.number);
    if (cached) {
      setPageImageUrl(cached);
      return;
    }

    let isCancelled = false;

    (async () => {
      try {
        const pdfPage = await pdfDocument.getPage(page.number);
        const viewport = pdfPage.getViewport({ scale: 1.4 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          return;
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await pdfPage.render({ canvasContext: context, viewport }).promise;

        if (isCancelled) return;

        const dataUrl = canvas.toDataURL("image/png");
        previewCache.current.set(page.number, dataUrl);
        setPageImageUrl(dataUrl);
      } catch (error) {
        console.error("Failed to render PDF page", error);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [pdfDocument, page?.number, previewCache]);

  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[350px_1fr] gap-4 lg:gap-6">
      {/* Left Column: Page Number and Chapter Title */}
      <div className="col-span-1 flex flex-col">
        <p className="text-7xl lg:text-8xl xl:text-9xl font-serif text-neutral-600 mb-4 select-none font-light">
          {currentPage}
        </p>
        <h1 className="text-3xl lg:text-4xl xl:text-5xl font-serif text-neutral-100 break-words leading-tight">
          {extractChapterTitle(richText) || title}
        </h1>
        <div className="mt-6 text-sm text-neutral-500 italic font-serif">
          {extractQuote(richText)}
        </div>
      </div>

      {/* Right Column: Page Content and Summary */}
      <div className="col-span-1 flex flex-col h-full">
        <div className="flex justify-end mb-3">
          <button
            onClick={onSummarize}
            disabled={isSummarizing || !richText.trim()}
            className="flex items-center gap-2 font-sans text-xs lg:text-sm text-neutral-400 hover:text-white disabled:opacity-50 disabled:cursor-wait transition-colors py-1.5 px-3 rounded-md hover:bg-neutral-800"
            title="Summarize page content"
            aria-label="Summarize page content"
          >
            <SparklesIcon className="w-4 h-4" />
            Summarize
          </button>
        </div>

        <div className="flex-grow overflow-y-auto max-h-[85vh] pr-4 custom-scrollbar">
          {/* Main Text Content */}
          {hasContent ? (
            <div className="prose prose-lg prose-invert max-w-none">
              <div
                className="font-serif text-lg lg:text-xl leading-relaxed text-neutral-200 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: formatTextContent(richText) }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
              <p className="text-sm uppercase tracking-wide">
                No content available for this page
              </p>
            </div>
          )}

          {images.length > 0 && (
            <div className="space-y-4 pt-6">
              {images.map((image, index) => (
                <figure key={image.id} className="flex flex-col gap-2">
                  <img
                    src={image.url}
                    alt={`Imagem ${index + 1} da página ${page?.number ?? currentPage}`}
                    className="w-full max-h-[70vh] object-contain rounded-lg border border-neutral-800"
                  />
                </figure>
              ))}
            </div>
          )}

          {/* Toggle for PDF Preview */}
          {pdfDocument && pageImageUrl && (
            <div className="mt-8 pt-6 border-t border-neutral-800">
              <button
                onClick={() => setShowPdfPreview(!showPdfPreview)}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showPdfPreview ? "Hide" : "Show"} PDF preview
              </button>
              {showPdfPreview && (
                <div className="mt-4">
                  <img
                    src={pageImageUrl}
                    alt={`PDF preview of page ${page?.number ?? currentPage}`}
                    className="max-w-full h-auto rounded-lg shadow-lg border border-neutral-800 opacity-90"
                  />
                </div>
              )}
            </div>
          )}

          {isSummarizing && (
            <div className="mt-4 p-3 bg-neutral-800/50 rounded-lg animate-pulse">
              <div className="h-3 bg-neutral-700 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-neutral-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-neutral-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-neutral-700 rounded w-5/6"></div>
            </div>
          )}

          {summary && !isSummarizing && (
            <div className="mt-4 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <h3 className="font-sans font-bold text-neutral-100 mb-2 flex items-center gap-2 text-sm">
                <SparklesIcon className="w-4 h-4 text-purple-400" />
                Summary
              </h3>
              <p
                className="text-neutral-300 font-sans text-xs lg:text-sm leading-relaxed"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {summary}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookView;
