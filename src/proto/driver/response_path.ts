import {ResponsePath as APIResponsePath} from '../../api';
import { ResponsePath } from "../driver_pb";
import { getFromValue } from './value';

export const buildResponsePath = (rp: ResponsePath | undefined): APIResponsePath | undefined => rp && {
  key: getFromValue(rp.getKey()),
  ...(rp.getPrev() ? {prev: buildResponsePath(rp.getPrev())} : {}),
};
