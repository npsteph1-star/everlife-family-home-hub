/**
 * Family Home Hub – LocalStorage persistence layer
 * Structured for future Supabase migration.
 */
const STORAGE_KEY = 'family-home-hub-v2';

/** Deep-merge two objects (used to apply defaults over stored data) */
function deepMerge(defaults, stored) {
  if (typeof defaults !== 'object' || defaults === null) return stored ?? defaults;
  if (typeof stored !== 'object' || stored === null) return defaults;
  if (Array.isArray(defaults)) return Array.isArray(stored) ? stored : defaults;
  const result = { ...defaults };
  for (const key of Object.keys(stored)) {
    if (key in defaults) {
      result[key] = deepMerge(defaults[key], stored[key]);
    } else {
      result[key] = stored[key];
    }
  }
  return result;
}

export function loadState(defaultValue) {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultValue;
    return deepMerge(defaultValue, JSON.parse(stored));
  } catch (err) {
    console.warn('[FHH] Failed to load state:', err);
    return defaultValue;
  }
}

export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[FHH] Failed to save state:', err);
  }
}

export function clearState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[FHH] Failed to clear state:', err);
  }
}

export function exportData(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `family-home-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      callback(null, data);
    } catch (err) {
      callback(new Error('Invalid JSON file'), null);
    }
  };
  reader.readAsText(file);
}

/** Generate a UUID-style ID using the browser crypto API */
export function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

/** Simple PIN hash (not cryptographic – family-grade security only) */
export function hashPin(pin) {
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = Math.imul(31, h) + pin.charCodeAt(i) | 0;
  }
  return h.toString(16);
}
