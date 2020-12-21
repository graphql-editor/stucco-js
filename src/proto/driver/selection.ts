import { Selections, Selection as APISelection } from '../../api';
import { RecordOfValues, getRecordFromValueMap } from './value';
import { Selection, FragmentDefinition } from '../driver_pb';
import { buildDirectives } from './directive';
import { buildTypeRef } from './type_ref';
import { notUndefined } from '../../util/util';

function buildFragmentSelection(fragment?: FragmentDefinition, variables?: RecordOfValues): APISelection | undefined {
  if (!fragment) {
    return undefined;
  }
  const directives = buildDirectives(fragment.getDirectivesList(), variables);
  return {
    definition: {
      selectionSet: buildSelections(fragment.getSelectionsetList(), variables) || [],
      typeCondition: buildTypeRef(fragment.getTypecondition()),
      ...(directives && { directives }),
    },
  };
}

function buildFieldSelection(selection: Selection, variables?: RecordOfValues): APISelection | undefined {
  const name = selection.getName();
  if (!name) {
    return;
  }
  const args = getRecordFromValueMap(selection.getArgumentsMap(), variables);
  const directives = buildDirectives(selection.getDirectivesList(), variables);
  const selectionSet = buildSelections(selection.getSelectionsetList(), variables);
  return {
    name,
    ...(Object.keys(args).length > 0 && { arguments: args }),
    ...(directives && { directives }),
    ...(selectionSet && { selectionSet }),
  };
}

function buildSelection(selection: Selection, variables?: RecordOfValues): APISelection | undefined {
  return buildFieldSelection(selection, variables) || buildFragmentSelection(selection.getDefinition(), variables);
}

export const buildSelections = (selectionSet?: Selection[], variables?: RecordOfValues): Selections | undefined =>
  Array.isArray(selectionSet) && selectionSet.length > 0
    ? selectionSet.map((sel) => buildSelection(sel, variables)).filter(notUndefined)
    : undefined;
