import {
  isListTypeRef, isNamedTypeRef, isNonNullTypeRef,
} from "../../src/api";

describe("handler assertion", () => {
  it("is named type", () => {
    expect(isNamedTypeRef({ name: "name" })).toBeTruthy();
    expect(isNamedTypeRef({ list: { name: "name" } })).toBeFalsy();
    expect(isNamedTypeRef({ nonNull: { name: "name" } })).toBeFalsy();
  });
  it("is non null type", () => {
    expect(isNonNullTypeRef({ name: "name" })).toBeFalsy();
    expect(isNonNullTypeRef({ list: { name: "name" } })).toBeFalsy();
    expect(isNonNullTypeRef({ nonNull: { name: "name" } })).toBeTruthy();
  });
  it("is list type", () => {
    expect(isListTypeRef({ name: "name" })).toBeFalsy();
    expect(isListTypeRef({ list: { name: "name" } })).toBeTruthy();
    expect(isListTypeRef({ nonNull: { name: "name" } })).toBeFalsy();
  });
});
