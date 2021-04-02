export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}
let logLevel = LogLevel.INFO;

export function setLogLevel(lv: LogLevel): void {
  logLevel = lv;
}

function log(lv: LogLevel, fn: (...data: unknown[]) => void, ...data: unknown[]) {
  if (logLevel >= lv) {
    fn(...data);
  }
}

const cdebug = (...data: unknown[]) => console.debug(...data);
export const debug = (...data: unknown[]): void => log(LogLevel.DEBUG, cdebug, ...data);

const cinfo = (...data: unknown[]) => console.info(...data);
export const info = (...data: unknown[]): void => log(LogLevel.INFO, cinfo, ...data);

const cwarn = (...data: unknown[]) => console.warn(...data);
export const warn = (...data: unknown[]): void => log(LogLevel.WARN, cwarn, ...data);

const cerror = (...data: unknown[]) => console.error(...data);
export const error = (...data: unknown[]): void => log(LogLevel.ERROR, cerror, ...data);

export function fatal(...data: unknown[]): void {
  log(LogLevel.FATAL, cerror, ...data);
  process.exit(1);
}
