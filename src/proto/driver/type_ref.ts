import {TypeRef as APITypeRef} from '../../api'
import { TypeRef } from "../driver_pb";

export function buildTypeRef(tr: TypeRef | undefined): APITypeRef | undefined {
  if (!tr) {
    return;
  }
  const name = tr.getName();
  const nonNull = buildTypeRef(tr.getNonnull());
  const list = buildTypeRef(tr.getList());
  return {
    ...(!!name && {name}),
    ...(nonNull && {nonNull}),
    ...(list && {list}),
  }
}
