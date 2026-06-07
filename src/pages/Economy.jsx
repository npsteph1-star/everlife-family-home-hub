import React, { useState } from 'react';
import { useData } from '../utils/DataContext.jsx';
import PinModal from '../components/PinModal.jsx';

const CURRENCIES = [
  { key: 'points', label: 'Points', icon: '⭐', color: '#856404', bg: '#fff3cd' },
  { key: 'money', label: 'Money ($)', icon: '💰', color: '#0a5c36', bg: '#d1fae5' },
  { key: 'screenMinutes', label: 'Screen Min', icon: '📺', color: '#084298', bg: '#cfe2ff' },
  { key: 'tokens', label: 'Tokens', icon: '🪙', color: '#6f2da8', bg: '#f3d9fa' },
];

export default function Economy() {
  const { state, writeAudit, adjustBalance } = useData();
  const members = (state.members ?? []).filter(m => m.role !== 'Pet');
  const balances = state.economy?.balances ?? {};
  const history = state.economy?.history ?? [];
  const [tab, setTab] = useState('balances');
  const [pinAction, setPinAction] = useState(null);
  const [pending, setPending] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ memberId: '', currency: 'points', amount: '', reason: '', isAdd: true });
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  function openAdjust(memberId, isAdd) { setAdjustForm({ memberId, currency: 'points', amount: '', reason: '', isAdd }); setShowAdjustModal(true); }

  function submitAdjust() {
    if (!adjustForm.amount || isNaN(Number(adjustForm.amount))) return;
    setPending({ memberId: adjustForm.memberId, currency: adjustForm.currency,
      amount: adjustForm.isAdd ? Math.abs(Number(adjustForm.amount)) : -Math.abs(Number(adjustForm.amount)),
      reason: adjustForm.reason || (adjustForm.isAdd ? 'Manual add' : 'Manual subtract') });
    setShowAdjustModal(false);
    setPinAction('adjust');
  }

  function confirmAdjust() {
    if (!pending) return;
    adjustBalance(pending.memberId, pending.currency, pending.amount, pending.reason, 'parent');
    writeAudit('economy_adjusted', `${pending.amount > 0 ? 'Added' : 'Subtracted'} ${Math.abs(pending.amount)} ${pending.currency} for ${members.find(m => m.id === pending.memberId)?.name} — ${pending.reason}`, 'parent');
    setPinAction(null); setPending(null);
  }

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">💰 Economy</h1><p className="page-subtitle">Family balances, allowance tracking, and history</p></div></div>
      <div className="alert alert-warning"><span>⚠️</span><span>Allowance balances are tracking tools and not financial accounts. No real transactions occur.</span></div>
      <div className="tabs">
        <button className={`tab-btn ${tab === 'balances' ? 'active' : ''}`} onClick={() => setTab('balances')}>Balances</button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
      </div>
      {tab === 'balances' && (
        <>
          {members.length === 0 && <div className="empty-state card"><div className="empty-icon">💰</div><h3>No family members</h3><p>Add family members first to track their economy balances.</p></div>}
          {members.map(m => {
            const bal = balances[m.id] ?? { points: 0, money: 0, screenMinutes: 0, tokens: 0 };
            return (
              <div key={m.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: '1.8rem' }}>{m.avatar || '👤'}</div>
                    <div><div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{m.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{m.role}</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => openAdjust(m.id, true)}>+ Add</button>
                    <button className="btn btn-danger btn-sm" onClick={() => openAdjust(m.id, false)}>− Subtract</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                  {CURRENCIES.map(c => (
                    <div key={c.key} style={{ background: c.bg, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem' }}>{c.icon}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: c.color }}>{bal[c.key] ?? 0}</div>
                      <div style={{ fontSize: '0.75rem', color: c.color, fontWeight: 600 }}>{c.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
      {tab === 'history' && (
        <>
          {history.length === 0 && <div className="empty-state card"><div className="empty-icon">📋</div><h3>No history yet</h3><p>Balance changes from chore approvals and manual adjustments will appear here.</p></div>}
          <ul className="item-list">
            {history.slice(0, 100).map(h => {
              const member = members.find(m => m.id === h.memberId);
              const cur = CURRENCIES.find(c => c.key === h.currency);
              return (
                <li key={h.id} className="list-item">
                  <div className="list-item-avatar" style={{ background: cur?.bg }}>{h.amount > 0 ? '➕' : '➖'}</div>
                  <div className="list-item-content">
                    <div className="list-item-title">{h.amount > 0 ? '+' : ''}{h.amount} {cur?.icon} {cur?.label}</div>
                    <div className="list-item-sub">{member?.name ?? 'Unknown'} · {h.reason} · {new Date(h.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>{h.amount > 0 ? <span className="badge badge-green">Added</span> : <span className="badge badge-red">Subtracted</span>}</div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {showAdjustModal && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{adjustForm.isAdd ? '➕ Add Balance' : '➖ Subtract Balance'}</div>
            <div className="form-group"><label className="form-label">Family Member</label>
              <select className="form-control" value={adjustForm.memberId} onChange={e => setAdjustForm(f => ({ ...f, memberId: e.target.value }))}>
                <option value="">— Select —</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Currency</label>
              <select className="form-control" value={adjustForm.currency} onChange={e => setAdjustForm(f => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Amount</label>
              <input type="number" min="0" className="form-control" value={adjustForm.amount} onChange={e => setAdjustForm(f => ({ ...f, amount: e.target.value }))} autoFocus /></div>
            <div className="form-group"><label className="form-label">Reason</label>
              <input className="form-control" value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Weekly allowance" /></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitAdjust} disabled={!adjustForm.amount || !adjustForm.memberId}>Continue</button>
            </div>
          </div>
        </div>
      )}
      {pinAction === 'adjust' && (
        <PinModal title="Confirm Balance Change" storedHash={state.security?.parentPinHash}
          onSuccess={confirmAdjust} onCancel={() => { setPinAction(null); setPending(null); }} />
      )}
    </div>
  );
}
