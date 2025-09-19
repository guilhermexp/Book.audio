import React, { useState } from 'react';
import UploadIcon from './icons/UploadIcon';
import ListIcon from './icons/ListIcon';
import SearchIcon from './icons/SearchIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import BookmarkIcon from './icons/BookmarkIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import SpeakerWaveIcon from './icons/SpeakerWaveIcon';
import ChatBubbleOvalLeftEllipsisIcon from './icons/ChatBubbleOvalLeftEllipsisIcon';
import MindMapIcon from './icons/MindMapIcon';

interface TopBarProps {
  bookTitle: string;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadMock: () => void;
  isAudioPlayerVisible: boolean;
  onToggleAudioPlayer: () => void;
  onToggleAssistant: () => void;
  onToggleMindMap: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ bookTitle, onFileChange, onLoadMock, isAudioPlayerVisible, onToggleAudioPlayer, onToggleAssistant, onToggleMindMap }) => {
  const [brightness, setBrightness] = useState(50);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-[#121212]/80 backdrop-blur-sm p-4 font-sans text-neutral-400">
      <div className="flex items-center justify-between mx-auto max-w-7xl">
        <div className="flex items-center gap-4">
          <label htmlFor="pdf-upload-top" className="p-2 hover:text-white transition-colors cursor-pointer" title="Import PDF">
            <UploadIcon className="w-5 h-5" />
          </label>
          <input id="pdf-upload-top" type="file" accept="application/pdf" onChange={onFileChange} className="hidden" />
          <button onClick={onLoadMock} className="p-2 hover:text-white transition-colors cursor-pointer" title="Load Sample Book">
            <BookOpenIcon className="w-5 h-5" />
          </button>
          <button className="p-2 hover:text-white transition-colors"><ListIcon className="w-5 h-5" /></button>
          <button className="p-2 hover:text-white transition-colors"><SearchIcon className="w-5 h-5" /></button>
        </div>

        <div className="hidden md:flex flex-col items-center flex-grow mx-8 min-w-0">
            <span className="text-sm text-white font-medium truncate px-4" title={bookTitle || "The Unfair Advantage"}>
              {bookTitle || "The Unfair Advantage"}
            </span>
        </div>

        <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3">
                <span className="text-xs">Ash Ali & Hasan Kubba</span>
            </div>
          <div className="hidden sm:flex items-center gap-3 bg-neutral-800/80 rounded-full p-1">
            <input
              type="range"
              min="0"
              max="100"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-24 h-1 accent-neutral-300 bg-transparent cursor-pointer"
            />
            <SunIcon className="w-4 h-4 mr-2" />
          </div>
           <button 
            onClick={onToggleAudioPlayer} 
            className={`p-2 transition-colors ${isAudioPlayerVisible ? 'text-white bg-neutral-700 rounded-full' : 'hover:text-white'}`}
            title={isAudioPlayerVisible ? 'Hide player' : 'Listen to this page'}
          >
            <SpeakerWaveIcon className="w-5 h-5" />
          </button>
           <button 
            onClick={onToggleMindMap}
            className="p-2 hover:text-white transition-colors"
            title="AI Mind Map"
          >
            <MindMapIcon className="w-5 h-5" />
          </button>
           <button 
            onClick={onToggleAssistant}
            className="p-2 hover:text-white transition-colors"
            title="AI Assistant"
          >
            <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
          </button>
          <button className="p-2 hover:text-white transition-colors font-bold text-sm">AA</button>
          <button className="p-2 hover:text-white transition-colors"><MoonIcon className="w-5 h-5" /></button>
          <button className="p-2 hover:text-white transition-colors"><BookmarkIcon className="w-5 h-5" /></button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;