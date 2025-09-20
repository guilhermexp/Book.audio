import axios from 'axios';

const API_BASE_URL = 'http://localhost:8010';

export interface TTSVoice {
  id: string;
  name: string;
  gender: string;
  locale: string;
}

export interface TTSOptions {
  voice?: string;
  rate?: string;
  pitch?: string;
}

export interface TTSPageResponse {
  audioUrl: string;
  duration: number;
  pageNumber: number;
  cached: boolean;
}

class TTSService {
  private static instance: TTSService;
  private audioCache: Map<string, string> = new Map();
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;

  private constructor() {}

  static getInstance(): TTSService {
    if (!this.instance) {
      this.instance = new TTSService();
    }
    return this.instance;
  }

  /**
   * Generate audio for text
   */
  async generateAudio(text: string, options: TTSOptions = {}): Promise<Blob> {
    const {
      voice = 'pt-BR-FranciscaNeural',
      rate = '+0%',
      pitch = '+0Hz'
    } = options;

    // Generate cache key
    const cacheKey = this.getCacheKey(text, voice, rate, pitch);

    // Check cache
    const cached = this.audioCache.get(cacheKey);
    if (cached) {
      const response = await fetch(cached);
      return await response.blob();
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/tts/generate`,
        { text, voice, rate, pitch },
        { responseType: 'blob' }
      );

      // Cache the blob URL
      const blobUrl = URL.createObjectURL(response.data);
      this.audioCache.set(cacheKey, blobUrl);

      return response.data;
    } catch (error: any) {
      console.error('Error generating TTS audio:', error);
      throw new Error(error.response?.data?.detail || 'Failed to generate audio');
    }
  }

  /**
   * Generate audio for a book page
   */
  async generatePageAudio(
    pageContent: string,
    pageNumber: number,
    options: TTSOptions = {}
  ): Promise<TTSPageResponse> {
    const {
      voice = 'pt-BR-FranciscaNeural',
      rate = '+0%',
      pitch = '+0Hz'
    } = options;

    try {
      const response = await axios.post<TTSPageResponse>(
        `${API_BASE_URL}/api/tts/generate-page`,
        {
          page_content: pageContent,
          page_number: pageNumber,
          voice,
          rate,
          pitch
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error generating page audio:', error);
      throw new Error(error.response?.data?.detail || 'Failed to generate page audio');
    }
  }

  /**
   * Get available voices
   */
  async getVoices(locale?: string): Promise<TTSVoice[]> {
    try {
      const params = locale ? { locale } : {};
      const response = await axios.get(`${API_BASE_URL}/api/tts/voices`, { params });
      return response.data.voices;
    } catch (error: any) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  /**
   * Play audio from blob
   */
  async playAudio(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Stop current audio if playing
        this.stopAudio();

        const audioUrl = URL.createObjectURL(blob);
        this.currentAudio = new Audio(audioUrl);

        this.currentAudio.onended = () => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        this.currentAudio.onerror = (error) => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };

        this.currentAudio.play();
        this.isPlaying = true;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Play audio from URL
   */
  async playAudioUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Stop current audio if playing
        this.stopAudio();

        this.currentAudio = new Audio(url);

        this.currentAudio.onended = () => {
          this.isPlaying = false;
          resolve();
        };

        this.currentAudio.onerror = (error) => {
          this.isPlaying = false;
          reject(error);
        };

        this.currentAudio.play();
        this.isPlaying = true;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Pause current audio
   */
  pauseAudio(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Resume current audio
   */
  resumeAudio(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
      this.isPlaying = true;
    }
  }

  /**
   * Stop current audio
   */
  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.isPlaying = false;
    }
  }

  /**
   * Get playback status
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Set playback speed
   */
  setPlaybackRate(rate: number): void {
    if (this.currentAudio) {
      this.currentAudio.playbackRate = rate;
    }
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    if (this.currentAudio) {
      this.currentAudio.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }

  /**
   * Clear audio cache
   */
  clearCache(): void {
    // Revoke all cached blob URLs
    this.audioCache.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.audioCache.clear();
    // Also clear persistent cache
    ttsAudioCache.clear();
  }

  /**
   * Preload audio for adjacent pages
   */
  async preloadAdjacentPages(
    currentPage: number,
    getPageContent: (page: number) => string | null,
    totalPages: number,
    options: TTSOptions = {}
  ): Promise<void> {
    const pagesToPreload: number[] = [];

    // Preload next pages
    for (let i = 1; i <= this.maxPreloadPages; i++) {
      const nextPage = currentPage + i;
      if (nextPage <= totalPages) {
        pagesToPreload.push(nextPage);
      }
    }

    // Preload in background
    for (const pageNum of pagesToPreload) {
      const content = getPageContent(pageNum);
      if (content && !this.preloadQueue.has(`page_${pageNum}`)) {
        this.preloadQueue.add(`page_${pageNum}`);

        // Preload without blocking
        this.generateAudio(content, options)
          .then(() => {
            console.log(`Preloaded audio for page ${pageNum}`);
          })
          .catch(() => {
            // Silent fail for preloading
          })
          .finally(() => {
            this.preloadQueue.delete(`page_${pageNum}`);
          });
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      memory: {
        size: this.audioCache.size,
        urls: Array.from(this.audioCache.keys())
      },
      persistent: ttsAudioCache.getStats(),
      preloading: this.preloadQueue.size
    };
  }

  /**
   * Generate cache key
   */
  private getCacheKey(text: string, voice: string, rate: string, pitch: string): string {
    return `${text.substring(0, 50)}_${voice}_${rate}_${pitch}`;
  }

  /**
   * Check if backend is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('TTS backend health check failed:', error);
      return false;
    }
  }
}

export const ttsService = TTSService.getInstance();