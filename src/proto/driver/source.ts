import { messages } from 'stucco-ts-proto-gen';
import { getFromValue } from './value';

interface WithSource {
  hasSource(): boolean;
  getSource(): messages.Value | undefined;
}

export const getSource = (req: WithSource): unknown => (req.hasSource() ? getFromValue(req.getSource()) : undefined);
