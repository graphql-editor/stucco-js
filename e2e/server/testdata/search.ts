import { FieldResolveInput, FieldResolveOutput } from '../../../lib/api';

const search = [
  {
    __typename: 'Hero',
    name: 'Batman',
    sidekick: 'Robin',
  },
  {
    __typename: 'Sidekick',
    name: 'Robin',
    hero: 'Batman',
  },
  {
    __typename: 'Vilian',
    name: 'Joker',
  },
];

export default (input: FieldResolveInput): FieldResolveOutput => {
  const name = input.arguments?.name;
  if (name) {
    return search.find((v) => v.name === name);
  }
  return null;
};
