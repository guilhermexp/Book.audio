// Network Monitoring and Resilience

export enum ConnectionStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  SLOW = 'slow',
  RECONNECTING = 'reconnecting'
}

export interface NetworkQuality {
  status: ConnectionStatus;
  latency: number; // ms
  bandwidth: number; // Mbps
  lastChecked: number;
  isReliable: boolean;
}

export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private status: ConnectionStatus = ConnectionStatus.ONLINE;
  private listeners: ((status: ConnectionStatus) => void)[] = [];
  private healthCheckInterval: number | null = null;
  private healthCheckEndpoint = '/api/health';
  private lastHealthCheck = Date.now();
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 3;
  private latencyHistory: number[] = [];
  private maxHistorySize = 10;

  private constructor() {
    this.initialize();
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private initialize(): void {
    // Listen to browser online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Start health check polling
    this.startHealthCheck();

    // Check initial status
    this.checkConnection();
  }

  private handleOnline = (): void => {
    console.log('Network: Browser reports online');
    this.setStatus(ConnectionStatus.RECONNECTING);
    this.checkConnection();
  };

  private handleOffline = (): void => {
    console.log('Network: Browser reports offline');
    this.setStatus(ConnectionStatus.OFFLINE);
  };

  /**
   * Subscribe to network status changes
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(callback);

    // Immediately call with current status
    callback(this.status);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get detailed network quality metrics
   */
  async getNetworkQuality(): Promise<NetworkQuality> {
    const latency = await this.measureLatency();
    const bandwidth = await this.estimateBandwidth();

    let status = this.status;

    // Determine if connection is slow based on metrics
    if (status === ConnectionStatus.ONLINE) {
      if (latency > 1000 || bandwidth < 0.5) {
        status = ConnectionStatus.SLOW;
      }
    }

    const avgLatency = this.getAverageLatency();

    return {
      status,
      latency: avgLatency,
      bandwidth,
      lastChecked: this.lastHealthCheck,
      isReliable: this.consecutiveFailures === 0 && avgLatency < 500
    };
  }

  /**
   * Check connection by making a health check request
   */
  async checkConnection(): Promise<boolean> {
    if (!navigator.onLine) {
      this.setStatus(ConnectionStatus.OFFLINE);
      return false;
    }

    try {
      const startTime = performance.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.healthCheckEndpoint, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      const latency = performance.now() - startTime;
      this.recordLatency(latency);

      if (response.ok) {
        this.consecutiveFailures = 0;
        this.lastHealthCheck = Date.now();

        // Determine status based on latency
        if (latency > 2000) {
          this.setStatus(ConnectionStatus.SLOW);
        } else {
          this.setStatus(ConnectionStatus.ONLINE);
        }

        return true;
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      this.consecutiveFailures++;
      console.warn('Health check failed:', error);

      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        this.setStatus(ConnectionStatus.OFFLINE);
      } else {
        this.setStatus(ConnectionStatus.SLOW);
      }

      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    // Check every 30 seconds when online, every 5 seconds when issues detected
    const interval = this.status === ConnectionStatus.ONLINE ? 30000 : 5000;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = window.setInterval(() => {
      this.checkConnection();
    }, interval);
  }

  /**
   * Set connection status and notify listeners
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      const previousStatus = this.status;
      this.status = status;

      console.log(`Network status changed: ${previousStatus} → ${status}`);

      // Notify all listeners
      this.listeners.forEach(listener => {
        try {
          listener(status);
        } catch (error) {
          console.error('Error in network status listener:', error);
        }
      });

      // Adjust health check frequency based on status
      if (status === ConnectionStatus.ONLINE) {
        // Less frequent checks when stable
        this.startHealthCheck();
      } else if (status === ConnectionStatus.OFFLINE || status === ConnectionStatus.SLOW) {
        // More frequent checks when having issues
        this.startHealthCheck();
      }
    }
  }

  /**
   * Measure latency to backend
   */
  private async measureLatency(): Promise<number> {
    try {
      const startTime = performance.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(this.healthCheckEndpoint, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      return performance.now() - startTime;
    } catch {
      return 9999; // High value for failed measurement
    }
  }

  /**
   * Estimate bandwidth (simplified)
   */
  private async estimateBandwidth(): Promise<number> {
    // Use Navigation Timing API if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && 'downlink' in connection) {
        return connection.downlink; // Mbps
      }
    }

    // Fallback: estimate based on latency
    const avgLatency = this.getAverageLatency();
    if (avgLatency < 100) return 10; // Good connection
    if (avgLatency < 300) return 5;  // Medium connection
    if (avgLatency < 1000) return 1; // Poor connection
    return 0.1; // Very poor connection
  }

  /**
   * Record latency measurement
   */
  private recordLatency(latency: number): void {
    this.latencyHistory.push(latency);

    // Keep only recent measurements
    if (this.latencyHistory.length > this.maxHistorySize) {
      this.latencyHistory.shift();
    }
  }

  /**
   * Get average latency from recent measurements
   */
  private getAverageLatency(): number {
    if (this.latencyHistory.length === 0) return 0;

    const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
    return sum / this.latencyHistory.length;
  }

  /**
   * Check if we should use offline mode
   */
  shouldUseOfflineMode(): boolean {
    return this.status === ConnectionStatus.OFFLINE ||
           (this.status === ConnectionStatus.SLOW && this.consecutiveFailures > 1);
  }

  /**
   * Check if we should retry a failed request
   */
  shouldRetry(): boolean {
    return this.status !== ConnectionStatus.OFFLINE &&
           this.consecutiveFailures < this.maxConsecutiveFailures;
  }

  /**
   * Wait for connection to be restored
   */
  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    if (this.status === ConnectionStatus.ONLINE) return true;

    return new Promise((resolve) => {
      const unsubscribe = this.onStatusChange((status) => {
        if (status === ConnectionStatus.ONLINE) {
          unsubscribe();
          resolve(true);
        }
      });

      // Timeout
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.listeners = [];
  }
}

// Export singleton instance
export const networkMonitor = NetworkMonitor.getInstance();

// Utility function to format connection status for UI
export function getConnectionStatusText(status: ConnectionStatus): string {
  switch (status) {
    case ConnectionStatus.ONLINE:
      return 'Connected';
    case ConnectionStatus.OFFLINE:
      return 'Offline';
    case ConnectionStatus.SLOW:
      return 'Slow connection';
    case ConnectionStatus.RECONNECTING:
      return 'Reconnecting...';
    default:
      return 'Unknown';
  }
}

// Utility function to get connection status color
export function getConnectionStatusColor(status: ConnectionStatus): string {
  switch (status) {
    case ConnectionStatus.ONLINE:
      return 'green';
    case ConnectionStatus.OFFLINE:
      return 'red';
    case ConnectionStatus.SLOW:
      return 'yellow';
    case ConnectionStatus.RECONNECTING:
      return 'blue';
    default:
      return 'gray';
  }
}