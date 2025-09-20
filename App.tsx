import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import TopBar from "./components/TopBar";
import BookView from "./components/BookView";
import AudioPlayer from "./components/AudioPlayer";
import Footer from "./components/Footer";
import VolumeSlider from "./components/VolumeSlider";
import UploadIcon from "./components/icons/UploadIcon";
import AssistantPanel from "./components/AssistantPanel";
import MindMap from "./components/MindMap";
import YouTubeInput from "./components/YouTubeInput";
import {
  DocumentConverterService,
  PageContent as ConverterPageContent,
  PageImage,
} from "./services/documentConverter";
import { ttsService } from "./services/ttsService";

// @ts-ignore
const pdfjsLib = window.pdfjsLib;

// Initialize services
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const documentConverter = DocumentConverterService.getInstance();

interface ChatMessage {
  role: "user" | "model";
  text: string;
  citations?: { uri: string; title: string }[];
}

export interface MindMapNodeData {
  title: string;
  children?: MindMapNodeData[];
}

export interface BookPage {
  number: number;
  text: string;
  displayText: string;
  images: PageImage[];
  hasContent: boolean;
  metadata?: {
    wordCount?: number;
    charCount?: number;
    readingTime?: number;
  };
  validationStatus?: 'valid' | 'warning' | 'error';
}

export default function App() {
  const [bookTitle, setBookTitle] = useState<string>("");
  const [bookPages, setBookPages] = useState<BookPage[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>("");
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [isAudioPlayerVisible, setIsAudioPlayerVisible] =
    useState<boolean>(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const pagePreviewCache = useRef<Map<number, string>>(new Map());

  // TTS State
  const [isTTSPlaying, setIsTTSPlaying] = useState<boolean>(false);
  const [ttsVoice, setTTSVoice] = useState<string>("pt");
  const [ttsSpeed, setTTSSpeed] = useState<number>(1.0);
  const [ttsBackendHealthy, setTTSBackendHealthy] = useState<boolean>(false);

  // AI Assistant State
  const [isAssistantVisible, setIsAssistantVisible] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState<string>("");
  const [isAssistantLoading, setIsAssistantLoading] = useState<boolean>(false);

  // Mind Map State
  const [isMindMapVisible, setIsMindMapVisible] = useState<boolean>(false);
  const [mindMapData, setMindMapData] = useState<MindMapNodeData | null>(null);
  const [isGeneratingMindMap, setIsGeneratingMindMap] =
    useState<boolean>(false);

  useEffect(() => {
    if (pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    }
    // Check backend health
    documentConverter.checkHealth().then(setBackendHealthy);
    // Check TTS backend health and capabilities
    ttsService.checkHealth().then(setTTSBackendHealthy);

    // Check advanced TTS capabilities
    ttsService.checkTTSStatus().then(status => {
      console.log('TTS Capabilities:', status);
      if (status.contextual_analysis) {
        console.log('Advanced TTS with contextual analysis available!');
      }
    });
  }, []);

  // Pre-generate audio when pages are loaded
  useEffect(() => {
    if (bookPages.length > 0 && ttsBackendHealthy) {
      // Pre-generate first 3 pages
      const pagesToPreGenerate = bookPages.slice(0, 3).map(p => ({
        id: String(p.number),
        number: p.number,
        text: p.text || p.displayText || ''
      }));

      ttsService.preGeneratePages(pagesToPreGenerate, ttsVoice)
        .catch(err => console.warn('Pre-generation failed:', err));
    }
  }, [bookPages, ttsVoice, ttsBackendHealthy]);

  const resetStateForNewBook = () => {
    setSummary("");
    setIsAudioPlayerVisible(false);
    setIsAssistantVisible(false);
    setChatHistory([]);
    setAssistantInput("");
    setIsMindMapVisible(false);
    setMindMapData(null);
    setPdfDocument((prev: any) => {
      if (prev?.destroy) {
        try {
          prev.destroy();
        } catch (error) {
          console.warn("Failed to destroy previous PDF document", error);
        }
      }
      return null;
    });
    pagePreviewCache.current.clear();
  };

  const handleYouTubeURL = async (url: string) => {
    setIsLoading(true);
    resetStateForNewBook();

    // Extract video title from URL if possible
    const videoId = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    )?.[1];
    setBookTitle(videoId ? `YouTube Video: ${videoId}` : "YouTube Transcript");

    try {
      if (!backendHealthy) {
        alert(
          "Backend service is required to process YouTube videos. Please start the backend server.",
        );
        setBookTitle("");
        setIsLoading(false);
        return;
      }

      console.log("Converting YouTube video...");
      const response = await documentConverter.convertYouTube(url);

      if (response.success) {
        const markdownPages = documentConverter.parseMarkdownToPages(
          response.content,
        );

        const pages: BookPage[] = markdownPages.map((text, index) => ({
          number: index + 1,
          text,
          displayText: text,
          images: [],
          hasContent: text.trim().length > 0,
        }));

        setBookPages(pages);
        setTotalPages(pages.length);
        setCurrentPage(1);
      } else {
        throw new Error(response.error || "YouTube conversion failed");
      }
    } catch (error) {
      console.error('Failed to process YouTube video:', error);
      alert(`Failed to process YouTube video: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setBookTitle("");
      setBookPages([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      alert("Please select a file.");
      return;
    }

    setIsLoading(true);
    resetStateForNewBook();

    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setBookTitle(fileNameWithoutExt);

    try {
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        if (!backendHealthy) {
          alert(
            "Backend service is required to process this file format. Please start the backend server.",
          );
          setBookTitle("");
          setIsLoading(false);
          return;
        }

        console.log("Converting non-PDF document via backend service...");
        const response = await documentConverter.convertFile(file);

        if (!response.success) {
          throw new Error(response.error || "Conversion failed");
        }

        const parsedPages = documentConverter.parseMarkdownToPages(
          response.content,
        );
        const pages: BookPage[] = parsedPages.map((text, index) => ({
          number: index + 1,
          text,
          displayText: text,
          images: [],
          hasContent: text.trim().length > 0,
        }));

        setBookPages(pages);
        setTotalPages(pages.length);
        setCurrentPage(1);
        return;
      }

      // Process PDF with backend as authority if available
      const backendPromise = backendHealthy
        ? documentConverter
            .convertFile(file)
            .then((res) => res)
            .catch((error) => {
              console.error("Backend conversion failed:", error);
              return null;
            })
        : Promise.resolve(null);

      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

      setPdfDocument(pdf);

      // Wait for backend response to determine authoritative page count
      const backendResponse = await backendPromise;

      // Use backend page count if available and valid, otherwise fall back to PDF.js
      let authoritativePageCount = pdf.numPages;
      let validationIssues: any[] = [];

      if (backendResponse?.success) {
        if (backendResponse.page_count) {
          authoritativePageCount = backendResponse.page_count;
        }
        if (backendResponse.validation) {
          validationIssues = backendResponse.validation.issues || [];
          if (!backendResponse.validation.is_valid) {
            console.warn("PDF validation failed:", backendResponse.validation);
          }
        }

        // Log any validation issues
        if (validationIssues.length > 0) {
          console.warn("PDF validation issues:", validationIssues);
        }
      }

      setTotalPages(authoritativePageCount);

      // Extract pages from PDF.js first
      const pdfJsPages: BookPage[] = [];
      for (let i = 1; i <= Math.min(authoritativePageCount, pdf.numPages); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        pdfJsPages.push({
          number: i,
          text: "",
          displayText: pageText,
          images: [],
          hasContent: pageText.trim().length > 0,
        });
      }

      // Add empty pages if backend says there are more pages than PDF.js can see
      for (let i = pdf.numPages + 1; i <= authoritativePageCount; i++) {
        pdfJsPages.push({
          number: i,
          text: "",
          displayText: "[Page content unavailable]",
          images: [],
          hasContent: false,
        });
      }

      // Merge backend data if available
      if (backendResponse?.success) {
        if (
          backendResponse.format === "pdf-pages" &&
          backendResponse.pages &&
          backendResponse.pages.length > 0
        ) {
          const backendPagesMap = new Map(
            backendResponse.pages.map((page) => [page.number, page]),
          );

          const mergedPages: BookPage[] = pdfJsPages.map((page) => {
            const backendPage = backendPagesMap.get(page.number);
            return {
              number: page.number,
              displayText: page.displayText,
              text: backendPage?.text || page.displayText,
              images: backendPage?.images || [],
              hasContent:
                backendPage?.has_content ?? page.hasContent,
            };
          });

          setBookPages(mergedPages);
        } else {
          const parsedPages = documentConverter.parseMarkdownToPages(
            backendResponse.content,
          );
          const pages: BookPage[] = parsedPages.map((text, index) => ({
            number: index + 1,
            text,
            displayText: text,
            images: [],
            hasContent: text.trim().length > 0,
          }));
          setBookPages(pages);
          setTotalPages(pages.length);
        }
      } else {
        const fallbackPages = pdfJsPages.map((page) => ({
          ...page,
          text: page.displayText,
        }));
        setBookPages(fallbackPages);
      }

      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to process file:', error);
      alert(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setBookTitle("");
      setBookPages([]);
      setTotalPages(0);
      setSummary("");
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeCurrentPage = async () => {
    const page = bookPages[currentPage - 1];
    if (!page) {
      setSummary("No textual content available for summarization.");
      return;
    }

    const textForSummary = page.text.trim() || page.displayText.trim();

    if (!textForSummary) {
      setSummary("No textual content available for summarization.");
      return;
    }

    setIsSummarizing(true);
    setSummary("");
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Please provide a concise summary of the following text:\n\n---\n\n${textForSummary}`,
      });
      setSummary(response.text);
    } catch (error) {
      console.error('Failed to generate summary:', error);
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
      const text = `Chapter ${chapterNum}\n\nPage ${pageNum}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, vitae aliquam nisl nisl vitae nisl. Sed euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, vitae aliquam nisl nisl vitae nisl.\n\nPhasellus vitae nisl eget nisl aliquam ultricies. Sed euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, vitae aliquam nisl nisl vitae nisl. Sed euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, vitae aliquam nisl nisl vitae nisl.\n\nDonec euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, vitae aliquam nisl nisl vitae nisl. Sed euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, vitae aliquam nisl nisl vitae nisl. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam. Vivamus porttitor turpis ac leo.`;
      return {
        number: pageNum,
        text,
        displayText: text,
        images: [],
        hasContent: true,
      } satisfies BookPage;
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

    const newUserMessage: ChatMessage = { role: "user", text: assistantInput };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setAssistantInput("");
    setIsAssistantLoading(true);

    try {
      const fullBookText = bookPages
        .map((page) => page.text || page.displayText)
        .join("\n\n---\n\n");
      const response: GenerateContentResponse = await ai.models.generateContent(
        {
          model: "gemini-2.5-flash",
          contents: `User's question: ${assistantInput}`,
          config: {
            systemInstruction: `You are a helpful AI assistant for an ebook reader. The user is currently reading a book. Here is the full content of the book. Answer the user's questions based on this content and use your web search capabilities for external information. Provide citations for your web searches.

                --- BOOK CONTENT START ---
                ${fullBookText}
                --- BOOK CONTENT END ---`,
            tools: [{ googleSearch: {} }],
          },
        },
      );

      const citations =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks
          ?.map((chunk: any) => chunk.web)
          .filter((web) => web && web.uri && web.title) || [];

      const modelResponse: ChatMessage = {
        role: "model",
        text: response.text,
        citations: citations.length > 0 ? citations : undefined,
      };
      setChatHistory((prev) => [...prev, modelResponse]);
    } catch (error) {
      console.error('Assistant error:', error);
      const errorResponse: ChatMessage = {
        role: "model",
        text: "Sorry, I encountered an error. Please try again.",
      };
      setChatHistory((prev) => [...prev, errorResponse]);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const generateMindMap = async () => {
    if (mindMapData || !isBookLoaded) return; // Don't re-generate if data exists

    setIsGeneratingMindMap(true);
    try {
      const fullBookText = bookPages
        .map((page) => page.text || page.displayText)
        .join("\n\n---\n\n");

      const nodeSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          children: { type: Type.ARRAY, items: {} }, // Recursive part
        },
        required: ["title"],
      };
      // Define a max depth for the schema to avoid infinite recursion issues client-side.
      // Let's go 4 levels deep.
      const nodeSchemaL4 = {
        type: Type.OBJECT,
        properties: { title: { type: Type.STRING } },
        required: ["title"],
      };
      const nodeSchemaL3 = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          children: { type: Type.ARRAY, items: nodeSchemaL4 },
        },
        required: ["title"],
      };
      const nodeSchemaL2 = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          children: { type: Type.ARRAY, items: nodeSchemaL3 },
        },
        required: ["title"],
      };
      const mindMapSchema = {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "The central theme or title of the book.",
          },
          children: { type: Type.ARRAY, items: nodeSchemaL2 },
        },
        required: ["title", "children"],
      };

      const response: GenerateContentResponse = await ai.models.generateContent(
        {
          model: "gemini-2.5-flash",
          contents: `Analyze the entire text of the book provided below and generate a hierarchical mind map of its key concepts, themes, and structure. The mind map should have a central theme and branch out into major topics, which then branch into smaller sub-topics. Structure the output according to the provided JSON schema.

            --- BOOK CONTENT START ---
            ${fullBookText}
            --- BOOK CONTENT END ---`,
          config: {
            responseMimeType: "application/json",
            responseSchema: mindMapSchema,
          },
        },
      );

      const mindMapJson = JSON.parse(response.text);
      setMindMapData(mindMapJson);
    } catch (error) {
      console.error('Failed to generate mind map:', error);
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
        setSummary(""); // Clear summary when page changes

        // Pre-generate audio for upcoming pages
        if (bookPages.length > nextPage && ttsBackendHealthy) {
          const upcomingPages = bookPages.slice(nextPage, nextPage + 3).map(p => ({
            id: String(p.number),
            number: p.number,
            text: p.text || p.displayText || ''
          }));
          ttsService.preGeneratePages(upcomingPages, ttsVoice)
            .catch(err => console.warn('Pre-generation failed:', err));
        }
      }
      return nextPage;
    });
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => {
      const prevPage = Math.max(prev - 1, 1);
      if (prevPage !== prev) {
        setSummary(""); // Clear summary when page changes
      }
      return prevPage;
    });
  };

  const toggleAudioPlayer = () => {
    setIsAudioPlayerVisible((prev) => !prev);
  };

  const toggleAssistantPanel = () => {
    setIsAssistantVisible((prev) => !prev);
  };

  const toggleMindMap = () => {
    setIsMindMapVisible((prev) => {
      const newVisibility = !prev;
      if (newVisibility && !mindMapData) {
        generateMindMap();
      }
      return newVisibility;
    });
  };

  // TTS Functions
  const handleTTSPlay = async () => {
    const page = bookPages[currentPage - 1];
    if (!page) return;
    const speechSource = page.text.trim() || page.displayText.trim();
    if (!speechSource) {
      console.warn("Skipping TTS: page without textual content", page.number);
      return;
    }

    try {
      // Calculate rate: 0.5x = -50%, 1.0x = +0%, 1.5x = +50%, 2.0x = +100%
      const ratePercent = Math.round((ttsSpeed - 1) * 100);
      const rateString = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;

      // Use contextual TTS if available, otherwise fallback to regular
      const audio = await ttsService.generateContextualAudio(speechSource, {
        language: ttsVoice,  // ttsVoice now holds the language code ("pt")
        emotion_exaggeration: 0.6,  // Natural emotion level for books
        cfg_scale: 0.4,  // More expressive reading
        auto_emotion: true,  // Auto-detect emotions from text
        pre_analyze: true,  // Analyze full context before speaking
        page_id: String(page.number)
      });

      setIsTTSPlaying(true);
      await ttsService.playAudio(audio);

      // Auto-advance to next page when audio ends
      if (currentPage < totalPages) {
        goToNextPage();
        // Continue playing next page
        handleTTSPlay();
      } else {
        setIsTTSPlaying(false);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsTTSPlaying(false);
    }
  };

  const handleTTSPause = () => {
    ttsService.pauseAudio();
    setIsTTSPlaying(false);
  };

  const handleTTSStop = () => {
    ttsService.stopAudio();
    setIsTTSPlaying(false);
  };

  const handleTTSVoiceChange = (voice: string) => {
    setTTSVoice(voice);
  };

  const handleTTSSpeedChange = (speed: number) => {
    setTTSSpeed(speed);
    ttsService.setPlaybackRate(speed);
  };

  const isBookLoaded = bookPages.length > 0;

  return (
    <div className="bg-[#121212] text-neutral-300 font-serif h-screen antialiased relative overflow-hidden select-none flex flex-col">
      <div
        className="absolute inset-0 w-full h-full opacity-[0.02]"
        style={{
          backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiPjwvcmVjdD4KPC9zdmc+')`,
        }}
      ></div>

      {/* Error Notification - temporarily disabled for now */}

      <div
        className={`relative z-10 flex-grow flex flex-col transition-all duration-300 ${isAssistantVisible ? "pr-96" : ""}`}
      >
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
            <h1 className="text-4xl font-bold mb-4">
              Welcome to the Ebook Reader
            </h1>
            <p className="text-lg text-neutral-400 mb-8">
              Import content from various sources to begin your reading journey.
            </p>

            <div className="flex flex-col gap-6 w-full max-w-lg">
              {/* File Upload Section */}
              <div className="bg-neutral-800/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-neutral-200">
                  Upload Document
                </h2>
                <p className="text-sm text-neutral-400 mb-4">
                  PDF, ePub, Word, PowerPoint, and more{" "}
                  {backendHealthy ? "✓" : "(Backend required for non-PDF)"}
                </p>
                <label
                  htmlFor="file-upload"
                  className="bg-neutral-700 text-white font-sans font-bold py-3 px-6 rounded-lg cursor-pointer hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2"
                >
                  <UploadIcon className="w-5 h-5" />
                  Choose File
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept={backendHealthy ? "*" : "application/pdf"}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* YouTube Import Section */}
              <YouTubeInput onSubmit={handleYouTubeURL} isLoading={isLoading} />

              {/* Backend Status */}
              {!backendHealthy && (
                <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
                  <p className="text-sm text-yellow-400">
                    ⚠️ Backend service not available. Only PDF files supported.
                  </p>
                  <p className="text-xs text-yellow-400/80 mt-1">
                    Start the backend server to enable YouTube, ePub, and other
                    formats.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!isLoading && isBookLoaded && (
          <>
            <main
              className={`flex-grow px-4 md:px-8 lg:px-12 xl:px-16 pt-20 pb-6 transition-all duration-300 ${isAudioPlayerVisible ? "pb-72" : "pb-24"}`}
            >
              <BookView
                page={bookPages[currentPage - 1] ?? null}
                currentPage={currentPage}
                title={bookTitle}
                onSummarize={summarizeCurrentPage}
                summary={summary}
                isSummarizing={isSummarizing}
                pdfDocument={pdfDocument}
                previewCache={pagePreviewCache}
              />
            </main>
            {isAudioPlayerVisible && <VolumeSlider />}
            <AudioPlayer
              isVisible={isAudioPlayerVisible}
              isBookLoaded={isBookLoaded}
              isTTSPlaying={isTTSPlaying}
              ttsVoice={ttsVoice}
              ttsSpeed={ttsSpeed}
              ttsBackendHealthy={ttsBackendHealthy}
              currentPage={currentPage}
              totalPages={totalPages}
              onTTSPlay={handleTTSPlay}
              onTTSPause={handleTTSPause}
              onTTSStop={handleTTSStop}
              onTTSVoiceChange={handleTTSVoiceChange}
              onTTSSpeedChange={handleTTSSpeedChange}
            />
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
