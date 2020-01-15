import { Value } from "../driver_pb";
import { getFromValue } from "./value";

interface WithSource {
  hasSource(): boolean;
  getSource(): Value;
}

export const getSource = (req: WithSource): unknown => req.hasSource() ? getFromValue(req.getSource()) : undefined;