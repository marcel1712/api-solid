export interface Mailer {
  sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
  }): Promise<void>;
  sendVerificationEmail(params: {
    to: string;
    verifyUrl: string;
  }): Promise<void>;
}
