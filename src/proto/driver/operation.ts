import { OperationDefinition as APIOperationDefinition } from '../../api/index.js';
import * as messages from './messages';
import { RecordOfValues } from './value.js';
import { buildDirectives } from './directive.js';
import { buildSelections } from './selection.js';
import { buildVariableDefinitions } from './variable_definition.js';

export function buildOperationDefinition(
  od: messages.OperationDefinition | undefined,
  variables: RecordOfValues,
): APIOperationDefinition | undefined {
  if (od) {
    const directives = buildDirectives(od.getDirectivesList(), variables);
    const selectionSet = buildSelections(od.getSelectionsetList(), variables);
    const variableDefinitions = buildVariableDefinitions(od.getVariabledefinitionsList());
    return {
      ...(directives && { directives }),
      ...(selectionSet && { selectionSet }),
      ...(variableDefinitions && { variableDefinitions }),
      name: od.getName(),
      operation: od.getOperation(),
    };
  }
  return;
}
