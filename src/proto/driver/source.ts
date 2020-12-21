import { Value } from '../driver_pb';
import { getFromValue } from './value';

interface WithSource {
  hasSource(): boolean;
  getSource(): Value | undefined;
}

export const getSource = (req: WithSource): unknown => (req.hasSource() ? getFromValue(req.getSource()) : undefined);
