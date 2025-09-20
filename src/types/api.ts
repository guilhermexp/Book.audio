// API Contract Types for Book.audio

// Common Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// Document Conversion Types
export interface ConversionRequest {
  file: File;
  format?: 'pdf' | 'epub' | 'docx' | 'pptx';
}

export interface ConversionResponse {
  content: string;
  metadata: DocumentMetadata;
  pages: BookPage[];
  pageCount: number;
  validation: PageValidation;
}

export interface DocumentMetadata {
  title: string;
  author?: string;
  createdAt?: string;
  modifiedAt?: string;
  format: string;
  size: number;
  language?: string;
}

export interface BookPage {
  pageNumber: number;
  content: string;
  images?: PageImage[];
  metadata?: PageMetadata;
  validationStatus?: 'valid' | 'warning' | 'error';
}

export interface PageImage {
  id: string;
  url: string;
  width: number;
  height: number;
  caption?: string;
}

export interface PageMetadata {
  wordCount: number;
  charCount: number;
  hasImages: boolean;
  readingTime?: number; // in seconds
}

export interface PageValidation {
  isValid: boolean;
  totalPages: number;
  validatedPages: number;
  issues?: ValidationIssue[];
}

export interface ValidationIssue {
  page: number;
  type: 'missing' | 'corrupt' | 'encoding' | 'other';
  message: string;
  severity: 'info' | 'warning' | 'error';
}

// YouTube Conversion Types
export interface YouTubeRequest {
  url: string;
  includeTimestamps?: boolean;
  language?: string;
}

export interface YouTubeResponse {
  title: string;
  author: string;
  duration: number;
  transcript: TranscriptEntry[];
  metadata: YouTubeMetadata;
}

export interface TranscriptEntry {
  text: string;
  start: number;
  duration: number;
  timestamp?: string;
}

export interface YouTubeMetadata {
  videoId: string;
  channelId: string;
  publishedAt: string;
  viewCount: number;
  language: string;
}

// TTS (Text-to-Speech) Types
export interface TTSRequest {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  format?: 'mp3' | 'wav' | 'ogg';
}

export interface TTSResponse {
  audioUrl: string;
  duration: number;
  size: number;
  voice: VoiceInfo;
  cached: boolean;
}

export interface VoiceInfo {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  accent?: string;
  quality: 'standard' | 'premium' | 'neural';
  recommended?: boolean;
}

// Brazilian Voice Types
export interface BrazilianVoiceRequest {
  contentType?: 'narrative' | 'technical' | 'casual' | 'formal';
  preferredGender?: 'male' | 'female' | 'any';
}

export interface BrazilianVoiceResponse {
  voices: BrazilianVoice[];
  recommended: BrazilianVoice;
}

export interface BrazilianVoice extends VoiceInfo {
  naturalness: number; // 0-100
  clarity: number; // 0-100
  expressiveness: number; // 0-100
  suitability: {
    narrative: number;
    technical: number;
    casual: number;
    formal: number;
  };
}

// Text Optimization Types
export interface TextOptimizationRequest {
  text: string;
  targetVoice?: string;
  language?: string;
  optimizationType?: 'naturalness' | 'clarity' | 'emphasis';
}

export interface TextOptimizationResponse {
  originalText: string;
  optimizedText: string;
  changes: TextChange[];
  improvements: {
    naturalness: number;
    clarity: number;
    flowScore: number;
  };
}

export interface TextChange {
  type: 'punctuation' | 'pause' | 'emphasis' | 'pronunciation';
  original: string;
  replacement: string;
  position: number;
  reason: string;
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: ServiceHealth[];
  version: string;
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
  suggestion?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}

// Cache Types
export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  oldestEntry: number;
  newestEntry: number;
}

// WebSocket Types for Real-time Features
export interface WSMessage {
  type: 'audio_progress' | 'page_sync' | 'error' | 'status';
  payload: any;
  timestamp: number;
}

export interface AudioProgressPayload {
  currentTime: number;
  duration: number;
  page: number;
  paragraph?: number;
  word?: number;
}

export interface PageSyncPayload {
  fromPage: number;
  toPage: number;
  reason: 'manual' | 'audio' | 'navigation';
  timestamp: number;
}

// Session Types
export interface ReadingSession {
  id: string;
  documentId: string;
  currentPage: number;
  audioPosition?: number;
  bookmarks: Bookmark[];
  startedAt: string;
  lastActivity: string;
  progress: number; // 0-100
}

export interface Bookmark {
  id: string;
  page: number;
  position?: number;
  note?: string;
  createdAt: string;
  type: 'manual' | 'auto' | 'highlight';
}