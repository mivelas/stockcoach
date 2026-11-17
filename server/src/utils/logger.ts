export const log = (level: 'INFO' | 'ERROR' | 'WARN', message: string, meta: any = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };
  console.log(JSON.stringify(logEntry));
};

export const info = (message: string, meta: any = {}) => log('INFO', message, meta);
export const error = (message: string, meta: any = {}) => log('ERROR', message, meta);
export const warn = (message: string, meta: any = {}) => log('WARN', message, meta);
