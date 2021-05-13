import { VariableDefinition as APIVariableDefinition, VariableDefinitions as APIVariableDefinitions } from '../../api';
import { messages } from 'stucco-ts-proto-gen';
import { getFromValue } from './value';
import { notUndefined } from '../../util/util';

const buildVariableDefinition = (vd: messages.VariableDefinition): APIVariableDefinition | undefined => ({
  defaultValue: getFromValue(vd.getDefaultvalue()),
  variable: {
    name: vd.getVariable()?.getName() || '',
  },
});

export const buildVariableDefinitions = (vds: messages.VariableDefinition[]): APIVariableDefinitions | undefined =>
  vds.length > 0 ? vds.map((vd) => buildVariableDefinition(vd)).filter(notUndefined) : undefined;
