import 'yargs';

declare module 'yargs' {
  interface Argv<T> {
    command<U>(module: ReadonlyArray<CommandModule<T, U>>): Argv<U>;
  }
}
