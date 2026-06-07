import React, { useState } from 'react';
import { useData } from '../utils/DataContext.jsx';
import { genId } from '../utils/storage.js';

const ROLES = ['Mom', 'Dad', 'Child', 'Toddler', 'Pet'];
const ROLE_EMOJI = { Mom: '👩', Dad: '👨', Child: '🧒', Toddler: '👶', Pet: '🐾' };
const AVATARS = ['👩','👨','🧒','👶','👧','👦','👴','👵','🐶','🐱','🐰','🐹','🦜','🐠','🐢','🦎'];

const blank = () => ({ name: '', role: 'Child', avatar: '🧒' });

export default function Family() {
  const { state, setState, writeAudit, ensureBalance } = useData();
  const members = state.members ?? [];
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank());
  const [confirmDelete, setConfirmDelete] = useState(null);

  function openAdd() { setEditing(null); setForm(blank()); setShowForm(true); }
  function openEdit(m) { setEditing(m.id); setForm({ name: m.name, role: m.role, avatar: m.avatar || ROLE_EMOJI[m.role] }); setShowForm(true); }

  function save() {
    if (!form.name.trim()) return;
    if (editing) {
      setState(prev => ({ ...prev, members: prev.members.map(m => m.id === editing ? { ...m, ...form, name: form.name.trim() } : m) }));
      writeAudit('member_edited', `Edited member: ${form.name.trim()}`, 'parent');
    } else {
      const newMember = { id: genId(), ...form, name: form.name.trim(), createdAt: new Date().toISOString() };
      setState(prev => ({ ...prev, members: [...prev.members, newMember] }));
      ensureBalance(newMember.id);
      writeAudit('member_added', `Added member: ${form.name.trim()} (${form.role})`, 'parent');
    }
    setShowForm(false);
  }

  function deleteMember() {
    const m = members.find(x => x.id === confirmDelete);
    setState(prev => ({ ...prev, members: prev.members.filter(x => x.id !== confirmDelete) }));
    writeAudit('member_deleted', `Deleted member: ${m?.name}`, 'parent');
    setConfirmDelete(null);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👨‍👩‍👧‍👦 Family</h1>
          <p className="page-subtitle">Manage your family members and their roles</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Member</button>
      </div>

      {members.length === 0 && (
        <div className="empty-state card">
          <div className="empty-icon">👨‍👩‍👧‍👦</div>
          <h3>No family members yet</h3>
          <p>Start by adding yourself, then add your family members. Each member can be assigned chores, earn rewards, and track their economy.</p>
          <button className="btn btn-primary" onClick={openAdd}>+ Add First Member</button>
        </div>
      )}

      <ul className="item-list">
        {members.map(m => {
          const bal = state.economy?.balances?.[m.id] ?? {};
          return (
            <li key={m.id} className="list-item">
              <div className="list-item-avatar" style={{ fontSize: '1.6rem' }}>{m.avatar || ROLE_EMOJI[m.role] || '👤'}</div>
              <div className="list-item-content">
                <div className="list-item-title">{m.name}</div>
                <div className="list-item-sub" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  <span className="badge badge-green">{m.role}</span>
                  {m.role !== 'Pet' && m.role !== 'Toddler' && (
                    <>
                      <span className="chip chip-gold">⭐ {bal.points ?? 0} pts</span>
                      <span className="chip chip-green">💰 ${bal.money ?? 0}</span>
                      <span className="chip chip-blue">📺 {bal.screenMinutes ?? 0} min</span>
                    </>
                  )}
                </div>
              </div>
              <div className="list-item-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(m.id)}>🗑️</button>
              </div>
            </li>
          );
        })}
      </ul>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editing ? '✏️ Edit Member' : '➕ Add Family Member'}</div>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Emma" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value, avatar: ROLE_EMOJI[e.target.value] || '👤' }))}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Avatar</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {AVATARS.map(a => (
                  <button key={a} onClick={() => setForm(f => ({ ...f, avatar: a }))}
                    style={{ fontSize: '1.5rem', padding: 6,
                      border: `2px solid ${form.avatar === a ? 'var(--green-mid)' : 'var(--green-light)'}`,
                      borderRadius: 8, background: form.avatar === a ? 'var(--green-pale)' : 'var(--white)', cursor: 'pointer' }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.name.trim()}>{editing ? 'Save Changes' : 'Add Member'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🗑️ Delete Member?</div>
            <p>Are you sure you want to remove <strong>{members.find(m => m.id === confirmDelete)?.name}</strong>? This cannot be undone.</p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={deleteMember}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
