import { UnionResolveTypeInput, UnionResolveTypeOutput } from '../../../lib/api';

export default (input: UnionResolveTypeInput): UnionResolveTypeOutput => {
  const tp = (input.value as Record<string, unknown> | undefined)?.__typename;
  if (typeof tp !== 'string') {
    throw new Error(`${tp} is not a valid type name`);
  }
  return tp;
};
