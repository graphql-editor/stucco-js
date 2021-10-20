import { ResponsePath as APIResponsePath } from '../../api/index.js';
import * as messages from './messages.js';
import { getFromValue } from './value.js';

export const buildResponsePath = (rp: messages.ResponsePath | undefined): APIResponsePath | undefined =>
  rp && {
    key: getFromValue(rp.getKey()),
    ...(rp.getPrev() ? { prev: buildResponsePath(rp.getPrev()) } : {}),
  };
