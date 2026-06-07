import React from 'react';
import { useData } from '../utils/DataContext.jsx';

const ROLE_EMOJI = { Mom: '👩', Dad: '👨', Child: '🧒', Toddler: '👶', Pet: '🐾' };

export default function Dashboard({ setActive }) {
  const { state } = useData();
  const today = new Date().toISOString().split('T')[0];

  const pendingChores = (state.chores ?? []).filter(c => c.status === 'pending' || c.status === 'completed');
  const pendingApprovals = (state.chores ?? []).filter(c => c.status === 'completed');
  const todayEvents = (state.calendar ?? []).filter(e => e.date === today);
  const pendingRewards = (state.rewardRequests ?? []).filter(r => r.status === 'pending');

  const stats = [
    { icon: '👨‍👩‍👧‍👦', value: state.members.length, label: 'Family Members', page: 'family' },
    { icon: '✅', value: pendingChores.length, label: 'Active Chores', page: 'chores' },
    { icon: '🎁', value: pendingRewards.length, label: 'Reward Requests', page: 'rewards' },
    { icon: '📅', value: todayEvents.length, label: "Today's Events", page: 'calendar' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{state.settings?.productName ?? 'Family Home Hub'}</h1>
          <p className="page-subtitle">
            {state.settings?.workspaceName ?? 'My Family'} ·{' '}
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="card-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card" onClick={() => setActive && setActive(s.page)}
            role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setActive && setActive(s.page)}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {pendingApprovals.length > 0 && (
        <div className="alert alert-warning">
          <span>⚠️</span>
          <span><strong>{pendingApprovals.length} chore{pendingApprovals.length > 1 ? 's' : ''}</strong> waiting for parent approval.</span>
        </div>
      )}
      {pendingRewards.length > 0 && (
        <div className="alert alert-info">
          <span>🎁</span>
          <span><strong>{pendingRewards.length} reward request{pendingRewards.length > 1 ? 's' : ''}</strong> waiting for approval.</span>
        </div>
      )}

      <div className="card">
        <div className="section-header"><span className="section-title">👨‍👩‍👧‍👦 Family Members</span></div>
        {state.members.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👨‍👩‍👧‍👦</div>
            <h3>No family members yet</h3>
            <p>Add family members to get started with chores, rewards, and more.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {state.members.map(m => {
              const bal = state.economy?.balances?.[m.id] ?? {};
              return (
                <div key={m.id} style={{ background: 'var(--green-pale)', borderRadius: 12, padding: '14px 18px',
                  minWidth: 140, border: '1px solid var(--green-light)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem' }}>{m.avatar || ROLE_EMOJI[m.role] || '👤'}</div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>{m.name}</div>
                  <div style={{ marginTop: 4 }}><span className="badge badge-green">{m.role}</span></div>
                  {m.role !== 'Pet' && m.role !== 'Toddler' && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 6 }}>
                      ⭐ {bal.points ?? 0} pts   💰 ${bal.money ?? 0}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-header"><span className="section-title">✅ Today's Chores</span></div>
        {pendingChores.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <div className="empty-icon">🎉</div>
            <h3>All caught up!</h3>
            <p>No pending chores right now.</p>
          </div>
        ) : (
          <ul className="item-list">
            {pendingChores.slice(0, 5).map(c => {
              const assignee = state.members.find(m => m.id === c.assignedTo);
              return (
                <li key={c.id} className="list-item">
                  <div className="list-item-avatar">{c.status === 'completed' ? '✅' : '⬜'}</div>
                  <div className="list-item-content">
                    <div className="list-item-title">{c.title}</div>
                    <div className="list-item-sub">
                      {assignee ? assignee.name : 'Unassigned'}  
                      {c.status === 'completed' && <span className="badge badge-orange">Needs Approval</span>}
                      {c.status === 'pending' && <span className="badge badge-gray">Pending</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card">
        <div className="section-header"><span className="section-title">📅 Today's Events</span></div>
        {todayEvents.length === 0 ? (
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Nothing scheduled for today.</p>
        ) : (
          <ul className="item-list">
            {todayEvents.map(ev => (
              <li key={ev.id} className="list-item">
                <div className="list-item-avatar">
                  {ev.type === 'appointment' ? '🏥' : ev.type === 'reminder' ? '🔔' : '📅'}
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{ev.title}</div>
                  <div className="list-item-sub">{ev.time || 'All day'} · {ev.type}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
