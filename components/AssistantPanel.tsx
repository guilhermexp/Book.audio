import React, { useEffect, useRef } from 'react';
import XMarkIcon from './icons/XMarkIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import SparklesIcon from './icons/SparklesIcon';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  citations?: { uri: string; title: string; }[];
}

interface AssistantPanelProps {
  isVisible: boolean;
  onClose: () => void;
  chatHistory: ChatMessage[];
  onSendMessage: (e: React.FormEvent) => void;
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

const AssistantPanel: React.FC<AssistantPanelProps> = ({
  isVisible,
  onClose,
  chatHistory,
  onSendMessage,
  inputValue,
  onInputChange,
  isLoading,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <aside
        className={`fixed top-0 right-0 h-full w-96 bg-[#181818] shadow-2xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col font-sans ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
      >
        <header className="flex items-center justify-between p-4 border-b border-neutral-700/50">
          <h2 id="assistant-title" className="text-lg font-bold text-white flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
            AI Assistant
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-700" aria-label="Close assistant panel">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((message, index) => (
            <div key={index} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-xs md:max-w-sm rounded-lg px-4 py-2 ${message.role === 'user' ? 'bg-purple-600 text-white' : 'bg-neutral-700'}`}>
                <p className="text-sm whitespace-pre-wrap leading-6">{message.text}</p>
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3 border-t border-neutral-600 pt-2">
                    <h4 className="text-xs font-bold text-neutral-400 mb-1">Sources:</h4>
                    <ul className="text-xs space-y-1">
                      {message.citations.map((citation, i) => (
                        <li key={i}>
                          <a href={citation.uri} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline truncate block">
                            {citation.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start">
                <div className="max-w-xs md:max-w-sm rounded-lg px-4 py-2 bg-neutral-700 animate-pulse">
                    <div className="h-3 bg-neutral-600 rounded w-16"></div>
                </div>
            </div>
          )}
           <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-neutral-700/50">
          <form onSubmit={onSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={onInputChange}
              placeholder="Ask about the book..."
              className="flex-1 w-full bg-neutral-700 border border-transparent rounded-md px-3 py-2 text-sm text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
              aria-label="Your message for the AI assistant"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-purple-600 text-white p-2 rounded-md hover:bg-purple-500 disabled:bg-neutral-600 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
};

export default AssistantPanel;
