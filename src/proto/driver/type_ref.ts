import { TypeRef as APITypeRef } from '../../api/index.js';
import * as messages from './messages.js';

export function buildTypeRef(tr: messages.TypeRef | undefined): APITypeRef | undefined {
  if (!tr) {
    return;
  }
  const name = tr.getName();
  if (name) {
    return { name };
  }
  const nonNull = buildTypeRef(tr.getNonnull());
  if (nonNull) {
    return { nonNull };
  }
  const list = buildTypeRef(tr.getList());
  if (list) {
    return { list };
  }
}
