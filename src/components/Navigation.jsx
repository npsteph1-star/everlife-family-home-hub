import React from 'react';
import { useData } from '../utils/DataContext.jsx';

const navItems = [
  { key: 'dashboard',      label: 'Home',     icon: '🏠' },
  { key: 'family',         label: 'Family',   icon: '👨‍👩‍👧‍👦' },
  { key: 'chores',         label: 'Chores',   icon: '✅' },
  { key: 'rewards',        label: 'Rewards',  icon: '🎁' },
  { key: 'economy',        label: 'Economy',  icon: '💰' },
  { key: 'routines',       label: 'Routines', icon: '🌅' },
  { key: 'calendar',       label: 'Calendar', icon: '📅' },
  { key: 'meals',          label: 'Meals',    icon: '🍽️' },
  { key: 'education',      label: 'Learn',    icon: '📚' },
  { key: 'communication',  label: 'Talk',     icon: '💬' },
  { key: 'settings',       label: 'Settings', icon: '⚙️' },
  { key: 'audit',          label: 'Audit',    icon: '📋' },
];

export default function Navigation({ active, setActive }) {
  const { state } = useData();
  const settings = state.settings ?? {};

  return (
    <nav className="nav-bar" aria-label="Main navigation">
      {navItems
        .filter(item => {
          if (item.key === 'baby') return settings.babyModeEnabled;
          if (item.key === 'pets') return settings.petsEnabled;
          return true;
        })
        .map(({ key, label, icon }) => (
          <button
            key={key}
            className={`nav-btn ${active === key ? 'active' : ''}`}
            onClick={() => setActive(key)}
            aria-current={active === key ? 'page' : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
    </nav>
  );
}
