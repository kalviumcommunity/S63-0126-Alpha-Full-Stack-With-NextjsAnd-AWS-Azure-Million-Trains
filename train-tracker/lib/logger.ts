/**
 * Structured Logger Utility
 * Provides consistent logging across the application
 * Supports different log levels: info, warn, error, debug
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  meta?: any;
  requestId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== "production";

  /**
   * Format log entry as JSON for structured logging
   */
  private formatLog(level: LogLevel, message: string, meta?: any, requestId?: string): string {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(meta && { meta }),
      ...(requestId && { requestId })
    };
    return JSON.stringify(entry);
  }

  /**
   * Log info level messages
   */
  info(message: string, meta?: any, requestId?: string) {
    const formatted = this.formatLog("info", message, meta, requestId);
    console.log(formatted);
  }

  /**
   * Log warning level messages
   */
  warn(message: string, meta?: any, requestId?: string) {
    const formatted = this.formatLog("warn", message, meta, requestId);
    console.warn(formatted);
  }

  /**
   * Log error level messages with optional stack trace
   */
  error(message: string, meta?: any, requestId?: string) {
    const formatted = this.formatLog("error", message, meta, requestId);
    console.error(formatted);
  }

  /**
   * Log debug level messages (dev only)
   */
  debug(message: string, meta?: any, requestId?: string) {
    if (this.isDevelopment) {
      const formatted = this.formatLog("debug", message, meta, requestId);
      console.log(formatted);
    }
  }

  /**
   * Create a child logger with a request ID for tracing
   */
  child(requestId: string) {
    return {
      info: (message: string, meta?: any) => this.info(message, meta, requestId),
      warn: (message: string, meta?: any) => this.warn(message, meta, requestId),
      error: (message: string, meta?: any) => this.error(message, meta, requestId),
      debug: (message: string, meta?: any) => this.debug(message, meta, requestId)
    };
  }
}

export const logger = new Logger();
