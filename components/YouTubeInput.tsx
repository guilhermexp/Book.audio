import React, { useState } from 'react';

interface YouTubeInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function YouTubeInput({ onSubmit, isLoading }: YouTubeInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-neutral-800 rounded-lg">
      <h2 className="text-xl font-semibold text-neutral-100">Import from YouTube</h2>
      <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="flex-1 px-4 py-2 bg-neutral-700 text-neutral-100 rounded-lg placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-600 text-white rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Import'}
        </button>
      </form>
      <p className="text-sm text-neutral-400">
        Enter a YouTube URL to import the video transcript
      </p>
    </div>
  );
}
