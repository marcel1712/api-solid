import { z } from "zod";

/**
 * The signup and reset password rules. The frontend shows the same rules
 * (frontend `src/lib/password.ts`) to guide the person typing, but anyone can
 * call the API directly — this is where they are actually enforced. Keep both
 * lists in step.
 */

export const MIN_PASSWORD_LENGTH = 10;
/** Sign-in accepts up to this too, so no password set here gets locked out. */
export const MAX_PASSWORD_LENGTH = 100;

/**
 * Passwords that meet any composition rule and are still the first ones an
 * attacker tries. Short on purpose: it catches the obvious case, it isn't a
 * breached-password check.
 */
const COMMON = [
  "senha",
  "password",
  "123456",
  "qwerty",
  "admin",
  "tailhop",
  "abcdef",
  "iloveyou",
  "adotar",
];

const stripAccents = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** `aaa`, `123`, `abc` and the like, ascending or descending. */
function hasRunOfThree(password: string): boolean {
  for (let i = 0; i + 2 < password.length; i++) {
    const a = password.charCodeAt(i);
    const b = password.charCodeAt(i + 1);
    const c = password.charCodeAt(i + 2);
    if (a === b && b === c) return true;
    if (b - a === 1 && c - b === 1) return true;
    if (a - b === 1 && b - c === 1) return true;
  }
  return false;
}

/** Why the password is refused, or `null` when it's acceptable. */
export function passwordProblem(password: string, email?: string): string | null {
  if (
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return `Password must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters long`;
  }
  if (!/\p{Ll}/u.test(password) || !/\p{Lu}/u.test(password)) {
    return "Password must mix upper and lower case letters";
  }
  if (!/\d/.test(password)) {
    return "Password must contain a number";
  }
  if (!/[^\p{L}\p{N}]/u.test(password)) {
    return "Password must contain a symbol";
  }

  const plain = stripAccents(password);
  if (COMMON.some((word) => plain.includes(word)) || hasRunOfThree(plain)) {
    return "Password is too predictable";
  }

  // "contato@patas.org" gives "contato" and "patas": the username and the
  // domain are the first things anyone tries.
  const emailParts = (email ?? "")
    .split(/[@.]/)
    .map(stripAccents)
    .filter((part) => part.length >= 4);
  if (emailParts.some((part) => plain.includes(part))) {
    return "Password must not contain the email";
  }

  return null;
}

/** For a body without an email field (reset): checks everything else. */
export const passwordSchema = z.string().superRefine((password, ctx) => {
  const problem = passwordProblem(password);
  if (problem) ctx.addIssue({ code: "custom", message: problem });
});
