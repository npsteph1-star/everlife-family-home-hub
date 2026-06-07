import React, { useState } from 'react';
import { useData } from '../utils/DataContext.jsx';
import { genId } from '../utils/storage.js';
import PinModal from '../components/PinModal.jsx';

const FREQS = ['once', 'daily', 'weekly'];
const STATUSES = ['all', 'pending', 'completed', 'approved'];

const blankChore = () => ({
  title: '', description: '', assignedTo: '',
  frequency: 'once',
  reward: { points: 0, money: 0, screenMinutes: 0, tokens: 0 },
});

export default function Chores() {
  const { state, setState, writeAudit, adjustBalance } = useData();
  const chores = state.chores ?? [];
  const members = (state.members ?? []).filter(m => m.role !== 'Pet');
  const [tab, setTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankChore());
  const [pinAction, setPinAction] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = tab === 'all' ? chores : chores.filter(c => c.status === tab);

  function openAdd() { setEditing(null); setForm(blankChore()); setShowForm(true); }
  function openEdit(c) { setEditing(c.id); setForm({ title: c.title, description: c.description || '', assignedTo: c.assignedTo || '', frequency: c.frequency || 'once', reward: { ...c.reward } }); setShowForm(true); }

  function save() {
    if (!form.title.trim()) return;
    if (editing) {
      setState(prev => ({ ...prev, chores: prev.chores.map(c => c.id === editing ? { ...c, ...form, title: form.title.trim() } : c) }));
      writeAudit('chore_edited', `Edited chore: ${form.title}`, 'parent');
    } else {
      const chore = { id: genId(), ...form, title: form.title.trim(), status: 'pending', createdAt: new Date().toISOString() };
      setState(prev => ({ ...prev, chores: [...prev.chores, chore] }));
      writeAudit('chore_created', `Created chore: ${form.title}`, 'parent');
    }
    setShowForm(false);
  }

  function markComplete(choreId) {
    setState(prev => ({ ...prev, chores: prev.chores.map(c => c.id === choreId ? { ...c, status: 'completed', completedAt: new Date().toISOString() } : c) }));
    writeAudit('chore_completed', 'Chore marked complete', 'member');
  }

  function approveChore(choreId) {
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;
    setState(prev => ({ ...prev, chores: prev.chores.map(c => c.id === choreId ? { ...c, status: 'approved', approvedAt: new Date().toISOString() } : c) }));
    if (chore.assignedTo) {
      const r = chore.reward ?? {};
      if (r.points) adjustBalance(chore.assignedTo, 'points', Number(r.points), `Chore: ${chore.title}`, 'parent');
      if (r.money) adjustBalance(chore.assignedTo, 'money', Number(r.money), `Chore: ${chore.title}`, 'parent');
      if (r.screenMinutes) adjustBalance(chore.assignedTo, 'screenMinutes', Number(r.screenMinutes), `Chore: ${chore.title}`, 'parent');
      if (r.tokens) adjustBalance(chore.assignedTo, 'tokens', Number(r.tokens), `Chore: ${chore.title}`, 'parent');
    }
    writeAudit('chore_approved', `Approved chore: ${chore.title}`, 'parent');
    setPinAction(null);
  }

  function denyChore(choreId) {
    setState(prev => ({ ...prev, chores: prev.chores.map(c => c.id === choreId ? { ...c, status: 'pending', completedAt: null } : c) }));
    writeAudit('chore_denied', 'Denied chore completion', 'parent');
    setPinAction(null);
  }

  function deleteChore() {
    const c = chores.find(x => x.id === confirmDelete);
    setState(prev => ({ ...prev, chores: prev.chores.filter(x => x.id !== confirmDelete) }));
    writeAudit('chore_deleted', `Deleted chore: ${c?.title}`, 'parent');
    setConfirmDelete(null);
  }

  const statusBadge = s => {
    if (s === 'approved') return <span className="badge badge-green">Approved</span>;
    if (s === 'completed') return <span className="badge badge-orange">Needs Approval</span>;
    return <span className="badge badge-gray">Pending</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">✅ Chores</h1><p className="page-subtitle">Assign, complete, and approve family chores</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Chore</button>
      </div>
      <div className="tabs">
        {STATUSES.map(s => (
          <button key={s} className={`tab-btn ${tab === s ? 'active' : ''}`} onClick={() => setTab(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && <span style={{ marginLeft: 4 }}>({chores.filter(c => c.status === s).length})</span>}
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state card">
          <div className="empty-icon">✅</div>
          <h3>{tab === 'all' ? 'No chores yet' : `No ${tab} chores`}</h3>
          <p>Click <strong>+ Add Chore</strong> to create and assign chores to family members.</p>
        </div>
      )}
      <ul className="item-list">
        {filtered.map(c => {
          const assignee = members.find(m => m.id === c.assignedTo);
          const r = c.reward ?? {};
          return (
            <li key={c.id} className="list-item" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div className="list-item-avatar">{c.status === 'approved' ? '✅' : c.status === 'completed' ? '🔄' : '⬜'}</div>
              <div className="list-item-content">
                <div className="list-item-title">{c.title}</div>
                <div className="list-item-sub">{assignee ? `👤 ${assignee.name}` : 'Unassigned'} · {c.frequency}</div>
                <div className="reward-chips" style={{ marginTop: 6 }}>
                  {statusBadge(c.status)}
                  {r.points > 0 && <span className="chip chip-gold">⭐ {r.points} pts</span>}
                  {r.money > 0 && <span className="chip chip-green">💰 ${r.money}</span>}
                  {r.screenMinutes > 0 && <span className="chip chip-blue">📺 {r.screenMinutes} min</span>}
                  {r.tokens > 0 && <span className="chip chip-purple">🪙 {r.tokens} tokens</span>}
                </div>
              </div>
              <div className="list-item-actions" style={{ flexWrap: 'wrap' }}>
                {c.status === 'pending' && <button className="btn btn-outline btn-sm" onClick={() => markComplete(c.id)}>Mark Done</button>}
                {c.status === 'completed' && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => setPinAction({ type: 'approve', choreId: c.id })}>✅ Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setPinAction({ type: 'deny', choreId: c.id })}>✗ Deny</button>
                  </>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={() => setPinAction({ type: 'delete', choreId: c.id })}>🗑️</button>
              </div>
            </li>
          );
        })}
      </ul>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editing ? '✏️ Edit Chore' : '➕ Add Chore'}</div>
            <div className="form-group"><label className="form-label">Chore Title *</label><input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Clean bedroom" autoFocus /></div>
            <div className="form-group"><label className="form-label">Description (optional)</label><textarea className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Assign To</label>
                <select className="form-control" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                  <option value="">— Unassigned —</option>{members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}</select></div>
              <div className="form-group"><label className="form-label">Frequency</label>
                <select className="form-control" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>{FREQS.map(f => <option key={f}>{f}</option>)}</select></div>
            </div>
            <div className="section-header"><span className="section-title">🏆 Reward</span></div>
            <div className="form-row">
              {[['points','⭐ Points'],['money','💰 Money ($)'],['screenMinutes','📺 Screen Min'],['tokens','🪙 Tokens']].map(([key, label]) => (
                <div key={key} className="form-group"><label className="form-label">{label}</label>
                  <input type="number" min="0" className="form-control" value={form.reward[key]} onChange={e => setForm(f => ({ ...f, reward: { ...f.reward, [key]: Number(e.target.value) } }))} /></div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.title.trim()}>{editing ? 'Save Changes' : 'Add Chore'}</button>
            </div>
          </div>
        </div>
      )}
      {pinAction && (
        <PinModal
          title={pinAction.type === 'approve' ? 'Approve Chore' : pinAction.type === 'deny' ? 'Deny Completion' : 'Delete Chore'}
          storedHash={state.security?.parentPinHash}
          onSuccess={() => {
            if (pinAction.type === 'approve') approveChore(pinAction.choreId);
            else if (pinAction.type === 'deny') denyChore(pinAction.choreId);
            else if (pinAction.type === 'delete') { setConfirmDelete(pinAction.choreId); setPinAction(null); }
          }}
          onCancel={() => setPinAction(null)}
        />
      )}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🗑️ Delete Chore?</div>
            <p>Delete <strong>{chores.find(c => c.id === confirmDelete)?.title}</strong>? This cannot be undone.</p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={deleteChore}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
