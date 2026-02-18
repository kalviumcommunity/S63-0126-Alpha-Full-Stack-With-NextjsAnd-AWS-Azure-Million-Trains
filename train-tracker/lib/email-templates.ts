export const welcomeTemplate = (userName: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Welcome to Million Trains, ${userName}!</h2>
      <p>We are glad you are here. Your account is ready to go.</p>
      <p>Start exploring your dashboard to track trains and manage your trips.</p>
      <hr />
      <p style="font-size: 12px; color: #666;">This is an automated email. Please do not reply.</p>
    </div>
  `;
};

export const passwordResetTemplate = (resetUrl: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to reset it:</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <hr />
      <p style="font-size: 12px; color: #666;">This is an automated email. Please do not reply.</p>
    </div>
  `;
};

export const securityAlertTemplate = (details: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Security Alert</h2>
      <p>We detected a new security-related event on your account:</p>
      <p><strong>${details}</strong></p>
      <p>If this was not you, please contact support immediately.</p>
      <hr />
      <p style="font-size: 12px; color: #666;">This is an automated email. Please do not reply.</p>
    </div>
  `;
};
