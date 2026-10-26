import { describe, expect, it } from "vitest";
import { passwordResetEmail, verificationEmail } from "./email-templates";

const verifyUrl = "https://tailhop.com.br/verify-email?token=abc123&x=1";

describe("Email templates", () => {
  it("should write the verification email in Portuguese with the link in both versions", () => {
    const email = verificationEmail(verifyUrl);

    expect(email.subject).toEqual("Confirme seu e-mail no Tailhop");
    expect(email.html).toContain('lang="pt-BR"');
    expect(email.html).toContain(
      'href="https://tailhop.com.br/verify-email?token=abc123&amp;x=1"',
    );
    expect(email.text).toContain(verifyUrl);
    expect(email.html).not.toMatch(/FindAFriend/i);
  });

  it("should state each link's lifetime", () => {
    expect(verificationEmail(verifyUrl).text).toContain("24 horas");
    expect(passwordResetEmail(verifyUrl).text).toContain("1 hora");
  });

  it("should escape markup in the link", () => {
    const email = passwordResetEmail('https://x.com/"><script>alert(1)</script>');

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
