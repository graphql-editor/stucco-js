import { Selections, Selection as APISelection } from '../../api/index.js';
import { RecordOfValues, getRecordFromValueMap } from './value.js';
import * as messages from './messages.js';
import { buildDirectives } from './directive.js';
import { buildTypeRef } from './type_ref.js';
import { notUndefined } from '../../util/util.js';

function buildFragmentSelection(
  fragment?: messages.FragmentDefinition,
  variables?: RecordOfValues,
): APISelection | undefined {
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

function buildFieldSelection(selection: messages.Selection, variables?: RecordOfValues): APISelection | undefined {
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

function buildSelection(selection: messages.Selection, variables?: RecordOfValues): APISelection | undefined {
  return buildFieldSelection(selection, variables) || buildFragmentSelection(selection.getDefinition(), variables);
}

export const buildSelections = (
  selectionSet?: messages.Selection[],
  variables?: RecordOfValues,
): Selections | undefined =>
  Array.isArray(selectionSet) && selectionSet.length > 0
    ? selectionSet.map((sel) => buildSelection(sel, variables)).filter(notUndefined)
    : undefined;
