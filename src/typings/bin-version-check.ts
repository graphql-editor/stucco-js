declare module 'bin-version-check' {
  function binVersionCheck(path: string, version: string, options: { args: string[] }): Promise<unknown>;
  export = binVersionCheck;
}
