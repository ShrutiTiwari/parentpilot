export const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
};

export const devError = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
};