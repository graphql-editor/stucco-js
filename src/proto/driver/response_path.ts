import { ResponsePath as APIResponsePath } from '../../api';
import { messages } from 'stucco-ts-proto-gen';
import { getFromValue } from './value';

export const buildResponsePath = (rp: messages.ResponsePath | undefined): APIResponsePath | undefined =>
  rp && {
    key: getFromValue(rp.getKey()),
    ...(rp.getPrev() ? { prev: buildResponsePath(rp.getPrev()) } : {}),
  };
