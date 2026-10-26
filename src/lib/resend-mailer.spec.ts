import { describe, expect, it, vi } from "vitest";
import { Resend } from "resend";
import { ResendMailer } from "./resend-mailer";

describe("Resend Mailer", () => {
  it("should throw when Resend refuses the email", async () => {
    const mailer = new ResendMailer();
    const resend = (mailer as unknown as { resend: Resend }).resend;
    vi.mocked(resend.emails.send).mockResolvedValueOnce({
      data: null,
      error: { name: "validation_error", message: "Domain not verified" },
    } as never);

    await expect(
      mailer.sendVerificationEmail({
        to: "org@email.com",
        verifyUrl: "https://tailhop.com.br/verify-email?token=abc",
      }),
    ).rejects.toThrow("Domain not verified");
  });
});
