// Error Handling and Recovery System

import { ApiError } from '../types/api';

export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  PDF_PROCESSING = 'PDF_PROCESSING',
  TTS = 'TTS',
  FILE_SIZE = 'FILE_SIZE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  BACKEND_UNAVAILABLE = 'BACKEND_UNAVAILABLE',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: any;
  timestamp: number;
  retryable: boolean;
  suggestion?: string;
  fallbackAction?: () => void;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorContext[] = [];
  private maxLogSize = 100;
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;
  private listeners: ((error: ErrorContext) => void)[] = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Subscribe to error events
   */
  onError(callback: (error: ErrorContext) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Handle an error with appropriate recovery strategy
   */
  async handleError(
    error: any,
    context?: Partial<ErrorContext>
  ): Promise<ErrorContext> {
    const errorContext = this.createErrorContext(error, context);

    // Log the error
    this.logError(errorContext);

    // Notify listeners
    this.notifyListeners(errorContext);

    // Apply recovery strategy
    await this.applyRecoveryStrategy(errorContext);

    return errorContext;
  }

  /**
   * Create structured error context from various error types
   */
  private createErrorContext(
    error: any,
    context?: Partial<ErrorContext>
  ): ErrorContext {
    let type = ErrorType.UNKNOWN;
    let message = 'An unexpected error occurred';
    let severity = ErrorSeverity.ERROR;
    let retryable = false;
    let suggestion: string | undefined;

    // Determine error type and details
    if (error?.response) {
      // HTTP error
      const status = error.response.status;
      if (status >= 500) {
        type = ErrorType.API;
        severity = ErrorSeverity.ERROR;
        retryable = true;
        message = `Server error: ${error.response.data?.detail || 'Internal server error'}`;
        suggestion = 'The server is experiencing issues. Please try again in a few moments.';
      } else if (status === 404) {
        type = ErrorType.API;
        severity = ErrorSeverity.WARNING;
        message = 'Resource not found';
        suggestion = 'The requested resource was not found. Please check your request.';
      } else if (status === 413) {
        type = ErrorType.FILE_SIZE;
        severity = ErrorSeverity.WARNING;
        message = 'File too large';
        suggestion = 'Please select a file smaller than 50MB.';
      } else if (status === 400) {
        type = ErrorType.VALIDATION;
        severity = ErrorSeverity.WARNING;
        message = error.response.data?.detail || 'Invalid request';
      }
    } else if (error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK') {
      type = ErrorType.NETWORK;
      severity = ErrorSeverity.ERROR;
      retryable = true;
      message = 'Network connection error';
      suggestion = 'Please check your internet connection and try again.';
    } else if (error?.message?.includes('PDF')) {
      type = ErrorType.PDF_PROCESSING;
      severity = ErrorSeverity.ERROR;
      message = error.message;
      suggestion = 'There was an issue processing the PDF. Try a different file or contact support.';
    } else if (error?.message?.includes('TTS') || error?.message?.includes('audio')) {
      type = ErrorType.TTS;
      severity = ErrorSeverity.WARNING;
      retryable = true;
      message = error.message;
      suggestion = 'Audio generation failed. You can still read the text version.';
    } else if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    }

    return {
      type: context?.type || type,
      severity: context?.severity || severity,
      message: context?.message || message,
      details: error,
      timestamp: Date.now(),
      retryable: context?.retryable ?? retryable,
      suggestion: context?.suggestion || suggestion,
      fallbackAction: context?.fallbackAction,
      ...context
    };
  }

  /**
   * Log error for debugging and analytics
   */
  private logError(error: ErrorContext): void {
    // Add to internal log
    this.errorLog.push(error);

    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Console output based on severity
    switch (error.severity) {
      case ErrorSeverity.INFO:
        console.info('[ErrorHandler]', error.message, error);
        break;
      case ErrorSeverity.WARNING:
        console.warn('[ErrorHandler]', error.message, error);
        break;
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        console.error('[ErrorHandler]', error.message, error);
        break;
    }
  }

  /**
   * Notify all registered listeners
   */
  private notifyListeners(error: ErrorContext): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }

  /**
   * Apply recovery strategy based on error type
   */
  private async applyRecoveryStrategy(error: ErrorContext): Promise<void> {
    // Execute fallback action if provided
    if (error.fallbackAction) {
      try {
        error.fallbackAction();
      } catch (e) {
        console.error('Fallback action failed:', e);
      }
    }

    // Type-specific recovery
    switch (error.type) {
      case ErrorType.NETWORK:
        await this.handleNetworkError(error);
        break;
      case ErrorType.BACKEND_UNAVAILABLE:
        await this.handleBackendUnavailable(error);
        break;
      case ErrorType.TTS:
        await this.handleTTSError(error);
        break;
      case ErrorType.PDF_PROCESSING:
        await this.handlePDFError(error);
        break;
    }
  }

  /**
   * Handle network errors with retry logic
   */
  private async handleNetworkError(error: ErrorContext): Promise<void> {
    if (!error.retryable) return;

    const key = `${error.type}-${error.message}`;
    const attempts = this.retryAttempts.get(key) || 0;

    if (attempts < this.maxRetries) {
      this.retryAttempts.set(key, attempts + 1);
      console.log(`Retry attempt ${attempts + 1}/${this.maxRetries} for network error`);

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      console.error('Max retries exceeded for network error');
      this.retryAttempts.delete(key);
    }
  }

  /**
   * Handle backend unavailable scenarios
   */
  private async handleBackendUnavailable(error: ErrorContext): Promise<void> {
    console.warn('Backend unavailable, falling back to client-side processing');
    // The application should already handle this gracefully
  }

  /**
   * Handle TTS errors
   */
  private async handleTTSError(error: ErrorContext): Promise<void> {
    console.warn('TTS service error, audio features may be limited');
  }

  /**
   * Handle PDF processing errors
   */
  private async handlePDFError(error: ErrorContext): Promise<void> {
    console.error('PDF processing error, some features may not work correctly');
  }

  /**
   * Get retry count for a specific error
   */
  getRetryCount(errorKey: string): number {
    return this.retryAttempts.get(errorKey) || 0;
  }

  /**
   * Reset retry count for an error
   */
  resetRetryCount(errorKey: string): void {
    this.retryAttempts.delete(errorKey);
  }

  /**
   * Check if should retry based on error context
   */
  shouldRetry(error: ErrorContext): boolean {
    if (!error.retryable) return false;

    const key = `${error.type}-${error.message}`;
    const attempts = this.retryAttempts.get(key) || 0;
    return attempts < this.maxRetries;
  }

  /**
   * Perform retry with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    errorContext?: Partial<ErrorContext>
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`Retry attempt ${attempt + 1}/${this.maxRetries}, waiting ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw await this.handleError(lastError, errorContext);
  }

  /**
   * Get error log for debugging
   */
  getErrorLog(): ErrorContext[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
    this.retryAttempts.clear();
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recentErrors: ErrorContext[];
  } {
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recentErrors: this.errorLog.slice(-10)
    };

    // Count by type
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = this.errorLog.filter(e => e.type === type).length;
    });

    // Count by severity
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = this.errorLog.filter(e => e.severity === severity).length;
    });

    return stats;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility function for user-friendly error messages
export function getUserFriendlyMessage(error: ErrorContext): string {
  return error.suggestion || error.message;
}

// Utility function to check if error is recoverable
export function isRecoverableError(error: ErrorContext): boolean {
  return error.retryable || error.severity === ErrorSeverity.WARNING;
}