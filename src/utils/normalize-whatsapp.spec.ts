import { describe, it, expect } from "vitest";
import { normalizeWhatsapp } from "./normalize-whatsapp";

describe("normalizeWhatsapp", () => {
  it("should add the +55 prefix to a bare local number", () => {
    expect(normalizeWhatsapp("11989731163")).toEqual("+5511989731163");
  });

  it("should add + to a number that already has the country code", () => {
    expect(normalizeWhatsapp("5511989731163")).toEqual("+5511989731163");
  });

  it("should strip formatting characters", () => {
    expect(normalizeWhatsapp("(11) 98973-1163")).toEqual("+5511989731163");
  });

  it("should leave an already-E.164 number untouched", () => {
    expect(normalizeWhatsapp("+5511989731163")).toEqual("+5511989731163");
  });

  it("should not touch a non-Brazilian country code", () => {
    expect(normalizeWhatsapp("+12025550123")).toEqual("+12025550123");
  });

  it("should trim surrounding whitespace", () => {
    expect(normalizeWhatsapp("  11989731163  ")).toEqual("+5511989731163");
  });
});
