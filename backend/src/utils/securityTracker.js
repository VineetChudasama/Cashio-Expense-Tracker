/**
 * In-memory Security Tracker
 * Handles:
 * 1. Password login failure tracking & 10-minute lockouts (3 attempts)
 * 2. OTP verification failure tracking & 10-minute lockouts (3 attempts)
 * 3. IP-based request rate limiting
 */

const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;

// Password tracking map: normalizedEmail -> { attempts, lockedUntil }
const passwordAttempts = new Map();

// OTP tracking map: `${normalizedEmail}::${type}` -> { attempts, lockedUntil }
const otpAttempts = new Map();

// IP rate limit map: `${ip}::${endpointPrefix}` -> [timestamps]
const ipRateLimits = new Map();

// Clean up entries older than 30 minutes periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of passwordAttempts.entries()) {
    if (val.lockedUntil && now > val.lockedUntil + 10 * 60 * 1000) {
      passwordAttempts.delete(key);
    }
  }
  for (const [key, val] of otpAttempts.entries()) {
    if (val.lockedUntil && now > val.lockedUntil + 10 * 60 * 1000) {
      otpAttempts.delete(key);
    }
  }
  for (const [key, timestamps] of ipRateLimits.entries()) {
    const valid = timestamps.filter(t => now - t < 60000);
    if (valid.length === 0) {
      ipRateLimits.delete(key);
    } else {
      ipRateLimits.set(key, valid);
    }
  }
}, 5 * 60 * 1000);

export function checkPasswordLockout(email) {
  if (!email) return { isLocked: false, remainingSeconds: 0, remainingMinutes: 0 };
  const key = email.toLowerCase().trim();
  const record = passwordAttempts.get(key);

  if (!record) return { isLocked: false, remainingSeconds: 0, remainingMinutes: 0 };

  const now = Date.now();
  if (record.lockedUntil) {
    if (now < record.lockedUntil) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return { isLocked: true, remainingSeconds, remainingMinutes };
    } else {
      passwordAttempts.delete(key);
      return { isLocked: false, remainingSeconds: 0, remainingMinutes: 0 };
    }
  }

  return { isLocked: false, remainingSeconds: 0, remainingMinutes: 0 };
}

export function recordFailedPasswordAttempt(email) {
  if (!email) return { locked: false, remainingAttempts: MAX_ATTEMPTS, attempts: 1 };
  const key = email.toLowerCase().trim();
  const record = passwordAttempts.get(key) || { attempts: 0, lockedUntil: null };

  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    passwordAttempts.set(key, record);
    return {
      locked: true,
      remainingAttempts: 0,
      attempts: record.attempts,
      lockoutMinutes: 10
    };
  }

  passwordAttempts.set(key, record);
  return {
    locked: false,
    remainingAttempts: MAX_ATTEMPTS - record.attempts,
    attempts: record.attempts
  };
}

export function resetPasswordAttempts(email) {
  if (!email) return;
  const key = email.toLowerCase().trim();
  passwordAttempts.delete(key);
}

export function checkOtpLockout(email, type = 'GENERAL') {
  if (!email) return { isLocked: false, remainingSeconds: 0, remainingMinutes: 0 };
  const key = `${email.toLowerCase().trim()}::${type}`;
  const record = otpAttempts.get(key);

  if (!record) return { isLocked: false, remainingSeconds: 0, remainingMinutes: 0 };

  const now = Date.now();
  if (record.lockedUntil) {
    if (now < record.lockedUntil) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return { isLocked: true, remainingSeconds, remainingMinutes };
    } else {
      otpAttempts.delete(key);
      return { isLocked: false, remainingSeconds: 0, remainingMinutes: 0 };
    }
  }

  return { isLocked: false, remainingSeconds: 0, remainingMinutes: 0 };
}

export function recordFailedOtpAttempt(email, type = 'GENERAL') {
  if (!email) return { locked: false, remainingAttempts: MAX_ATTEMPTS, attempts: 1 };
  const key = `${email.toLowerCase().trim()}::${type}`;
  const record = otpAttempts.get(key) || { attempts: 0, lockedUntil: null };

  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    otpAttempts.set(key, record);
    return {
      locked: true,
      remainingAttempts: 0,
      attempts: record.attempts,
      lockoutMinutes: 10
    };
  }

  otpAttempts.set(key, record);
  return {
    locked: false,
    remainingAttempts: MAX_ATTEMPTS - record.attempts,
    attempts: record.attempts
  };
}

export function resetOtpAttempts(email, type = 'GENERAL') {
  if (!email) return;
  const key = `${email.toLowerCase().trim()}::${type}`;
  otpAttempts.delete(key);
}

export function ipRateLimiter({ maxRequests = 15, windowMs = 60000, message = 'Too many requests. Please try again shortly.' } = {}) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const route = req.baseUrl || req.path || '';
    const key = `${ip}::${route}`;
    const now = Date.now();

    let timestamps = ipRateLimits.get(key) || [];
    timestamps = timestamps.filter(t => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: Math.ceil(windowMs / 1000)
      });
    }

    timestamps.push(now);
    ipRateLimits.set(key, timestamps);
    next();
  };
}
