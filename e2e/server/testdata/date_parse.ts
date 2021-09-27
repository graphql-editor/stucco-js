import { ScalarParseInput, ScalarParseOutput } from '../../../lib/api';

export default (input: ScalarParseInput): ScalarParseOutput => {
  return 'parsed date: ' + input.value;
};
