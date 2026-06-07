import React, { useState } from 'react';
import { useData } from '../utils/DataContext.jsx';
import { genId } from '../utils/storage.js';

const PERIODS = ['morning', 'afternoon', 'evening', 'custom'];
const PERIOD_ICONS = { morning: '🌅', afternoon: '☀️', evening: '🌙', custom: '⚡' };
const FAITH_TASKS = ['🙏 Prayer', '📖 Devotional', '📕 Bible Reading', '🙌 Gratitude'];

const blankRoutine = () => ({ title: '', period: 'morning', assignedTo: '', tasks: [], faithEnabled: false });

export default function Routines() {
  const { state, setState, writeAudit } = useData();
  const routines = state.routines ?? [];
  const members = state.members ?? [];
  const faithEnabled = state.settings?.faithEnabled ?? false;
  const [tab, setTab] = useState('morning');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankRoutine());
  const [newTask, setNewTask] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = routines.filter(r => r.period === tab);

  function openAdd() { setEditing(null); setForm({ ...blankRoutine(), period: tab }); setNewTask(''); setShowForm(true); }
  function openEdit(r) { setEditing(r.id); setForm({ title: r.title, period: r.period, assignedTo: r.assignedTo || '', tasks: [...r.tasks], faithEnabled: r.faithEnabled || false }); setNewTask(''); setShowForm(true); }

  function addTask() {
    if (!newTask.trim()) return;
    setForm(f => ({ ...f, tasks: [...f.tasks, { id: genId(), label: newTask.trim(), done: false }] }));
    setNewTask('');
  }

  function addFaithTask(label) {
    if (form.tasks.some(t => t.label === label)) return;
    setForm(f => ({ ...f, tasks: [...f.tasks, { id: genId(), label, done: false }] }));
  }

  function removeTask(taskId) { setForm(f => ({ ...f, tasks: f.tasks.filter(t => t.id !== taskId) })); }

  function save() {
    if (!form.title.trim()) return;
    if (editing) {
      setState(prev => ({ ...prev, routines: prev.routines.map(r => r.id === editing ? { ...r, ...form, title: form.title.trim() } : r) }));
      writeAudit('routine_edited', `Edited routine: ${form.title}`, 'parent');
    } else {
      const routine = { id: genId(), ...form, title: form.title.trim(), createdAt: new Date().toISOString() };
      setState(prev => ({ ...prev, routines: [...prev.routines, routine] }));
      writeAudit('routine_created', `Created routine: ${form.title}`, 'parent');
    }
    setShowForm(false);
  }

  function toggleTask(routineId, taskId) {
    setState(prev => ({ ...prev, routines: prev.routines.map(r => r.id === routineId ? { ...r, tasks: r.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) } : r) }));
  }

  function deleteRoutine() {
    const r = routines.find(x => x.id === confirmDelete);
    setState(prev => ({ ...prev, routines: prev.routines.filter(x => x.id !== confirmDelete) }));
    writeAudit('routine_deleted', `Deleted routine: ${r?.title}`, 'parent');
    setConfirmDelete(null);
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">🌅 Routines</h1><p className="page-subtitle">Daily and custom routines for the family</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Routine</button>
      </div>
      <div className="tabs">{PERIODS.map(p => <button key={p} className={`tab-btn ${tab === p ? 'active' : ''}`} onClick={() => setTab(p)}>{PERIOD_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}</button>)}</div>
      {filtered.length === 0 && (
        <div className="empty-state card">
          <div className="empty-icon">{PERIOD_ICONS[tab]}</div>
          <h3>No {tab} routines</h3>
          <p>Create routines with task checklists to help your family stay on track each day.</p>
          <button className="btn btn-primary" onClick={openAdd}>+ Add {tab.charAt(0).toUpperCase() + tab.slice(1)} Routine</button>
        </div>
      )}
      {filtered.map(r => {
        const assignee = members.find(m => m.id === r.assignedTo);
        const done = r.tasks.filter(t => t.done).length;
        return (
          <div key={r.id} className="card">
            <div className="section-header">
              <div><div className="section-title">{r.title}</div>{assignee && <div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>👤 {assignee.name}</div>}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="badge badge-green">{done}/{r.tasks.length} done</span>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(r.id)}>🗑️</button>
              </div>
            </div>
            {r.tasks.length === 0 ? <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>No tasks yet. Edit to add tasks.</p>
              : r.tasks.map(t => (
                <div key={t.id} className="checkbox-item" onClick={() => toggleTask(r.id, t.id)}>
                  <input type="checkbox" checked={t.done} onChange={() => {}}/>
                  <span className={`checkbox-label ${t.done ? 'done' : ''}`}>{t.label}</span>
                </div>
              ))}
          </div>
        );
      })}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editing ? '✏️ Edit Routine' : '➕ Add Routine'}</div>
            <div className="form-group"><label className="form-label">Routine Name *</label><input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Period</label>
                <select className="form-control" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
                  {PERIODS.map(p => <option key={p} value={p}>{PERIOD_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Assign To</label>
                <select className="form-control" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                  <option value="">— Everyone —</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            </div>
            {faithEnabled && (
              <div className="form-group"><label className="form-label">✝️ Faith Templates</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {FAITH_TASKS.map(ft => (
                    <button key={ft} className="btn btn-outline btn-sm" onClick={() => addFaithTask(ft)} style={{ opacity: form.tasks.some(t => t.label === ft) ? 0.4 : 1 }}>{ft}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="form-group"><label className="form-label">Tasks</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input className="form-control" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="Add a task..." />
                <button className="btn btn-primary btn-sm" onClick={addTask} style={{ flexShrink: 0 }}>Add</button>
              </div>
              {form.tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--green-pale)' }}>
                  <span style={{ flex: 1 }}>{t.label}</span>
                  <button className="btn btn-danger btn-xs" onClick={() => removeTask(t.id)}>✕</button>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.title.trim()}>{editing ? 'Save' : 'Add Routine'}</button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🗑️ Delete Routine?</div>
            <p>Delete <strong>{routines.find(r => r.id === confirmDelete)?.title}</strong>?</p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={deleteRoutine}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
