// Environment-aware structured logging
// In production, only errors and warnings are logged

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, any>;
}

const IS_PROD = process.env.EXPO_PUBLIC_APP_ENV === 'production';
const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

// In production, only show warn and above
const MIN_LOG_LEVEL: LogLevel = IS_PROD ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

function createEntry(level: LogLevel, module: string, message: string, data?: Record<string, any>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    data,
  };
}

function log(level: LogLevel, module: string, message: string, data?: Record<string, any>) {
  if (!shouldLog(level)) return;

  const entry = createEntry(level, module, message, data);

  switch (level) {
    case 'error':
      console.error(`[${module}] ${message}`, data || '');
      break;
    case 'warn':
      console.warn(`[${module}] ${message}`, data || '');
      break;
    case 'info':
      console.log(`[${module}] ${message}`, data || '');
      break;
    case 'debug':
      if (!IS_PROD) console.log(`[${module}] ${message}`, data || '');
      break;
  }
}

export const logger = {
  debug: (module: string, message: string, data?: Record<string, any>) => log('debug', module, message, data),
  info: (module: string, message: string, data?: Record<string, any>) => log('info', module, message, data),
  warn: (module: string, message: string, data?: Record<string, any>) => log('warn', module, message, data),
  error: (module: string, message: string, data?: Record<string, any>) => log('error', module, message, data),

  // Suppress console.log in production by overriding it
  init: () => {
    if (IS_PROD) {
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        // Only allow structured logs (with module prefix) through
        const msg = args[0] || '';
        if (typeof msg === 'string' && msg.startsWith('[') && msg.includes(']')) {
          originalLog(...args);
        }
        // Suppress random console.log calls in production
      };
    }
  },
};
