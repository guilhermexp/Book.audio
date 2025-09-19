import React from "react";
import SparklesIcon from "./icons/SparklesIcon";
import MarkdownRenderer from "./MarkdownRenderer";

interface BookViewProps {
  pageText: string;
  currentPage: number;
  title: string;
  onSummarize: () => void;
  summary: string;
  isSummarizing: boolean;
  isMarkdown?: boolean;
}

const BookView: React.FC<BookViewProps> = ({
  pageText,
  currentPage,
  title,
  onSummarize,
  summary,
  isSummarizing,
  isMarkdown = false,
}) => {
  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[350px_1fr] gap-4 lg:gap-6">
      {/* Left Column: Page Number and Title */}
      <div className="col-span-1 flex flex-col">
        <p className="text-5xl lg:text-6xl xl:text-7xl font-serif text-neutral-600 mb-1 select-none">
          {currentPage}
        </p>
        <h1 className="text-2xl lg:text-3xl xl:text-4xl font-serif font-medium text-neutral-100 break-words">
          {title}
        </h1>
      </div>

      {/* Right Column: Page Content and Summary */}
      <div className="col-span-1 flex flex-col h-full">
        <div className="flex justify-end mb-3">
          <button
            onClick={onSummarize}
            disabled={isSummarizing || !pageText}
            className="flex items-center gap-2 font-sans text-xs lg:text-sm text-neutral-400 hover:text-white disabled:opacity-50 disabled:cursor-wait transition-colors py-1.5 px-3 rounded-md hover:bg-neutral-800"
            title="Summarize page content"
            aria-label="Summarize page content"
          >
            <SparklesIcon className="w-4 h-4" />
            Summarize
          </button>
        </div>

        <div className="flex-grow overflow-y-auto max-h-[85vh] pr-2 space-y-4">
          {isMarkdown ? (
            <MarkdownRenderer
              content={pageText || "No content found on this page."}
              className="text-sm lg:text-base"
            />
          ) : (
            <p
              className="text-sm lg:text-base leading-relaxed text-neutral-300"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {pageText || "No content found on this page."}
            </p>
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
