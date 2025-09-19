import React, { useState, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import TopBar from './components/TopBar';
import BookView from './components/BookView';
import AudioPlayer from './components/AudioPlayer';
import Footer from './components/Footer';
import VolumeSlider from './components/VolumeSlider';
import UploadIcon from './components/icons/UploadIcon';
import AssistantPanel from './components/AssistantPanel';
import MindMap from './components/MindMap';

// @ts-ignore
const pdfjsLib = window.pdfjsLib;

// Initialize the Google AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  citations?: { uri: string; title: string; }[];
}

export interface MindMapNodeData {
    title: string;
    children?: MindMapNodeData[];
}


export default function App() {
  const [bookTitle, setBookTitle] = useState<string>('');
  const [bookPages, setBookPages] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [isAudioPlayerVisible, setIsAudioPlayerVisible] = useState<boolean>(false);

  // AI Assistant State
  const [isAssistantVisible, setIsAssistantVisible] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState<string>('');
  const [isAssistantLoading, setIsAssistantLoading] = useState<boolean>(false);

  // Mind Map State
  const [isMindMapVisible, setIsMindMapVisible] = useState<boolean>(false);
  const [mindMapData, setMindMapData] = useState<MindMapNodeData | null>(null);
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState<boolean>(false);


  useEffect(() => {
    if (pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
  }, []);

  const resetStateForNewBook = () => {
    setSummary('');
    setIsAudioPlayerVisible(false);
    setIsAssistantVisible(false);
    setChatHistory([]);
    setAssistantInput('');
    setIsMindMapVisible(false);
    setMindMapData(null);
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      return;
    }

    setIsLoading(true);
    resetStateForNewBook();
    setBookTitle(file.name.replace(/\.pdf$/i, ''));

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        
        setTotalPages(pdf.numPages);
        const pages: string[] = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          pages.push(pageText);
        }
        
        setBookPages(pages);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error parsing PDF:', error);
        alert('Failed to load the PDF file.');
        setBookTitle('');
        setBookPages([]);
        setTotalPages(0);
        setSummary('');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const summarizeCurrentPage = async () => {
    if (!bookPages[currentPage - 1]) return;

    setIsSummarizing(true);
    setSummary('');
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Please provide a concise summary of the following text:\n\n---\n\n${bookPages[currentPage - 1]}`,
      });
      setSummary(response.text);
    } catch (error) {
      console.error("Error summarizing text:", error);
      setSummary("Sorry, I couldn't generate a summary for this page.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const loadMockBook = () => {
    setIsLoading(true);
    resetStateForNewBook();

    const mockTitle = "The Alchemist's Secret";
    const mockPages = Array.from({ length: 15 }, (_, i) => {
        const pageNum = i + 1;
        const chapterNum = Math.ceil(pageNum / 3);
        return `Chapter ${chapterNum}\n\nPage ${pageNum}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, vitae aliquam nisl nisl vitae nisl. Sed euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, vitae aliquam nisl nisl vitae nisl.\n\nPhasellus vitae nisl eget nisl aliquam ultricies. Sed euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, vitae aliquam nisl nisl vitae nisl. Sed euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, vitae aliquam nisl nisl vitae nisl.\n\nDonec euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, vitae aliquam nisl nisl vitae nisl. Sed euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, vitae aliquam nisl nisl vitae nisl. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam. Vivamus porttitor turpis ac leo.`;
    });
    
    setTimeout(() => {
        setBookTitle(mockTitle);
        setBookPages(mockPages);
        setTotalPages(mockPages.length);
        setCurrentPage(1);
        setIsLoading(false);
    }, 500);
  };

  const handleSendToAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim() || isAssistantLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', text: assistantInput };
    setChatHistory(prev => [...prev, newUserMessage]);
    setAssistantInput('');
    setIsAssistantLoading(true);

    try {
        const fullBookText = bookPages.join('\n\n---\n\n');
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `User's question: ${assistantInput}`,
            config: {
                systemInstruction: `You are a helpful AI assistant for an ebook reader. The user is currently reading a book. Here is the full content of the book. Answer the user's questions based on this content and use your web search capabilities for external information. Provide citations for your web searches.

                --- BOOK CONTENT START ---
                ${fullBookText}
                --- BOOK CONTENT END ---`,
                tools: [{googleSearch: {}}],
            },
        });

        const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks
          ?.map((chunk: any) => chunk.web)
          .filter((web) => web && web.uri && web.title) || [];

        const modelResponse: ChatMessage = {
            role: 'model',
            text: response.text,
            citations: citations.length > 0 ? citations : undefined,
        };
        setChatHistory(prev => [...prev, modelResponse]);

    } catch (error) {
        console.error("Error with assistant:", error);
        const errorResponse: ChatMessage = {
            role: 'model',
            text: "Sorry, I encountered an error. Please try again."
        };
        setChatHistory(prev => [...prev, errorResponse]);
    } finally {
        setIsAssistantLoading(false);
    }
  };

  const generateMindMap = async () => {
    if (mindMapData || !isBookLoaded) return; // Don't re-generate if data exists

    setIsGeneratingMindMap(true);
    try {
        const fullBookText = bookPages.join('\n\n---\n\n');
        
        const nodeSchema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                children: { type: Type.ARRAY, items: {} } // Recursive part
            },
            required: ['title']
        };
        // Define a max depth for the schema to avoid infinite recursion issues client-side.
        // Let's go 4 levels deep.
        const nodeSchemaL4 = { type: Type.OBJECT, properties: { title: { type: Type.STRING } }, required: ['title'] };
        const nodeSchemaL3 = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, children: { type: Type.ARRAY, items: nodeSchemaL4 } }, required: ['title'] };
        const nodeSchemaL2 = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, children: { type: Type.ARRAY, items: nodeSchemaL3 } }, required: ['title'] };
        const mindMapSchema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: 'The central theme or title of the book.' },
                children: { type: Type.ARRAY, items: nodeSchemaL2 }
            },
            required: ['title', 'children']
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the entire text of the book provided below and generate a hierarchical mind map of its key concepts, themes, and structure. The mind map should have a central theme and branch out into major topics, which then branch into smaller sub-topics. Structure the output according to the provided JSON schema.

            --- BOOK CONTENT START ---
            ${fullBookText}
            --- BOOK CONTENT END ---`,
            config: {
                responseMimeType: "application/json",
                responseSchema: mindMapSchema,
            },
        });
        
        const mindMapJson = JSON.parse(response.text);
        setMindMapData(mindMapJson);

    } catch (error) {
        console.error("Error generating mind map:", error);
        alert("Sorry, I couldn't generate a mind map for this book.");
        // Close the mind map view on error
        setIsMindMapVisible(false);
    } finally {
        setIsGeneratingMindMap(false);
    }
  };


  const goToNextPage = () => {
    setCurrentPage((prev) => {
      const nextPage = Math.min(prev + 1, totalPages);
      if (nextPage !== prev) {
        setSummary(''); // Clear summary when page changes
      }
      return nextPage;
    });
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => {
      const prevPage = Math.max(prev - 1, 1);
      if (prevPage !== prev) {
        setSummary(''); // Clear summary when page changes
      }
      return prevPage;
    });
  };
  
  const toggleAudioPlayer = () => {
    setIsAudioPlayerVisible(prev => !prev);
  }

  const toggleAssistantPanel = () => {
    setIsAssistantVisible(prev => !prev);
  }

  const toggleMindMap = () => {
    setIsMindMapVisible(prev => {
        const newVisibility = !prev;
        if (newVisibility && !mindMapData) {
            generateMindMap();
        }
        return newVisibility;
    });
  };

  const isBookLoaded = bookPages.length > 0;

  return (
    <div className="bg-[#121212] text-neutral-300 font-serif min-h-screen antialiased relative overflow-hidden select-none">
      <div 
        className="absolute inset-0 w-full h-full opacity-[0.02]"
        style={{ backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiPjwvcmVjdD4KPC9zdmc+')` }}
      ></div>
      
      <div className={`relative z-10 transition-all duration-300 ${isAssistantVisible ? 'pr-96' : ''}`}>
        <TopBar 
          bookTitle={bookTitle} 
          onFileChange={handleFileChange} 
          onLoadMock={loadMockBook}
          isAudioPlayerVisible={isAudioPlayerVisible}
          onToggleAudioPlayer={toggleAudioPlayer}
          onToggleAssistant={toggleAssistantPanel}
          onToggleMindMap={toggleMindMap}
        />
        
        {isLoading && (
          <div className="flex justify-center items-center h-screen">
            <p className="text-xl animate-pulse">Loading your book...</p>
          </div>
        )}

        {!isLoading && !isBookLoaded && (
            <div className="flex flex-col justify-center items-center h-screen text-center px-4">
                <h1 className="text-4xl font-bold mb-4">Welcome to the Ebook Reader</h1>
                <p className="text-lg text-neutral-400 mb-8">Select a PDF file to begin your reading journey.</p>
                 <label htmlFor="pdf-upload" className="bg-neutral-700 text-white font-sans font-bold py-3 px-6 rounded-lg cursor-pointer hover:bg-neutral-600 transition-colors flex items-center gap-2">
                    <UploadIcon className="w-5 h-5" />
                    Import PDF
                </label>
                <input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </div>
        )}

        {!isLoading && isBookLoaded && (
          <>
            <main className={`px-16 md:px-20 lg:px-24 pt-24 transition-all duration-300 ${isAudioPlayerVisible ? 'pb-72' : 'pb-20'}`}>
              <BookView 
                pageText={bookPages[currentPage - 1]} 
                currentPage={currentPage}
                title={bookTitle}
                onSummarize={summarizeCurrentPage}
                summary={summary}
                isSummarizing={isSummarizing}
              />
            </main>
            <VolumeSlider />
            <AudioPlayer isVisible={isAudioPlayerVisible} />
            {!isAudioPlayerVisible && (
              <Footer 
                currentPage={currentPage}
                totalPages={totalPages}
                onPrev={goToPrevPage}
                onNext={goToNextPage}
              />
            )}
          </>
        )}
      </div>
       <AssistantPanel 
        isVisible={isAssistantVisible}
        onClose={toggleAssistantPanel}
        chatHistory={chatHistory}
        onSendMessage={handleSendToAssistant}
        inputValue={assistantInput}
        onInputChange={(e) => setAssistantInput(e.target.value)}
        isLoading={isAssistantLoading}
      />
      <MindMap 
        isVisible={isMindMapVisible}
        onClose={toggleMindMap}
        data={mindMapData}
        isLoading={isGeneratingMindMap}
        bookTitle={bookTitle}
      />
    </div>
  );
}