import React from 'react';

interface FooterProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

const Footer: React.FC<FooterProps> = ({ currentPage, totalPages, onPrev, onNext }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 p-3 font-sans text-xs text-neutral-400 bg-[#121212]/90 backdrop-blur-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-4">
        <span>Page {currentPage} of {totalPages}</span>
        <div className="flex items-center gap-4">
          <button 
            onClick={onPrev} 
            disabled={currentPage === 1}
            className="px-3 py-1 rounded hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button 
            onClick={onNext} 
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;