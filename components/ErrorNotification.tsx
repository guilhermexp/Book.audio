import React, { useEffect, useState } from 'react';
import { ErrorContext, ErrorSeverity, getUserFriendlyMessage } from '../src/utils/errorHandler';

interface ErrorNotificationProps {
  error: ErrorContext | null;
  onDismiss: () => void;
  autoHideDuration?: number;
}

export default function ErrorNotification({
  error,
  onDismiss,
  autoHideDuration = 5000
}: ErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);

      // Auto-hide for non-critical errors
      if (error.severity !== ErrorSeverity.CRITICAL && autoHideDuration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300); // Wait for animation
        }, autoHideDuration);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHideDuration, onDismiss]);

  if (!error) return null;

  const getSeverityStyles = () => {
    switch (error.severity) {
      case ErrorSeverity.INFO:
        return 'bg-blue-900/90 border-blue-600 text-blue-100';
      case ErrorSeverity.WARNING:
        return 'bg-yellow-900/90 border-yellow-600 text-yellow-100';
      case ErrorSeverity.ERROR:
        return 'bg-red-900/90 border-red-600 text-red-100';
      case ErrorSeverity.CRITICAL:
        return 'bg-red-950/95 border-red-500 text-red-50 animate-pulse';
      default:
        return 'bg-neutral-800/90 border-neutral-600 text-neutral-100';
    }
  };

  const getSeverityIcon = () => {
    switch (error.severity) {
      case ErrorSeverity.INFO:
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case ErrorSeverity.WARNING:
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`
        fixed top-20 right-4 z-50 max-w-md
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          rounded-lg border shadow-2xl p-4
          backdrop-blur-sm
          ${getSeverityStyles()}
        `}
      >
        <div className="flex items-start gap-3">
          {getSeverityIcon()}

          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              {error.severity === ErrorSeverity.INFO && 'Information'}
              {error.severity === ErrorSeverity.WARNING && 'Warning'}
              {error.severity === ErrorSeverity.ERROR && 'Error'}
              {error.severity === ErrorSeverity.CRITICAL && 'Critical Error'}
            </h3>

            <p className="text-sm opacity-90">
              {getUserFriendlyMessage(error)}
            </p>

            {error.retryable && (
              <p className="text-xs opacity-75 mt-2">
                This action can be retried.
              </p>
            )}
          </div>

          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}