/**
 * List of commonly breached / easily guessable passwords to reject
 */
const COMMON_WEAK_PASSWORDS = new Set([
  'password123', 'password1234', 'password123!', 'password12345',
  '1234567890', '12345678901', 'qwertyuiop', 'qwerty12345',
  'admin12345', 'administrator', 'iloveyou123', 'welcome123!',
  'letmein123!', 'monkey12345', 'dragon12345', 'master12345',
  'flowfinance123', 'expensetracker123'
]);

/**
 * Validate password strength against strict security rules
 * @param {string} password 
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  const trimmed = password.trim();

  if (trimmed.length < 10) {
    return { isValid: false, error: 'Password must be at least 10 characters long' };
  }

  if (!/[A-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Password must contain at least 1 uppercase letter (A-Z)' };
  }

  if (!/[a-z]/.test(trimmed)) {
    return { isValid: false, error: 'Password must contain at least 1 lowercase letter (a-z)' };
  }

  if (!/[0-9]/.test(trimmed)) {
    return { isValid: false, error: 'Password must contain at least 1 number (0-9)' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`§±]/.test(trimmed)) {
    return { isValid: false, error: 'Password must contain at least 1 special character (!@#$%^&*...)' };
  }

  if (COMMON_WEAK_PASSWORDS.has(trimmed.toLowerCase())) {
    return { isValid: false, error: 'This password is too common or easily guessable. Please choose a stronger password.' };
  }

  return { isValid: true };
}
