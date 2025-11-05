#!/usr/bin/env node
/**
 * Secrets Configuration Audit
 * 
 * Checks if all required GitHub secrets are configured.
 * Run this locally or in CI to verify configuration.
 */

console.log('\n🔐 GitHub Secrets Configuration Audit\n');
console.log('═'.repeat(60));

// Required secrets
const requiredSecrets = [
  {
    name: 'BACKEND_HEALTH_URL',
    example: 'https://api.productifyai.com/api/health',
    description: 'Backend health check endpoint',
    value: process.env.BACKEND_HEALTH_URL,
  },
  {
    name: 'FRONTEND_URL',
    example: 'https://productifyai.com',
    description: 'Frontend application URL',
    value: process.env.FRONTEND_URL,
  },
  {
    name: 'ALERT_EMAIL_TO',
    example: 'admin@productifyai.com,ops@productifyai.com',
    description: 'Comma-separated email addresses for alerts',
    value: process.env.ALERT_EMAIL_TO,
  },
  {
    name: 'RESEND_API_KEY',
    example: 're_xxxxxxxxxxxxxxxxxxxxx',
    description: 'Resend API key for email alerts',
    value: process.env.RESEND_API_KEY,
  },
];

// Optional secrets
const optionalSecrets = [
  {
    name: 'SLACK_WEBHOOK_URL',
    example: 'https://hooks.slack.com/services/...',
    description: 'Slack webhook for notifications',
    value: process.env.SLACK_WEBHOOK_URL,
  },
  {
    name: 'RENDER_API_KEY',
    example: 'rnd_xxxxxxxxxxxxxxxxxxxxx',
    description: 'Render API key for auto-restart',
    value: process.env.RENDER_API_KEY,
  },
  {
    name: 'RENDER_SERVICE_ID',
    example: 'srv-xxxxxxxxxxxxxxxxxxxxx',
    description: 'Render service ID for auto-restart',
    value: process.env.RENDER_SERVICE_ID,
  },
  {
    name: 'ENABLE_AUTO_RESTART',
    example: 'true',
    description: 'Enable automatic service restart on failure',
    value: process.env.ENABLE_AUTO_RESTART,
  },
];

let missingRequired = [];
let missingOptional = [];

// Check required secrets
console.log('\n✅ REQUIRED SECRETS:\n');
for (const secret of requiredSecrets) {
  const isSet = secret.value && secret.value.trim() !== '';
  const status = isSet ? '✅' : '❌';
  console.log(`${status} ${secret.name}`);
  console.log(`   Description: ${secret.description}`);
  console.log(`   Example: ${secret.example}`);
  if (!isSet) {
    console.log(`   Status: MISSING ⚠️`);
    missingRequired.push(secret);
  } else {
    console.log(`   Status: Configured ✓`);
  }
  console.log();
}

// Check optional secrets
console.log('\n⚪ OPTIONAL SECRETS:\n');
for (const secret of optionalSecrets) {
  const isSet = secret.value && secret.value.trim() !== '';
  const status = isSet ? '✅' : '⚪';
  console.log(`${status} ${secret.name}`);
  console.log(`   Description: ${secret.description}`);
  console.log(`   Example: ${secret.example}`);
  console.log(`   Status: ${isSet ? 'Configured ✓' : 'Not set (optional)'}`);
  if (!isSet) {
    missingOptional.push(secret);
  }
  console.log();
}

console.log('═'.repeat(60));

// Summary
if (missingRequired.length === 0) {
  console.log('\n✅ ALL REQUIRED SECRETS ARE CONFIGURED!\n');
  console.log('You can proceed with deployment.\n');
  process.exit(0);
} else {
  console.log('\n❌ MISSING REQUIRED SECRETS!\n');
  console.log('⚠️  ADD THESE SECRETS FIRST ⚠️\n');
  console.log('Missing secrets:');
  for (const secret of missingRequired) {
    console.log(`  ❌ ${secret.name}`);
    console.log(`     Example: ${secret.example}`);
  }
  console.log('\n📋 How to add secrets:\n');
  console.log('1. Go to: GitHub → Settings → Secrets and variables → Actions');
  console.log('2. Click "New repository secret"');
  console.log('3. Copy the secret name EXACTLY as shown above');
  console.log('4. Paste your value');
  console.log('5. Click "Add secret"\n');
  console.log('📖 See SECRETS_CHECKLIST.md for detailed instructions\n');
  console.log('⛔ DEPLOYMENT BLOCKED - Add required secrets before pushing!\n');
  process.exit(1);
}

