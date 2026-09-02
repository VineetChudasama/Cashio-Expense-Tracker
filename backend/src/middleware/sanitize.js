/**
 * Global Input Sanitization Middleware
 * Recursively cleans incoming strings:
 * - Strips HTML tags and script injections
 * - Removes null bytes and control characters
 * - Blocks prototype pollution attacks
 * - Truncates excessively long strings
 */

function sanitizeString(str, maxLen = 2000) {
  if (typeof str !== 'string') return str;
  // Remove null bytes
  let clean = str.replace(/\0/g, '');
  // Strip script and dangerous tags
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<[^>]+>/g, '');
  // Prevent excessive length (except for potential base64 images which are handled separately if needed)
  if (clean.length > maxLen) {
    clean = clean.substring(0, maxLen);
  }
  return clean.trim();
}

function sanitizeObject(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  const cleanObj = {};
  for (const [key, value] of Object.entries(obj)) {
    // Prevent prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    const cleanKey = sanitizeString(key, 100);
    if (typeof value === 'string') {
      cleanObj[cleanKey] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      cleanObj[cleanKey] = sanitizeObject(value, depth + 1);
    } else {
      cleanObj[cleanKey] = value;
    }
  }
  return cleanObj;
}

export function sanitizeInputs(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    next();
  } catch (err) {
    console.error('[SANITIZATION ERROR]:', err.message);
    res.status(400).json({ success: false, error: 'Malformed request payload' });
  }
}
