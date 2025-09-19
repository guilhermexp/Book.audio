import React, { useState } from 'react';
import PlayIcon from './icons/PlayIcon';
import RewindIcon from './icons/RewindIcon';
import ForwardIcon from './icons/ForwardIcon';
import Rewind15Icon from './icons/Rewind15Icon';
import Forward15Icon from './icons/Forward15Icon';
import ClockIcon from './icons/ClockIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import WifiIcon from './icons/WifiIcon';
import ArrowsPointingOutIcon from './icons/ArrowsPointingOutIcon';

interface AudioPlayerProps {
    isVisible: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ isVisible }) => {
    const [progress, setProgress] = useState(65);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed inset-x-0 bottom-0 z-30 p-4 flex justify-center">
            <div className="w-full max-w-4xl bg-neutral-800/50 backdrop-blur-xl rounded-2xl p-4 font-sans text-neutral-200 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center justify-center gap-8 text-xs text-neutral-400 mb-4">
                    <button className="flex items-center gap-2 hover:text-white transition-colors"><ClockIcon className="w-4 h-4" /> Speed (1x)</button>
                    <button className="flex items-center gap-2 hover:text-white transition-colors"><BookOpenIcon className="w-4 h-4" /> Chapters</button>
                    <button className="flex items-center gap-2 hover:text-white transition-colors"><WifiIcon className="w-4 h-4" /> Connect to Device</button>
                    <button className="flex items-center gap-2 hover:text-white transition-colors"><ArrowsPointingOutIcon className="w-4 h-4" /> Focus Mode</button>
                </div>

                <div className="flex items-center justify-between gap-6">
                    <button className="text-neutral-400 hover:text-white transition-colors"><RewindIcon className="w-6 h-6" /></button>
                    <button className="text-neutral-400 hover:text-white transition-colors"><Rewind15Icon className="w-8 h-8" /></button>

                    <div className="flex items-center gap-4">
                        <img src="https://picsum.photos/seed/unfairadvantage/80/80" alt="Book Cover" className="w-16 h-16 rounded-md shadow-lg" />
                        <button className="w-16 h-16 bg-white/90 text-black rounded-full flex items-center justify-center hover:bg-white transition-colors">
                            <PlayIcon className="w-8 h-8" />
                        </button>
                    </div>

                    <button className="text-neutral-400 hover:text-white transition-colors"><Forward15Icon className="w-8 h-8" /></button>
                    <button className="text-neutral-400 hover:text-white transition-colors"><ForwardIcon className="w-6 h-6" /></button>
                </div>
                
                <div className="mt-4 px-2">
                    <p className="text-center text-sm font-medium text-neutral-100 mb-2">The Unfair Advantage - 10 - Education and Expertise</p>
                    <div className="relative w-full h-1.5 bg-neutral-600/50 rounded-full">
                        <div 
                            className="absolute top-0 left-0 h-full bg-white rounded-full"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-400 mt-1">
                        <span>04:41:24</span>
                        <span>-02:16:32</span>
                    </div>
                     <p className="text-center text-xs text-neutral-500 mt-1">3h 56m left in the chapter</p>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;