import { version } from '../../src/stucco/version.js';

test('version set', () => {
  expect(version).toEqual(expect.stringMatching(/^v[0-9]+\.[0-9]+\.[0-9]+$/));
});
