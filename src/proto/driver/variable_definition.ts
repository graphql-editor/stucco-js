import {
  VariableDefinition as APIVariableDefinition,
  VariableDefinitions as APIVariableDefinitions,
} from '../../api';
import { VariableDefinition } from "../driver_pb";
import { getFromValue } from './value';

const buildVariableDefinition = (vd: VariableDefinition): APIVariableDefinition | undefined  => ({
  defaultValue: getFromValue(vd.getDefaultvalue()),
  variable: {
    name: vd.getVariable().getName(),
  },
});

export const buildVariableDefinitions = (vds: VariableDefinition[]): APIVariableDefinitions =>
  vds.length > 0 ? vds.filter(vd => !!vd).map(vd => buildVariableDefinition(vd)) : undefined;