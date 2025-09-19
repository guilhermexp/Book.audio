import React from 'react';
import MindMapNode from './MindMapNode';
import { MindMapNodeData } from '../App';
import XMarkIcon from './icons/XMarkIcon';
import MindMapIcon from './icons/MindMapIcon';

interface MindMapProps {
  isVisible: boolean;
  onClose: () => void;
  data: MindMapNodeData | null;
  isLoading: boolean;
  bookTitle: string;
}

const MindMap: React.FC<MindMapProps> = ({ isVisible, onClose, data, isLoading, bookTitle }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-[#121212] z-50 flex flex-col items-center justify-center font-sans"
      role="dialog"
      aria-modal="true"
    >
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-[#121212]/80 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MindMapIcon className="w-5 h-5 text-purple-400" />
          Mind Map: <span className="text-neutral-300 font-medium">{bookTitle}</span>
        </h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-700" aria-label="Close mind map">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </header>

      <div className="w-full h-full overflow-auto p-24 text-center">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <MindMapIcon className="w-12 h-12 text-purple-500 animate-pulse" />
            <p className="mt-4 text-xl text-neutral-300">Generating your mind map...</p>
            <p className="text-neutral-500">This may take a moment for large books.</p>
          </div>
        )}
        {data && !isLoading && (
            <div className="inline-block min-w-full">
              <MindMapNode node={data} />
            </div>
        )}
        {!data && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-xl text-neutral-500">Could not generate a mind map.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default MindMap;