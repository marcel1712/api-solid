export interface Mailer {
  sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
  }): Promise<void>;
  sendVerificationEmail(params: {
    to: string;
    verifyUrl: string;
  }): Promise<void>;
  sendOrgApprovedEmail(params: {
    to: string;
    orgName: string;
    dashboardUrl: string;
  }): Promise<void>;
  sendOrgRejectedEmail(params: {
    to: string;
    orgName: string;
    reason: string;
    dashboardUrl: string;
  }): Promise<void>;
}
