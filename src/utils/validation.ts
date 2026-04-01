/**
 * Validate an email address
 * @param email - The email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a password strength
 * @param password - The password to validate
 * @returns True if password meets minimum requirements (at least 6 characters)
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Validate that a password is strong
 * @param password - The password to validate
 * @returns Object with isValid flag and reasons for failure
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that two values match
 * @param value1 - First value
 * @param value2 - Second value
 * @returns True if values match
 */
export function doValuesMatch(value1: string, value2: string): boolean {
  return value1 === value2;
}

/**
 * Validate that a value is not empty
 * @param value - The value to check
 * @returns True if value is not empty
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validate that a number is positive
 * @param value - The number to validate
 * @returns True if number is positive
 */
export function isPositive(value: number): boolean {
  return value > 0;
}

/**
 * Validate that a number is non-negative
 * @param value - The number to validate
 * @returns True if number is zero or positive
 */
export function isNonNegative(value: number): boolean {
  return value >= 0;
}
