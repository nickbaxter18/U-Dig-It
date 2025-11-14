/**
 * Password validation utilities
 * Provides password strength checking and validation rules
 */

export interface PasswordStrength {
  score: number; // 0-4 (weak to strong)
  feedback: string[];
  isValid: boolean;
  color: 'red' | 'orange' | 'yellow' | 'green';
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
}

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate password meets minimum requirements
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  // Check for common weak passwords
  const weakPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password is too common. Please choose a more unique password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check password strength with detailed feedback
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];

  if (!password) {
    return {
      score: 0,
      feedback: ['Enter a password'],
      isValid: false,
      color: 'red',
      label: 'Weak',
    };
  }

  // Length scoring
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety scoring
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
    feedback.push('✓ Has uppercase and lowercase letters');
  } else if (/[a-z]/.test(password) || /[A-Z]/.test(password)) {
    feedback.push('• Add both uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score++;
    feedback.push('✓ Has numbers');
  } else {
    feedback.push('• Add numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
    feedback.push('✓ Has special characters');
  } else {
    feedback.push('• Add special characters (!@#$%^&*)');
  }

  // Penalty for common patterns
  if (/^[a-z]+$/.test(password)) score = Math.max(0, score - 1);
  if (/^[0-9]+$/.test(password)) score = Math.max(0, score - 2);
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('• Avoid repeating characters');
  }

  // Determine label and color
  let label: PasswordStrength['label'];
  let color: PasswordStrength['color'];

  if (score <= 1) {
    label = 'Weak';
    color = 'red';
  } else if (score === 2) {
    label = 'Fair';
    color = 'orange';
  } else if (score === 3) {
    label = 'Good';
    color = 'yellow';
  } else {
    label = 'Strong';
    color = 'green';
  }

  return {
    score,
    feedback,
    isValid: score >= 2 && password.length >= 6,
    color,
    label,
  };
}

/**
 * Validate passwords match
 */
export function validatePasswordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword && password.length > 0;
}

/**
 * Sanitize password (remove invisible characters, trim)
 */
export function sanitizePassword(password: string): string {
  // Remove invisible Unicode characters but keep valid special chars
  return password
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
    .trim();
}

