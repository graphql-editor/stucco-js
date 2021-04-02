export const command = 'config';
export const describe = 'Return plugin config';
export const builder = {};
export function handler(): void {
  const opts: { version?: string } = {};
  const { version = process.version } = opts;
  process.stdout.write(
    JSON.stringify([
      {
        provider: 'local',
        runtime: 'nodejs',
      },
      {
        provider: 'local',
        runtime: 'nodejs-' + version.slice(1, version.indexOf('.')),
      },
    ]),
  );
}
