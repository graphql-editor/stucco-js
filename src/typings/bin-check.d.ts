declare module 'bin-check' {
  function binCheck(path: string): Promise<unknown>;
  export = binCheck;
}
