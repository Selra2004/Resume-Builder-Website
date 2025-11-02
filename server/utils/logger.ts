interface Logger {
  info: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

const formatMessage = (level: string, message: string, ...args: any[]) => {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ') : '';
  
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${formattedArgs}`;
};

export const logger: Logger = {
  info: (message: string, ...args: any[]) => {
    console.log(formatMessage('info', message, ...args));
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(formatMessage('error', message, ...args));
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(formatMessage('warn', message, ...args));
  },
  
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, ...args));
    }
  }
};
