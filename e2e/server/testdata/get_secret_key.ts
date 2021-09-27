import { FieldResolveOutput } from '../../../lib/api';

export default (): FieldResolveOutput => {
  return process.env.KEY;
};
