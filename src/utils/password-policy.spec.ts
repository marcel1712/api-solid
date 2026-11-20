import { describe, expect, it } from "vitest";
import { passwordProblem } from "./password-policy";

describe("passwordProblem", () => {
  it("accepts a password that meets every rule", () => {
    expect(passwordProblem("Patas!Felizes7", "contato@abrigo.org")).toBeNull();
  });

  it.each([
    ["empty", ""],
    ["too short", "Ab1!"],
    ["too long", `Ab1!${"x".repeat(100)}`],
    ["no upper case", "patas!felizes7"],
    ["no lower case", "PATAS!FELIZES7"],
    ["no number", "Patas!Felizes"],
    ["no symbol", "PatasFelizes7"],
    ["a common word", "MinhaSenha!7x"],
    ["a run of three", "Patas!Fel123z"],
    ["a repeated char", "Patas!Feliiiz7"],
  ])("refuses a password that is %s", (_label, password) => {
    expect(passwordProblem(password)).not.toBeNull();
  });

  it("refuses a password built from the email", () => {
    expect(
      passwordProblem("Abrigo!Feliz7", "contato@abrigo.org"),
    ).not.toBeNull();
  });

  it("ignores accents when looking for common words", () => {
    expect(passwordProblem("Adotár!Feliz7")).not.toBeNull();
  });
});
