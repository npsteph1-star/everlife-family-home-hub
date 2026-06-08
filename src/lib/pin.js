/**
 * Family Home Hub — Parent PIN utilities
 *
 * Family-grade security: prevents casual snooping by children.
 * NOT cryptographic — do not use for financial or medical data.
 *
 * The PIN hash is stored in the `households.pin_hash` column in
 * Supabase (server-side) and also mirrored in localStorage for
 * offline use. The hash is deterministic but not bcrypt — it is
 * intended as a simple lock, not a cryptographic secret.
 */

/**
 * Deterministic hash of a 4-6 digit PIN.
 * Returns an 8-character hex string.
 */
export function hashPin(pin) {
  let h = 0
  for (let i = 0; i < pin.length; i++) {
    h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0
  }
  return h.toString(16).padStart(8, '0')
}

/**
 * Compare a plain PIN against a stored hash.
 */
export function verifyPin(pin, storedHash) {
  return hashPin(pin) === storedHash
}

/** Hash of the default PIN "1234" — used when no custom PIN is set */
export const DEFAULT_PIN_HASH = hashPin('1234')
