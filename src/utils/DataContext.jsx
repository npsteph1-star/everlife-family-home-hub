import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { loadState, saveState, genId, hashPin } from './storage.js';

export const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

const DEFAULT_PIN = hashPin('1234');

const defaultState = {
  workspaceId: genId(),
  createdAt: new Date().toISOString(),
  schemaVersion: 2,
  security: {
    parentPinHash: DEFAULT_PIN,
    childPinHash: null,
    failedAttempts: 0,
  },
  members: [],
  chores: [],
  rewards: [],
  rewardRequests: [],
  economy: {
    balances: {},
    history: [],
  },
  routines: [],
  calendar: [],
  meals: {
    planner: [],
    pantry: [],
    groceryList: [],
  },
  education: {
    readingLog: [],
    goals: [],
    assignments: [],
  },
  communication: {
    announcements: [],
    brainDump: [],
    messages: [],
  },
  baby: {
    enabled: false,
    feedings: [],
    pumpSessions: [],
    sleepLogs: [],
    diapers: [],
    medications: [],
    bathLogs: [],
    appointments: [],
    diaperBag: [],
    pregnancyMode: false,
    pregnancyData: { dueDate: '', weeksAlong: '' },
  },
  pets: {
    enabled: false,
    petList: [],
    feedings: [],
    medications: [],
    vetVisits: [],
    vaccines: [],
    grooming: [],
    supplies: [],
  },
  settings: {
    productName: 'Family Home Hub',
    workspaceName: 'My Family',
    internalBranding: '',
    faithEnabled: false,
    babyModeEnabled: false,
    pregnancyModeEnabled: false,
    petsEnabled: false,
    allowanceMode: 'both',
    toddlerMode: false,
    aiProvider: 'none',
    aiApiKey: '',
    alexaEnabled: false,
    supabaseUrl: '',
    supabaseKey: '',
    stripeKey: '',
  },
  audit: [],
};

export function DataProvider({ children }) {
  const [state, setState] = useState(() => loadState(defaultState));

  useEffect(() => {
    saveState(state);
  }, [state]);

  const writeAudit = useCallback((action, detail, performedBy = 'system') => {
    setState(prev => ({
      ...prev,
      audit: [
        { id: genId(), timestamp: new Date().toISOString(), action, detail, performedBy },
        ...prev.audit,
      ].slice(0, 500),
    }));
  }, []);

  const ensureBalance = useCallback((memberId) => {
    setState(prev => {
      if (prev.economy.balances[memberId]) return prev;
      return {
        ...prev,
        economy: {
          ...prev.economy,
          balances: {
            ...prev.economy.balances,
            [memberId]: { points: 0, money: 0, screenMinutes: 0, tokens: 0 },
          },
        },
      };
    });
  }, []);

  const adjustBalance = useCallback((memberId, currency, amount, reason, approvedBy) => {
    setState(prev => {
      const current = prev.economy.balances[memberId] ?? { points: 0, money: 0, screenMinutes: 0, tokens: 0 };
      const newVal = Math.max(0, (current[currency] ?? 0) + amount);
      const entry = {
        id: genId(),
        memberId,
        type: amount >= 0 ? 'add' : 'subtract',
        currency,
        amount,
        reason,
        createdAt: new Date().toISOString(),
        approvedBy: approvedBy ?? 'system',
      };
      return {
        ...prev,
        economy: {
          balances: {
            ...prev.economy.balances,
            [memberId]: { ...current, [currency]: newVal },
          },
          history: [entry, ...prev.economy.history].slice(0, 1000),
        },
      };
    });
  }, []);

  const value = { state, setState, writeAudit, ensureBalance, adjustBalance, genId, hashPin };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
