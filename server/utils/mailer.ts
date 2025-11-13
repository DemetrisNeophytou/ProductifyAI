/**
 * Email Notification System
 * Sends transactional emails via Resend (with console fallback)
 */

import { Logger } from './logger';

// Check if Resend is configured
const RESEND_ENABLED = !!process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'ProductifyAI <noreply@productify.ai>';
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

// Lazy load Resend only if configured
let resend: any = null;
if (RESEND_ENABLED) {
  import('resend').then(({ Resend }) => {
    resend = new Resend(process.env.RESEND_API_KEY);
    Logger.info('📧 Resend email service initialized');
  }).catch((err) => {
    Logger.warn('Failed to initialize Resend, emails will be logged to console', err);
  });
} else {
  Logger.warn('📧 RESEND_API_KEY not configured - emails will be logged to console');
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via Resend or log to console
 */
async function sendEmail(params: EmailParams): Promise<boolean> {
  const { to, subject, html, text } = params;

  // Fallback: Log to console in development
  if (!RESEND_ENABLED || !resend) {
    Logger.info(`
📧 EMAIL (Mock Mode):
To: ${to}
Subject: ${subject}
---
${text || html}
---
    `);
    return true;
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text: text || undefined,
    });

    Logger.info(`Email sent: ${subject} to ${to} (ID: ${result.id})`);
    return true;
  } catch (error: any) {
    Logger.error('Failed to send email', error);
    
    // Fallback to console log
    Logger.info(`
📧 EMAIL (Fallback):
To: ${to}
Subject: ${subject}
---
${text || html}
---
    `);
    
    return false;
  }
}

/**
 * Trial Started Email
 */
export async function sendTrialStartedEmail(email: string, userName: string, trialEndDate: Date) {
  const subject = '🎉 Your 3-Day Plus Trial Has Started!';
  
  const html = `
    <h1>Welcome to ProductifyAI Plus!</h1>
    <p>Hi ${userName},</p>
    <p>Your 3-day free trial has started. You now have full access to:</p>
    <ul>
      <li>Visual Editor & Canvas Designer</li>
      <li>AI Content Builder</li>
      <li>AI Digital Products Expert (50 queries/month)</li>
      <li>Media Library & Generation</li>
      <li>Creators Hub Community</li>
      <li>4% marketplace commission (vs 7% on Free)</li>
    </ul>
    <p><strong>Your trial ends: ${trialEndDate.toLocaleDateString()}</strong></p>
    <p>No charges until after your trial. Cancel anytime in Settings.</p>
    <p><a href="${APP_BASE_URL}/dashboard" style="background: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Go to Dashboard →</a></p>
    <p style="color: #666; font-size: 12px; margin-top: 24px;">
      ProductifyAI • Build and sell digital products<br>
      <a href="${APP_BASE_URL}/settings">Account Settings</a>
    </p>
  `;

  const text = `Welcome to ProductifyAI Plus!\n\nYour 3-day trial has started. Trial ends: ${trialEndDate.toLocaleDateString()}\n\nVisit ${APP_BASE_URL}/dashboard to get started!`;

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Trial Expiring Soon Email (24h before)
 */
export async function sendTrialExpiringEmail(email: string, userName: string) {
  const subject = '⏰ Your Plus Trial Expires Tomorrow';
  
  const html = `
    <h1>Your trial ends in 24 hours</h1>
    <p>Hi ${userName},</p>
    <p>Your ProductifyAI Plus trial will end tomorrow. To keep your access:</p>
    <ul>
      <li>Continue with Plus (€24/month)</li>
      <li>Upgrade to Pro (€49/month) for unlimited AI</li>
      <li>Or downgrade to Free (marketplace only)</li>
    </ul>
    <p><a href="${APP_BASE_URL}/pricing" style="background: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Choose Your Plan →</a></p>
    <p style="color: #666; margin-top: 24px;">No action needed to stay on Free plan.</p>
  `;

  const text = `Your ProductifyAI Plus trial ends tomorrow. Visit ${APP_BASE_URL}/pricing to continue or downgrade to Free.`;

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Trial Ended - Downgraded to Free
 */
export async function sendTrialEndedEmail(email: string, userName: string) {
  const subject = 'Your Plus Trial Has Ended';
  
  const html = `
    <h1>Trial ended - now on Free plan</h1>
    <p>Hi ${userName},</p>
    <p>Your 3-day Plus trial has ended. You're now on the Free plan:</p>
    <ul>
      <li>✅ Full marketplace access (buy & sell)</li>
      <li>✅ Community: read-only</li>
      <li>❌ Creation tools locked (Editor, AI Builder)</li>
      <li>❌ AI Expert unavailable</li>
      <li>7% marketplace commission</li>
    </ul>
    <p>Ready to unlock full features?</p>
    <p><a href="${APP_BASE_URL}/pricing" style="background: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Upgrade to Plus →</a></p>
  `;

  const text = `Your trial has ended. You're now on Free plan. Upgrade at ${APP_BASE_URL}/pricing`;

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Payment Succeeded
 */
export async function sendPaymentSucceededEmail(email: string, userName: string, plan: string, amount: number) {
  const subject = '✅ Payment Successful - Subscription Active';
  
  const html = `
    <h1>Payment received!</h1>
    <p>Hi ${userName},</p>
    <p>Your payment of €${(amount / 100).toFixed(2)} for ProductifyAI ${plan.charAt(0).toUpperCase() + plan.slice(1)} was successful.</p>
    <p>Your subscription is active and renews automatically.</p>
    <p><a href="${APP_BASE_URL}/settings/profile">View Subscription →</a></p>
  `;

  const text = `Payment successful! Your ${plan} subscription is active. Amount: €${(amount / 100).toFixed(2)}`;

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Payment Failed
 */
export async function sendPaymentFailedEmail(email: string, userName: string) {
  const subject = '❌ Payment Failed - Action Required';
  
  const html = `
    <h1>Payment unsuccessful</h1>
    <p>Hi ${userName},</p>
    <p>We couldn't process your payment. Your subscription is now past due.</p>
    <p>Please update your payment method to avoid service interruption.</p>
    <p><a href="${APP_BASE_URL}/settings/profile" style="background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Update Payment Method →</a></p>
  `;

  const text = `Payment failed. Update your payment method at ${APP_BASE_URL}/settings/profile`;

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Plan Upgraded
 */
export async function sendPlanUpgradedEmail(email: string, userName: string, newPlan: string) {
  const subject = `🎉 Upgraded to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)}!`;
  
  const html = `
    <h1>Plan upgraded successfully!</h1>
    <p>Hi ${userName},</p>
    <p>You're now on ProductifyAI ${newPlan.toUpperCase()} plan.</p>
    <p>${newPlan === 'pro' ? 'Enjoy unlimited AI access and 1% marketplace commission!' : 'Enjoy full creation tools and 4% marketplace commission!'}</p>
    <p><a href="${APP_BASE_URL}/dashboard">Start Creating →</a></p>
  `;

  const text = `Upgraded to ${newPlan}! Visit ${APP_BASE_URL}/dashboard`;

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Plan Downgraded
 */
export async function sendPlanDowngradedEmail(email: string, userName: string, newPlan: string) {
  const subject = 'Subscription Cancelled - Downgraded to Free';
  
  const html = `
    <h1>Subscription cancelled</h1>
    <p>Hi ${userName},</p>
    <p>Your subscription has been cancelled. You're now on the Free plan.</p>
    <p>You can still access the marketplace to buy and sell products.</p>
    <p>Changed your mind? <a href="${APP_BASE_URL}/pricing">Reactivate anytime →</a></p>
  `;

  const text = `Subscription cancelled. You're on Free plan. Reactivate at ${APP_BASE_URL}/pricing`;

  return sendEmail({ to: email, subject, html, text });
}

export default {
  sendTrialStartedEmail,
  sendTrialExpiringEmail,
  sendTrialEndedEmail,
  sendPaymentSucceededEmail,
  sendPaymentFailedEmail,
  sendPlanUpgradedEmail,
  sendPlanDowngradedEmail,
};



