import { OperationDefinition as APIOperationDefinition } from '../../api';
import { OperationDefinition } from '../driver_pb';
import { RecordOfValues } from './value';
import { buildDirectives } from './directive';
import { buildSelections } from './selection';
import { buildVariableDefinitions } from './variable_definition';

export function buildOperationDefinition(
  od: OperationDefinition | undefined,
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
