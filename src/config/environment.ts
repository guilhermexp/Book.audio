// Environment Configuration

export interface EnvironmentConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  gemini: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  tts: {
    defaultVoice: string;
    defaultSpeed: number;
    defaultLanguage: string;
    cacheSize: number;
    cacheTTL: number;
  };
  pdf: {
    maxFileSize: number;
    maxPages: number;
    enableBackendProcessing: boolean;
    imageExtractionQuality: number;
  };
  cache: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
    strategy: 'lru' | 'lfu' | 'fifo';
  };
  features: {
    enableAI: boolean;
    enableTTS: boolean;
    enableMindMap: boolean;
    enableWebSearch: boolean;
    enableOfflineMode: boolean;
  };
  performance: {
    lazyLoadThreshold: number;
    preloadPages: number;
    debounceDelay: number;
    throttleDelay: number;
  };
}

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return import.meta.env[key] || defaultValue;
};

const getEnvBool = (key: string, defaultValue: boolean = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

const getEnvNumber = (key: string, defaultValue: number = 0): number => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
};

export const environment: EnvironmentConfig = {
  api: {
    baseUrl: getEnvVar('VITE_API_URL', 'http://localhost:8010'),
    timeout: getEnvNumber('VITE_API_TIMEOUT', 30000),
    retryAttempts: getEnvNumber('VITE_API_RETRY_ATTEMPTS', 3),
    retryDelay: getEnvNumber('VITE_API_RETRY_DELAY', 1000),
  },
  gemini: {
    apiKey: getEnvVar('GEMINI_API_KEY', ''),
    model: getEnvVar('VITE_GEMINI_MODEL', 'gemini-1.5-flash'),
    maxTokens: getEnvNumber('VITE_GEMINI_MAX_TOKENS', 8192),
    temperature: parseFloat(getEnvVar('VITE_GEMINI_TEMPERATURE', '0.7')),
  },
  tts: {
    defaultVoice: getEnvVar('VITE_TTS_DEFAULT_VOICE', 'pt-BR-FranciscaNeural'),
    defaultSpeed: parseFloat(getEnvVar('VITE_TTS_DEFAULT_SPEED', '1.0')),
    defaultLanguage: getEnvVar('VITE_TTS_DEFAULT_LANGUAGE', 'pt-BR'),
    cacheSize: getEnvNumber('VITE_TTS_CACHE_SIZE', 50),
    cacheTTL: getEnvNumber('VITE_TTS_CACHE_TTL', 3600000), // 1 hour
  },
  pdf: {
    maxFileSize: getEnvNumber('VITE_PDF_MAX_FILE_SIZE', 104857600), // 100MB
    maxPages: getEnvNumber('VITE_PDF_MAX_PAGES', 1000),
    enableBackendProcessing: getEnvBool('VITE_PDF_BACKEND_PROCESSING', true),
    imageExtractionQuality: parseFloat(getEnvVar('VITE_PDF_IMAGE_QUALITY', '0.8')),
  },
  cache: {
    enabled: getEnvBool('VITE_CACHE_ENABLED', true),
    maxSize: getEnvNumber('VITE_CACHE_MAX_SIZE', 52428800), // 50MB
    ttl: getEnvNumber('VITE_CACHE_TTL', 3600000), // 1 hour
    strategy: getEnvVar('VITE_CACHE_STRATEGY', 'lru') as 'lru' | 'lfu' | 'fifo',
  },
  features: {
    enableAI: getEnvBool('VITE_FEATURE_AI', true),
    enableTTS: getEnvBool('VITE_FEATURE_TTS', true),
    enableMindMap: getEnvBool('VITE_FEATURE_MINDMAP', true),
    enableWebSearch: getEnvBool('VITE_FEATURE_WEB_SEARCH', true),
    enableOfflineMode: getEnvBool('VITE_FEATURE_OFFLINE', false),
  },
  performance: {
    lazyLoadThreshold: getEnvNumber('VITE_LAZY_LOAD_THRESHOLD', 3),
    preloadPages: getEnvNumber('VITE_PRELOAD_PAGES', 2),
    debounceDelay: getEnvNumber('VITE_DEBOUNCE_DELAY', 300),
    throttleDelay: getEnvNumber('VITE_THROTTLE_DELAY', 100),
  },
};

// Validation
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!environment.gemini.apiKey) {
    errors.push('GEMINI_API_KEY is required');
  }

  if (environment.api.timeout < 1000) {
    errors.push('API timeout must be at least 1000ms');
  }

  if (environment.tts.defaultSpeed < 0.5 || environment.tts.defaultSpeed > 2.0) {
    errors.push('TTS speed must be between 0.5 and 2.0');
  }

  if (environment.pdf.maxFileSize < 1048576) {
    errors.push('PDF max file size must be at least 1MB');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Helper to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof environment.features): boolean => {
  return environment.features[feature];
};

// Helper to get API endpoints
export const getApiEndpoint = (path: string): string => {
  const baseUrl = environment.api.baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Export for use in other modules
export default environment;