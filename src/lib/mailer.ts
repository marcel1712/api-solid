export interface Mailer {
  sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
  }): Promise<void>;
}
