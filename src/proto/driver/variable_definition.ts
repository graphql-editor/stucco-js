import {
  VariableDefinition as APIVariableDefinition,
  VariableDefinitions as APIVariableDefinitions,
} from '../../api/index.js';
import * as messages from './messages.js';
import { getFromValue } from './value.js';
import { notUndefined } from '../../util/util.js';

const buildVariableDefinition = (vd: messages.VariableDefinition): APIVariableDefinition | undefined => ({
  defaultValue: getFromValue(vd.getDefaultvalue()),
  variable: {
    name: vd.getVariable()?.getName() || '',
  },
});

export const buildVariableDefinitions = (vds: messages.VariableDefinition[]): APIVariableDefinitions | undefined =>
  vds.length > 0 ? vds.map((vd) => buildVariableDefinition(vd)).filter(notUndefined) : undefined;
