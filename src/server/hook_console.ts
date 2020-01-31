import { Console } from 'console';
import { format } from 'util';

interface ConsoleLike {
  log: typeof Console.prototype.log;
  info: typeof Console.prototype.info;
  debug: typeof Console.prototype.debug;
  warn: typeof Console.prototype.warn;
  error: typeof Console.prototype.error;
  trace: typeof Console.prototype.trace;
}

function defaultTrace(data: unknown, constructorOpt: Function, ...optionalParams: unknown[]): string {
  const traceObj: {
    name: string;
    message?: string;
    stack?: string;
  } = {
    name: 'Trace',
    ...(typeof data !== 'undefined' && data !== '' && { message: format(data, ...optionalParams) }),
  };
  Error.captureStackTrace(traceObj, constructorOpt);
  let stack = traceObj.stack;
  if (!('message' in traceObj)) {
    // keep it identical to console.trace(), remove ': ' from 'Trace: ' when there's no message
    stack = stack.substr(0, 'Trace'.length).concat(stack.substr('Trace'.length + 2));
  }
  return stack;
}

interface Hooks {
  log?: (data: unknown, ...optionalParams: unknown[]) => string;
  info?: (data: unknown, ...optionalParams: unknown[]) => string;
  debug?: (data: unknown, ...optionalParams: unknown[]) => string;
  warn?: (data: unknown, ...optionalParams: unknown[]) => string;
  error?: (data: unknown, ...optionalParams: unknown[]) => string;
  trace?: (data: unknown, ...optionalParams: unknown[]) => string;
}

const DefaultHook: Hooks = {
  log: (data: unknown, ...optionalParams: unknown[]): string => '[INFO]' + format(data, ...optionalParams),
  info: (data: unknown, ...optionalParams: unknown[]): string => '[INFO]' + format(data, ...optionalParams),
  debug: (data: unknown, ...optionalParams: unknown[]): string => '[DEBUG]' + format(data, ...optionalParams),
  warn: (data: unknown, ...optionalParams: unknown[]): string => '[WARN]' + format(data, ...optionalParams),
  error: (data: unknown, ...optionalParams: unknown[]): string => '[ERROR]' + format(data, ...optionalParams),
  trace: (data: unknown, constructorOpt: Function, ...optionalParams: unknown[]): string =>
    '[TRACE]' + defaultTrace(data, constructorOpt, ...optionalParams),
};

type hookFunctionName = 'log' | 'info' | 'debug' | 'warn' | 'error' | 'trace';
const hookFunctions: Array<hookFunctionName> = ['log', 'info', 'debug', 'warn', 'error', 'trace'];

function isHookFunctionName(v: string): v is hookFunctionName {
  return hookFunctions.indexOf(v as hookFunctionName) !== -1;
}

export class ConsoleHook {
  private log: typeof Console.prototype.log;
  private info: typeof Console.prototype.info;
  private debug: typeof Console.prototype.debug;
  private warn: typeof Console.prototype.warn;
  private error: typeof Console.prototype.error;
  private trace: typeof Console.prototype.trace;
  private console: ConsoleLike;
  private hooked?: boolean;

  constructor(console: ConsoleLike, hooks?: Hooks) {
    hookFunctions.forEach((fn) => {
      this[fn] = console[fn];
    });
    this.console = console;
    hooks = {
      ...DefaultHook,
      ...Object.keys(hooks || {})
        .filter((k) => typeof hooks[k] === 'function')
        .reduce(
          (pv, cv) => ({
            [cv]: hooks[cv].bind(hooks),
            ...pv,
          }),
          {},
        ),
    };
    Object.keys(hooks)
      .filter((hook) => isHookFunctionName(hook) && hooks[hook])
      .forEach((hook) => {
        this.console[hook] = this.hookedCall(this[hook], hooks[hook]);
      });

    this.console.trace = (data: unknown, ...optionalParams: unknown[]): void => {
      if (this.hooked && hooks.trace) {
        data = hooks.trace(data, this.console.trace, ...optionalParams);
        optionalParams = [];
      } else {
        data = defaultTrace(data, this.console.trace, ...optionalParams);
      }
      // Write trace to error output without doing anything else.
      // This is necessary to emulate proper stack printing behaviour,
      // which prints stack from the frame it was called
      this.error.call(this.console, data);
    };
  }

  private hookedCall<FunctionType extends Function>(
    fn: FunctionType,
    hook: FunctionType,
  ): (data: unknown, ...optionalParams: unknown[]) => void {
    return (data: unknown, ...optionalParams: unknown[]): void => {
      if (this.hooked) {
        data = hook(data, ...optionalParams);
        optionalParams = [];
      }
      fn.call(this.console, data, ...optionalParams);
    };
  }

  hook(): void {
    this.hooked = true;
  }

  unhook(): void {
    this.hooked = false;
  }

  delete(): void {
    hookFunctions.forEach((fn) => {
      this.console[fn] = this[fn];
    });
  }
}
