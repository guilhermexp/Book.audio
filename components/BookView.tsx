import React from 'react';
import SparklesIcon from './icons/SparklesIcon';

interface BookViewProps {
  pageText: string;
  currentPage: number;
  title: string;
  onSummarize: () => void;
  summary: string;
  isSummarizing: boolean;
}

const BookView: React.FC<BookViewProps> = ({ pageText, currentPage, title, onSummarize, summary, isSummarizing }) => {
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-20">
      {/* Left Column: Page Number and Title */}
      <div className="col-span-1">
        <p className="text-8xl font-serif text-neutral-600 mb-2 -ml-1 select-none">{currentPage}</p>
        <h1 className="text-5xl font-serif font-medium text-neutral-100 break-words">{title}</h1>
      </div>

      {/* Right Column: Page Content and Summary */}
      <div className="col-span-1 mt-8 md:mt-0 flex flex-col">
        <div className="flex-grow overflow-y-auto max-h-[65vh] pr-4 space-y-8">
          <div className="flex justify-end">
            <button 
              onClick={onSummarize}
              disabled={isSummarizing || !pageText}
              className="flex items-center gap-2 font-sans text-sm text-neutral-400 hover:text-white disabled:opacity-50 disabled:cursor-wait transition-colors py-2 px-3 rounded-md hover:bg-neutral-800"
              title="Summarize page content"
              aria-label="Summarize page content"
            >
              <SparklesIcon className="w-5 h-5" />
              Summarize
            </button>
          </div>

          <p className="leading-9 text-neutral-300" style={{ whiteSpace: 'pre-wrap' }}>
            {pageText || 'No content found on this page.'}
          </p>
          
          {isSummarizing && (
            <div className="mt-8 p-4 bg-neutral-800/50 rounded-lg animate-pulse">
              <div className="h-4 bg-neutral-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-neutral-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-neutral-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-neutral-700 rounded w-5/6"></div>
            </div>
          )}

          {summary && !isSummarizing && (
            <div className="mt-8 p-5 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <h3 className="font-sans font-bold text-neutral-100 mb-3 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-purple-400" />
                Summary
              </h3>
              <p className="text-neutral-300 font-sans text-base leading-7" style={{ whiteSpace: 'pre-wrap' }}>{summary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookView;