/**
 * PIN utilities — server-safe only
 * Do NOT import in client components.
 */

// Simple deterministic hash for family-grade PIN (stored server-side in DB, never in localStorage)
export function hashPin(pin: string): string {
  let h = 0
  for (let i = 0; i < pin.length; i++) {
    h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0
  }
  return h.toString(16).padStart(8, '0')
}

export function verifyPin(pin: string, hash: string): boolean {
  return hashPin(pin) === hash
}
