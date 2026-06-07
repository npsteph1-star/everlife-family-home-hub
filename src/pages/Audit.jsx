import React, { useState } from 'react';
import { useData } from '../utils/DataContext.jsx';

const ACTION_ICONS = {
  chore_approved: '✅', chore_denied: '✗', chore_created: '➕', chore_edited: '✏️',
  chore_deleted: '🗑️', chore_completed: '🔄',
  reward_approved: '🎁', reward_denied: '✗', reward_created: '➕', reward_edited: '✏️',
  reward_deleted: '🗑️', reward_requested: '📬',
  economy_adjusted: '💰', settings_changed: '⚙️', pin_changed: '🔑',
  data_exported: '📤', data_imported: '📥', data_reset: '🗑️',
  member_added: '👤', member_edited: '✏️', member_deleted: '🗑️',
  routine_created: '🌅', routine_edited: '✏️', routine_deleted: '🗑️',
  calendar_created: '📅', calendar_edited: '✏️', calendar_deleted: '🗑️',
  communication_posted: '💬',
};

const ACTION_CATEGORIES = {
  chore: ['chore_approved','chore_denied','chore_created','chore_edited','chore_deleted','chore_completed'],
  reward: ['reward_approved','reward_denied','reward_created','reward_edited','reward_deleted','reward_requested'],
  economy: ['economy_adjusted'],
  settings: ['settings_changed','pin_changed','data_exported','data_imported','data_reset'],
  members: ['member_added','member_edited','member_deleted'],
};

const CATEGORY_LABELS = { all: 'All', chore: 'Chores', reward: 'Rewards', economy: 'Economy', settings: 'Settings', members: 'Members' };

export default function Audit() {
  const { state } = useData();
  const audit = state.audit ?? [];
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = audit.filter(entry => {
    if (category !== 'all' && !ACTION_CATEGORIES[category]?.includes(entry.action)) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return entry.action.includes(s) || entry.detail?.toLowerCase().includes(s) || entry.performedBy?.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Audit Log</h1>
          <p className="page-subtitle">All approvals, changes, and system events ({audit.length} total)</p>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <input className="form-control" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search audit log..." />
        </div>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button key={key} className={`tab-btn ${category === key ? 'active' : ''}`} onClick={() => setCategory(key)}>{label}</button>
          ))}
        </div>
      </div>
      {filtered.length === 0 && (
        <div className="empty-state card">
          <div className="empty-icon">📋</div>
          <h3>{audit.length === 0 ? 'No audit entries yet' : 'No matching entries'}</h3>
          <p>{audit.length === 0 ? 'Chore approvals, reward approvals, economy changes, settings updates, and other actions will be recorded here automatically.' : 'Try adjusting your search or filter.'}</p>
        </div>
      )}
      <ul className="item-list">
        {filtered.map(entry => (
          <li key={entry.id} className="list-item">
            <div className="list-item-avatar" style={{ fontSize: '1.3rem', background: 'var(--green-pale)' }}>{ACTION_ICONS[entry.action] ?? '📝'}</div>
            <div className="list-item-content">
              <div className="list-item-title">{entry.detail}</div>
              <div className="list-item-sub">
                <span className="badge badge-gray" style={{ marginRight: 6 }}>{entry.action.replace(/_/g, ' ')}</span>
                By {entry.performedBy} · {new Date(entry.timestamp).toLocaleString()}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {filtered.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-light)', padding: '12px 0' }}>Showing {filtered.length} of {audit.length} entries</p>
      )}
    </div>
  );
}
