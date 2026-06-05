import React, { useState, useEffect, createContext } from 'react';
import { loadState, saveState } from './storage.js';

/**
 * A React context for global application state.
 */
export const DataContext = createContext();

// Default blank state template. This can be extended later without breaking existing data.
const defaultState = {
  members: [],
  chores: [],
  rewards: [],
  economy: {
    points: {},
    money: {},
    screenTime: {},
    tokens: {}
  },
  routines: [],
  calendar: [],
  meals: {
    planner: [],
    pantry: [],
    groceryList: []
  },
  education: [],
  communication: {
    announcements: [],
    brainDump: [],
    messages: []
  },
  settings: {
    productName: 'Family Home Hub',
    workspaceName: 'My Family',
    faithEnabled: false,
    babyMode: false,
    pregnancyMode: false,
    petsEnabled: false,
    allowanceMode: 'both', // 'real', 'points', 'both'
    aiProvider: 'none', // 'none', 'openai', 'anthropic', 'gemini'
    aiApiKey: '',
    alexaEnabled: false,
    supabaseEnabled: false,
    stripeEnabled: false
  },
  audit: []
};

export function DataProvider({ children }) {
  const [state, setState] = useState(() => loadState(defaultState));

  // Persist state whenever it changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <DataContext.Provider value={{ state, setState }}>
      {children}
    </DataContext.Provider>
  );
}
