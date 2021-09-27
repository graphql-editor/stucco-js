import { FieldResolveInput, FieldResolveOutput } from '../../../lib/api';

const heroes = [
  {
    __typename: 'Hero',
    name: 'Batman',
    sidekick: 'Robin',
  },
];

export default (input: FieldResolveInput): FieldResolveOutput => {
  const name = input.arguments?.name || (input.source as Record<string, unknown> | undefined)?.hero;
  if (name) {
    return heroes.find((v) => v.name === name);
  }
  return null;
};
