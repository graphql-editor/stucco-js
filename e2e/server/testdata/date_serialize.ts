import { ScalarSerializeInput, ScalarSerializeOutput } from '../../../lib/api';

export default (input: ScalarSerializeInput): ScalarSerializeOutput => {
  return 'serialized date: ' + input.value;
};
