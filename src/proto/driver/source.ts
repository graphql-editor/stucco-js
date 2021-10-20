import * as messages from './messages.js';
import { getFromValue } from './value.js';

interface WithSource {
  hasSource(): boolean;
  getSource(): messages.Value | undefined;
}

export const getSource = (req: WithSource): unknown => (req.hasSource() ? getFromValue(req.getSource()) : undefined);
