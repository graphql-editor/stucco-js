import { Directive as APIDirective, Directives as APIDirectives } from '../../api/index.js';
import { Directive } from './messages.js';
import { RecordOfValues, getRecordFromValueMap } from './value.js';

function buildDirective(dir: Directive, variables?: RecordOfValues): APIDirective {
  const args = getRecordFromValueMap(dir.getArgumentsMap(), variables);
  return {
    ...(Object.keys(args).length > 0 && { arguments: args }),
    name: dir.getName(),
  };
}

export const buildDirectives = (dirs: Directive[], variables?: RecordOfValues): APIDirectives | undefined =>
  dirs.length > 0 ? dirs.map((dir) => buildDirective(dir, variables)) : undefined;
