import { FieldResolveInput, FieldResolveOutput } from '../../../lib/api';

const sidekicks = [
  {
    __typename: 'Sidekick',
    name: 'Robin',
    hero: 'Batman',
  },
];

export default (input: FieldResolveInput): FieldResolveOutput => {
  const name = input.arguments?.name || (input.source as Record<string, unknown> | undefined)?.sidekick;
  if (name) {
    return sidekicks.find((v) => v.name === name);
  }
  return null;
};
