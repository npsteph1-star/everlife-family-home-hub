import React from 'react';

const navItems = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'family', label: 'Family' },
  { key: 'chores', label: 'Chores' },
  { key: 'rewards', label: 'Rewards' },
  { key: 'economy', label: 'Economy' },
  { key: 'routines', label: 'Routines' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'meals', label: 'Meals' },
  { key: 'education', label: 'Education' },
  { key: 'communication', label: 'Communication' },
  { key: 'settings', label: 'Settings' },
  { key: 'audit', label: 'Audit' }
];

export default function Navigation({ active, setActive }) {
  return (
    <nav className="nav-bar">
      {navItems.map(({ key, label }) => (
        <button
          key={key}
          className={active === key ? 'active' : ''}
          onClick={() => setActive(key)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
