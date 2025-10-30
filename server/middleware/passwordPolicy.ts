/**
 * Password Policy Middleware
 * Implements strong password validation and leaked password prevention
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Password strength requirements
 */
const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
};

/**
 * Common weak passwords list (subset - expand in production)
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', 'qwerty',
  'abc123', '111111', 'password1', '12345', 'iloveyou',
  'admin', 'welcome', 'monkey', 'login', 'starwars',
  'dragon', 'master', 'hello', 'freedom', 'whatever',
  'trustno1', '000000', 'password!', 'password@', 'letmein',
]);

/**
 * Check if password meets strength requirements
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password || password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
  }

  if (password && password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_POLICY.maxLength} characters`);
  }

  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  if (PASSWORD_POLICY.preventCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password');
  }

  // Check for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    errors.push('Password should not contain sequential letters');
  }

  if (/(?:012|123|234|345|456|567|678|789)/.test(password)) {
    errors.push('Password should not contain sequential numbers');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if password has been leaked using Have I Been Pwned API
 * Uses k-anonymity model - only sends first 5 chars of SHA-1 hash
 */
export async function checkPasswordLeak(password: string): Promise<{
  leaked: boolean;
  count?: number;
}> {
  try {
    // Generate SHA-1 hash of password
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    // Query HIBP API with first 5 chars only (k-anonymity)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'ProductifyAI-PasswordCheck',
      },
      // 3 second timeout
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      // If API fails, allow password but log warning
      console.warn('Password leak check failed, allowing password');
      return { leaked: false };
    }

    const text = await response.text();
    const hashes = text.split('\n');

    // Check if our hash suffix appears in results
    for (const line of hashes) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return {
          leaked: true,
          count: parseInt(count, 10),
        };
      }
    }

    return { leaked: false };
  } catch (error) {
    // If check fails (network error, timeout), allow password
    console.error('Error checking password leak:', error);
    return { leaked: false };
  }
}

/**
 * Middleware to validate password strength
 */
export async function validatePassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      error: 'Password is required',
    });
  }

  // Check password strength
  const strengthCheck = validatePasswordStrength(password);
  if (!strengthCheck.valid) {
    return res.status(400).json({
      success: false,
      error: 'Password does not meet security requirements',
      details: strengthCheck.errors,
    });
  }

  // Check for leaked passwords (optional, doesn't block if API fails)
  try {
    const leakCheck = await checkPasswordLeak(password);
    if (leakCheck.leaked) {
      return res.status(400).json({
        success: false,
        error: 'This password has been exposed in a data breach and cannot be used. Please choose a different password.',
        breachCount: leakCheck.count,
      });
    }
  } catch (error) {
    // Continue even if leak check fails
    console.warn('Password leak check failed, continuing:', error);
  }

  // Password is valid
  next();
}

/**
 * Get password policy for client-side display
 */
export function getPasswordPolicy() {
  return {
    minLength: PASSWORD_POLICY.minLength,
    maxLength: PASSWORD_POLICY.maxLength,
    requireUppercase: PASSWORD_POLICY.requireUppercase,
    requireLowercase: PASSWORD_POLICY.requireLowercase,
    requireNumbers: PASSWORD_POLICY.requireNumbers,
    requireSpecialChars: PASSWORD_POLICY.requireSpecialChars,
    preventCommonPasswords: PASSWORD_POLICY.preventCommonPasswords,
  };
}

