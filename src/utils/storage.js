/**
 * Utility helpers for reading and writing application state to browser localStorage.
 * All application state is stored under a single key to simplify future migrations.
 */
const STORAGE_KEY = 'family-home-hub';

/**
 * Load state from localStorage. Returns parsed object or default value if nothing found.
 * @param {any} defaultValue Value returned if no state is stored.
 */
export function loadState(defaultValue) {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultValue;
    return JSON.parse(stored);
  } catch (err) {
    console.warn('Failed to load state', err);
    return defaultValue;
  }
}

/**
 * Persist state to localStorage. Errors are ignored silently.
 * @param {any} state The state object to store.
 */
export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save state', err);
  }
}
