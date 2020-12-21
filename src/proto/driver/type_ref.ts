import { TypeRef as APITypeRef } from '../../api';
import { TypeRef } from '../driver_pb';

export function buildTypeRef(tr: TypeRef | undefined): APITypeRef | undefined {
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
