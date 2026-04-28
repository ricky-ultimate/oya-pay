export const logger = (...msg: unknown[]): void => {
  console.log("[LOG]   ", ...msg);
};

export default logger;
