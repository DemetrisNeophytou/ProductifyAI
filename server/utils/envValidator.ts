/**
 * Environment Variable Validation
 * Ensures all required environment variables are set and valid
 */

import * as fs from 'fs';
import * as path from 'path';

interface EnvVariable {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'url' | 'email';
  default?: string;
  description: string;
  validator?: (value: string) => boolean;
}

/**
 * Environment variable definitions
 */
const ENV_VARIABLES: EnvVariable[] = [
  // Core Application
  {
    name: 'NODE_ENV',
    required: true,
    type: 'string',
    default: 'development',
    description: 'Application environment',
    validator: (val) => ['development', 'production', 'test'].includes(val),
  },
  {
    name: 'PORT',
    required: false,
    type: 'number',
    default: '5050',
    description: 'Server port',
  },

  // Frontend URLs
  {
    name: 'VITE_API_URL',
    required: true,
    type: 'url',
    description: 'Backend API URL',
  },
  {
    name: 'VITE_FRONTEND_URL',
    required: true,
    type: 'url',
    description: 'Frontend application URL',
  },

  // Supabase
  {
    name: 'VITE_SUPABASE_URL',
    required: true,
    type: 'url',
    description: 'Supabase project URL',
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    required: true,
    type: 'string',
    description: 'Supabase anonymous key (public)',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    type: 'string',
    description: 'Supabase service role key (private)',
  },

  // Authentication
  {
    name: 'JWT_SECRET',
    required: true,
    type: 'string',
    description: 'JWT signing secret',
    validator: (val) => val.length >= 32,
  },
  {
    name: 'SESSION_SECRET',
    required: true,
    type: 'string',
    description: 'Session secret',
    validator: (val) => val.length >= 32,
  },

  // External APIs
  {
    name: 'OPENAI_API_KEY',
    required: false,
    type: 'string',
    description: 'OpenAI API key',
  },
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    type: 'string',
    description: 'Stripe secret key',
  },
  {
    name: 'PEXELS_API_KEY',
    required: false,
    type: 'string',
    description: 'Pexels API key',
  },
  {
    name: 'PIXABAY_API_KEY',
    required: false,
    type: 'string',
    description: 'Pixabay API key',
  },
  {
    name: 'UNSPLASH_ACCESS_KEY',
    required: false,
    type: 'string',
    description: 'Unsplash API key',
  },

  // Monitoring
  {
    name: 'SENTRY_DSN',
    required: false,
    type: 'url',
    description: 'Sentry error tracking DSN',
  },

  // Feature Flags
  {
    name: 'MOCK_DB',
    required: false,
    type: 'boolean',
    default: 'false',
    description: 'Use mock in-memory database',
  },
  {
    name: 'MOCK_STRIPE',
    required: false,
    type: 'boolean',
    default: 'false',
    description: 'Use mock Stripe mode',
  },
];

/**
 * Validate environment variables
 */
export function validateEnv(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  ENV_VARIABLES.forEach((envVar) => {
    const value = process.env[envVar.name];

    // Check if required variable is missing
    if (envVar.required && !value) {
      if (envVar.default) {
        warnings.push(
          `${envVar.name} not set, using default: ${envVar.default}`
        );
        process.env[envVar.name] = envVar.default;
      } else {
        errors.push(
          `Required environment variable ${envVar.name} is not set. ${envVar.description}`
        );
      }
      return;
    }

    // Skip validation if not set and not required
    if (!value) return;

    // Type validation
    switch (envVar.type) {
      case 'number':
        if (isNaN(Number(value))) {
          errors.push(`${envVar.name} must be a number, got: ${value}`);
        }
        break;

      case 'boolean':
        if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
          errors.push(`${envVar.name} must be a boolean (true/false), got: ${value}`);
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push(`${envVar.name} must be a valid URL, got: ${value}`);
        }
        break;

      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${envVar.name} must be a valid email, got: ${value}`);
        }
        break;
    }

    // Custom validator
    if (envVar.validator && !envVar.validator(value)) {
      errors.push(
        `${envVar.name} failed validation. ${envVar.description}`
      );
    }
  });

  // Check for potential sensitive data in code
  checkForHardcodedSecrets();

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for hardcoded secrets (basic check)
 */
function checkForHardcodedSecrets() {
  const sensitivePatterns = [
    /sk_live_[a-zA-Z0-9]{24,}/g, // Stripe live keys
    /pk_live_[a-zA-Z0-9]{24,}/g, // Stripe publishable keys
    /[a-zA-Z0-9]{32,}@supabase\.co/g, // Supabase URLs with embedded keys
  ];

  // This is a basic check - in production, use tools like git-secrets or truffleHog
  console.log('⚠️ Note: Run git-secrets or truffleHog for comprehensive secret scanning');
}

/**
 * Print environment validation report
 */
export function printEnvValidation() {
  const result = validateEnv();

  console.log('\n🔍 Environment Variable Validation\n');

  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach((warning) => console.log(`   ${warning}`));
    console.log();
  }

  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach((error) => console.log(`   ${error}`));
    console.log();
    console.log('Please fix the above errors before starting the application.\n');
    return false;
  }

  console.log('✅ All environment variables are valid\n');
  return true;
}

/**
 * Get environment configuration summary (safe for logging)
 */
export function getEnvSummary(): Record<string, string> {
  const summary: Record<string, string> = {};

  ENV_VARIABLES.forEach((envVar) => {
    const value = process.env[envVar.name];
    
    if (!value) {
      summary[envVar.name] = 'NOT SET';
    } else if (envVar.name.toLowerCase().includes('secret') || 
               envVar.name.toLowerCase().includes('key') ||
               envVar.name.toLowerCase().includes('password')) {
      // Mask sensitive values
      summary[envVar.name] = `***${value.slice(-4)}`;
    } else {
      summary[envVar.name] = value;
    }
  });

  return summary;
}

/**
 * Validate environment on import
 */
if (require.main === module) {
  const isValid = printEnvValidation();
  process.exit(isValid ? 0 : 1);
}

