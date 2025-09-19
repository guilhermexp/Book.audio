
import React, { useState } from 'react';
import SpeakerWaveIcon from './icons/SpeakerWaveIcon';

const VolumeSlider: React.FC = () => {
  const [volume, setVolume] = useState(70);

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-center space-y-4">
      <div className="bg-neutral-800/60 backdrop-blur-md rounded-full p-3">
        <div className="flex flex-col items-center">
          <SpeakerWaveIcon className="w-5 h-5 text-neutral-400 mb-4" />
          <div className="relative h-32 w-2 flex items-center justify-center">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="absolute w-32 h-2 appearance-none bg-neutral-600 rounded-full cursor-pointer origin-center -rotate-90 accent-neutral-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeSlider;
