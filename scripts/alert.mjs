#!/usr/bin/env node
/**
 * Alert Script
 * 
 * Sends alerts via Resend (email) and/or Slack webhook when services are down.
 * Prints required secrets if not configured.
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get configuration from environment
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const BACKEND_HEALTH_URL = process.env.BACKEND_HEALTH_URL || 'https://api.productifyai.com/api/health';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://productifyai.com';

/**
 * Send email alert via Resend
 */
async function sendEmailAlert(subject, message) {
  if (!RESEND_API_KEY || !ALERT_EMAIL_TO) {
    console.warn('⚠️  Email alerts not configured. Missing RESEND_API_KEY or ALERT_EMAIL_TO');
    return false;
  }

  try {
    const emails = ALERT_EMAIL_TO.split(',').map(e => e.trim());
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ProductifyAI Alerts <alerts@productifyai.com>',
        to: emails,
        subject: subject,
        html: `<h2>${subject}</h2><pre>${message}</pre><p><small>Timestamp: ${new Date().toISOString()}</small></p>`,
        text: `${subject}\n\n${message}\n\nTimestamp: ${new Date().toISOString()}`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log(`✅ Email alert sent successfully (ID: ${data.id})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email alert: ${error.message}`);
    return false;
  }
}

/**
 * Send Slack alert via webhook
 */
async function sendSlackAlert(message) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('⚠️  Slack alerts not configured. Missing SLACK_WEBHOOK_URL');
    return false;
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `🚨 ProductifyAI Alert`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚨 ProductifyAI Alert',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Timestamp: ${new Date().toISOString()}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Slack webhook error: ${response.status} ${error}`);
    }

    console.log(`✅ Slack alert sent successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send Slack alert: ${error.message}`);
    return false;
  }
}

/**
 * Print required secrets checklist
 */
function printSecretsChecklist() {
  console.log('\n📋 Required Secrets Checklist:\n');
  
  const required = [
    { name: 'BACKEND_HEALTH_URL', value: BACKEND_HEALTH_URL, optional: false },
    { name: 'FRONTEND_URL', value: FRONTEND_URL, optional: false },
    { name: 'ALERT_EMAIL_TO', value: ALERT_EMAIL_TO, optional: false },
    { name: 'RESEND_API_KEY', value: RESEND_API_KEY ? '***' : undefined, optional: false },
    { name: 'SLACK_WEBHOOK_URL', value: SLACK_WEBHOOK_URL ? '***' : undefined, optional: true },
  ];

  const optional = [
    { name: 'RENDER_API_KEY', value: process.env.RENDER_API_KEY ? '***' : undefined },
    { name: 'RENDER_SERVICE_ID', value: process.env.RENDER_SERVICE_ID ? '***' : undefined },
    { name: 'ENABLE_AUTO_RESTART', value: process.env.ENABLE_AUTO_RESTART || 'false' },
  ];

  console.log('Required:');
  for (const secret of required) {
    const status = secret.value ? '✅' : '❌';
    const optional = secret.optional ? ' (optional)' : '';
    console.log(`  ${status} ${secret.name}${optional}`);
  }

  console.log('\nOptional (Render auto-restart):');
  for (const secret of optional) {
    const status = secret.value ? '✅' : '⚪';
    console.log(`  ${status} ${secret.name}`);
  }

  console.log('\n💡 Add secrets in GitHub → Settings → Secrets and variables → Actions\n');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const incidentType = args[0] || 'health-check';
  const customMessage = args.slice(1).join(' ') || '';

  const timestamp = new Date().toISOString();
  const defaultMessage = `ProductifyAI Service Alert

Type: ${incidentType}
Timestamp: ${timestamp}
Backend URL: ${BACKEND_HEALTH_URL}
Frontend URL: ${FRONTEND_URL}

${customMessage || 'A service health check has failed. Please investigate immediately.'}`;

  console.log('📢 Sending alerts...\n');

  // Print configuration status
  printSecretsChecklist();

  // Send alerts
  let emailSent = false;
  let slackSent = false;

  if (RESEND_API_KEY && ALERT_EMAIL_TO) {
    emailSent = await sendEmailAlert(`ProductifyAI Alert: ${incidentType}`, defaultMessage);
  }

  if (SLACK_WEBHOOK_URL) {
    slackSent = await sendSlackAlert(defaultMessage);
  }

  // Summary
  console.log('\n📊 Alert Summary:');
  console.log(`  Email: ${emailSent ? '✅ Sent' : '❌ Not sent (missing config)'}`);
  console.log(`  Slack: ${slackSent ? '✅ Sent' : '❌ Not sent (missing config)'}`);

  if (!emailSent && !slackSent) {
    console.error('\n⚠️  No alerts were sent! Please configure RESEND_API_KEY + ALERT_EMAIL_TO or SLACK_WEBHOOK_URL');
    process.exit(1);
  }

  console.log('\n✅ Alerts processed successfully');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

