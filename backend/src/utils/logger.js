const isDevelopment = process.env.NODE_ENV !== 'production';

const devLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

const devWarn = (...args) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

const devError = (...args) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

const prodLog = (...args) => {
  console.log(...args);
};

const prodWarn = (...args) => {
  console.warn(...args);
};

const prodError = (...args) => {
  console.error(...args);
};

module.exports = {
  devLog,
  devWarn,
  devError,
  prodLog,
  prodWarn,
  prodError,
  isDevelopment
};