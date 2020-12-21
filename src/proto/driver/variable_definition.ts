import { VariableDefinition as APIVariableDefinition, VariableDefinitions as APIVariableDefinitions } from '../../api';
import { VariableDefinition } from '../driver_pb';
import { getFromValue } from './value';
import { notUndefined } from '../../util/util';

const buildVariableDefinition = (vd: VariableDefinition): APIVariableDefinition | undefined => ({
  defaultValue: getFromValue(vd.getDefaultvalue()),
  variable: {
    name: vd.getVariable()?.getName() || '',
  },
});

export const buildVariableDefinitions = (vds: VariableDefinition[]): APIVariableDefinitions | undefined =>
  vds.length > 0 ? vds.map((vd) => buildVariableDefinition(vd)).filter(notUndefined) : undefined;
