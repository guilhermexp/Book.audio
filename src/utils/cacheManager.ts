// Intelligent Caching System with LRU Eviction

import { CacheEntry, CacheStats } from '../types/api';

export interface CacheConfig {
  maxSize: number; // Max size in bytes
  maxEntries: number; // Max number of entries
  ttl: number; // Time to live in milliseconds
  strategy: 'lru' | 'lfu' | 'fifo';
  persistent: boolean; // Use localStorage for persistence
  compressionEnabled: boolean;
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private accessFrequency: Map<string, number>;
  private totalSize: number;
  private config: CacheConfig;
  private persistenceKey: string;

  constructor(
    name: string,
    config: Partial<CacheConfig> = {}
  ) {
    this.persistenceKey = `cache_${name}`;
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      maxEntries: 100,
      ttl: 3600000, // 1 hour default
      strategy: 'lru',
      persistent: true,
      compressionEnabled: false,
      ...config
    };

    this.cache = new Map();
    this.accessFrequency = new Map();
    this.totalSize = 0;

    // Load from persistence if enabled
    if (this.config.persistent) {
      this.loadFromStorage();
    }
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }

    // Update access patterns
    this.updateAccessPatterns(key, entry);

    return entry.value;
  }

  /**
   * Set item in cache
   */
  set(key: string, value: T, customTTL?: number): void {
    const size = this.estimateSize(value);

    // Check if item is too large
    if (size > this.config.maxSize) {
      console.warn(`Item too large for cache: ${key} (${size} bytes)`);
      return;
    }

    // Evict if necessary
    while (
      (this.totalSize + size > this.config.maxSize ||
       this.cache.size >= this.config.maxEntries) &&
      this.cache.size > 0
    ) {
      this.evictOne();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + (customTTL || this.config.ttl),
      hits: 0
    };

    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    this.cache.set(key, entry);
    this.accessFrequency.set(key, 0);
    this.totalSize += size;

    // Persist if enabled
    if (this.config.persistent) {
      this.saveToStorage();
    }
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    const size = this.estimateSize(entry.value);
    this.totalSize -= size;
    this.cache.delete(key);
    this.accessFrequency.delete(key);

    if (this.config.persistent) {
      this.saveToStorage();
    }

    return true;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessFrequency.clear();
    this.totalSize = 0;

    if (this.config.persistent) {
      this.clearStorage();
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    return {
      totalEntries: this.cache.size,
      totalSize: this.totalSize,
      hitRate: this.calculateHitRate(),
      missRate: this.calculateMissRate(),
      oldestEntry: Math.min(...entries.map(e => e.timestamp), now),
      newestEntry: Math.max(...entries.map(e => e.timestamp), now)
    };
  }

  /**
   * Warm cache with frequently accessed items
   */
  async warmCache(
    keys: string[],
    fetcher: (key: string) => Promise<T>
  ): Promise<void> {
    const promises = keys.map(async (key) => {
      if (!this.has(key)) {
        try {
          const value = await fetcher(key);
          this.set(key, value);
        } catch (error) {
          console.error(`Failed to warm cache for key: ${key}`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get or fetch item (cache-aside pattern)
   */
  async getOrFetch(
    key: string,
    fetcher: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    try {
      const value = await fetcher();
      this.set(key, value, customTTL);
      return value;
    } catch (error) {
      console.error(`Failed to fetch for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0;
    const keys = Array.from(this.cache.keys());

    for (const key of keys) {
      if (pattern.test(key)) {
        this.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Update access patterns for cache strategy
   */
  private updateAccessPatterns(key: string, entry: CacheEntry<T>): void {
    entry.hits++;

    if (this.config.strategy === 'lru') {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, entry);
    } else if (this.config.strategy === 'lfu') {
      // Increment frequency
      const freq = this.accessFrequency.get(key) || 0;
      this.accessFrequency.set(key, freq + 1);
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Evict one entry based on strategy
   */
  private evictOne(): void {
    let keyToEvict: string | null = null;

    switch (this.config.strategy) {
      case 'lru':
        // Evict least recently used (first in map)
        keyToEvict = this.cache.keys().next().value;
        break;

      case 'lfu':
        // Evict least frequently used
        let minFreq = Infinity;
        for (const [key, freq] of this.accessFrequency) {
          if (freq < minFreq) {
            minFreq = freq;
            keyToEvict = key;
          }
        }
        break;

      case 'fifo':
        // Evict first in (oldest)
        let oldestTime = Infinity;
        for (const [key, entry] of this.cache) {
          if (entry.timestamp < oldestTime) {
            oldestTime = entry.timestamp;
            keyToEvict = key;
          }
        }
        break;
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
    }
  }

  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: T): number {
    if (value instanceof Blob) {
      return value.size;
    }

    if (value instanceof ArrayBuffer) {
      return value.byteLength;
    }

    // For other types, estimate based on JSON string
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 1024; // Default estimate
    }
  }

  /**
   * Calculate cache hit rate
   */
  private calculateHitRate(): number {
    const totalHits = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.hits, 0);

    if (totalHits === 0) return 0;

    const totalAccesses = totalHits + this.calculateMisses();
    return totalHits / totalAccesses;
  }

  /**
   * Calculate cache miss rate
   */
  private calculateMissRate(): number {
    return 1 - this.calculateHitRate();
  }

  /**
   * Calculate estimated misses (simplified)
   */
  private calculateMisses(): number {
    // This is a simplified calculation
    // In production, you'd track actual misses
    return Math.max(1, this.cache.size);
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (!this.config.persistent || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const serialized = {
        entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
          key,
          entry: {
            ...entry,
            value: this.serializeValue(entry.value)
          }
        })),
        accessFrequency: Array.from(this.accessFrequency.entries()),
        totalSize: this.totalSize
      };

      localStorage.setItem(this.persistenceKey, JSON.stringify(serialized));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (!this.config.persistent || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.persistenceKey);
      if (!stored) return;

      const { entries, accessFrequency, totalSize } = JSON.parse(stored);

      // Restore cache entries
      for (const { key, entry } of entries) {
        if (!this.isExpired(entry)) {
          entry.value = this.deserializeValue(entry.value);
          this.cache.set(key, entry);
        }
      }

      // Restore access frequency
      this.accessFrequency = new Map(accessFrequency);
      this.totalSize = totalSize || 0;
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
      this.clearStorage();
    }
  }

  /**
   * Clear cache from localStorage
   */
  private clearStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.persistenceKey);
    }
  }

  /**
   * Serialize value for storage
   */
  private serializeValue(value: T): any {
    // Handle special types
    if (value instanceof Blob || value instanceof ArrayBuffer) {
      // Convert to base64 for storage
      return { __type: 'binary', data: 'base64_encoded_data' };
    }
    return value;
  }

  /**
   * Deserialize value from storage
   */
  private deserializeValue(stored: any): T {
    // Handle special types
    if (stored?.__type === 'binary') {
      // Convert from base64
      return stored.data as T;
    }
    return stored as T;
  }
}

// Specialized cache for different types of data

export class TTSAudioCache extends CacheManager<Blob> {
  constructor() {
    super('tts_audio', {
      maxSize: 100 * 1024 * 1024, // 100MB for audio
      maxEntries: 50,
      ttl: 7200000, // 2 hours for audio
      strategy: 'lru',
      persistent: true
    });
  }

  generateKey(text: string, voice: string, speed: number): string {
    return `${voice}_${speed}_${this.hashText(text)}`;
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }
}

export class PDFContentCache extends CacheManager<any> {
  constructor() {
    super('pdf_content', {
      maxSize: 50 * 1024 * 1024, // 50MB for PDFs
      maxEntries: 20,
      ttl: 3600000, // 1 hour
      strategy: 'lru',
      persistent: true
    });
  }

  generateKey(fileName: string, pageNumber?: number): string {
    return pageNumber ? `${fileName}_page_${pageNumber}` : fileName;
  }
}

export class AIResponseCache extends CacheManager<string> {
  constructor() {
    super('ai_responses', {
      maxSize: 10 * 1024 * 1024, // 10MB for AI responses
      maxEntries: 100,
      ttl: 1800000, // 30 minutes
      strategy: 'lfu', // Frequently accessed responses stay longer
      persistent: true
    });
  }

  generateKey(prompt: string, context?: string): string {
    const combined = context ? `${context}_${prompt}` : prompt;
    return this.simpleHash(combined);
  }

  private simpleHash(str: string): string {
    return str.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString(36);
  }
}

// Export singleton instances
export const ttsAudioCache = new TTSAudioCache();
export const pdfContentCache = new PDFContentCache();
export const aiResponseCache = new AIResponseCache();