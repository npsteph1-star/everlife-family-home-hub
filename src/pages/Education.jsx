import React, { useState } from 'react';
import { useData } from '../utils/DataContext.jsx';
import { genId } from '../utils/storage.js';

const SUBJECTS = ['Math','Reading','Science','History','Art','Music','PE','Language Arts','Bible','Other'];
const STATUSES = ['todo','in_progress','done'];
const STATUS_ICONS = { todo:'📌', in_progress:'🔄', done:'✅' };
const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', done:'Done' };

export default function Education() {
  const { state, setState } = useData();
  const edu = state.education ?? { readingLog:[], goals:[], assignments:[] };
  const members = (state.members ?? []).filter(m => m.role === 'Child' || m.role === 'Toddler');
  const [tab, setTab] = useState('assignments');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('assignments');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const todayStr = new Date().toISOString().split('T')[0];

  function openAdd(type) {
    setFormType(type); setEditing(null);
    if (type==='assignments') setForm({ memberId:'', subject:'Math', title:'', dueDate:todayStr, status:'todo', notes:'' });
    if (type==='goals') setForm({ memberId:'', subject:'Math', title:'', targetDate:'', completed:false, notes:'' });
    if (type==='readingLog') setForm({ memberId:'', title:'', author:'', pages:'', completedAt:todayStr, notes:'' });
    setShowForm(true);
  }
  function openEdit(item, type) { setFormType(type); setEditing(item.id); setForm({...item}); setShowForm(true); }

  function save() {
    if (!form.title?.trim()) return;
    if (editing) {
      setState(prev => ({ ...prev, education: { ...prev.education, [formType]: prev.education[formType].map(i => i.id===editing?{...i,...form}:i) } }));
    } else {
      const item = { id: genId(), ...form, createdAt: new Date().toISOString() };
      setState(prev => ({ ...prev, education: { ...prev.education, [formType]: [...prev.education[formType], item] } }));
    }
    setShowForm(false);
  }

  function deleteItem(id) {
    setState(prev => ({ ...prev, education: { ...prev.education, [formType]: prev.education[formType].filter(i => i.id!==id) } }));
    setConfirmDelete(null);
  }

  function cycleStatus(id) {
    setState(prev => ({ ...prev, education: { ...prev.education, assignments: prev.education.assignments.map(a => {
      if (a.id!==id) return a;
      const next = { todo:'in_progress', in_progress:'done', done:'todo' }[a.status]||'todo';
      return {...a, status:next};
    }) } }));
  }

  function toggleGoal(id) {
    setState(prev => ({ ...prev, education: { ...prev.education, goals: prev.education.goals.map(g => g.id===id?{...g,completed:!g.completed}:g) } }));
  }

  const assignments=edu.assignments??[]; const goals=edu.goals??[]; const readingLog=edu.readingLog??[];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">📚 Education</h1><p className="page-subtitle">Assignments, learning goals, and reading log</p></div>
        <button className="btn btn-primary" onClick={()=>openAdd(tab)}>+ Add</button>
      </div>
      <div className="tabs">
        <button className={`tab-btn ${tab==='assignments'?'active':''}`} onClick={()=>setTab('assignments')}>📝 Assignments ({assignments.filter(a=>a.status!=='done').length})</button>
        <button className={`tab-btn ${tab==='goals'?'active':''}`} onClick={()=>setTab('goals')}>🎯 Goals ({goals.filter(g=>!g.completed).length})</button>
        <button className={`tab-btn ${tab==='readingLog'?'active':''}`} onClick={()=>setTab('readingLog')}>📖 Reading ({readingLog.length})</button>
      </div>
      {tab==='assignments'&&(<>
        {assignments.length===0&&<div className="empty-state card"><div className="empty-icon">📝</div><h3>No assignments</h3><p>Track school assignments and homeschool work.</p><button className="btn btn-primary" onClick={()=>openAdd('assignments')}>+ Add Assignment</button></div>}
        {STATUSES.map(s=>{
          const items=assignments.filter(a=>a.status===s);
          if(items.length===0)return null;
          return(<div key={s} className="card"><div className="section-title" style={{marginBottom:10}}>{STATUS_ICONS[s]} {STATUS_LABELS[s]} ({items.length})</div>
            <ul className="item-list" style={{marginBottom:0}}>
              {items.map(a=>{
                const member=members.find(m=>m.id===a.memberId);
                return(<li key={a.id} className="list-item">
                  <button onClick={()=>cycleStatus(a.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'1.3rem'}}>{STATUS_ICONS[a.status]}</button>
                  <div className="list-item-content">
                    <div className="list-item-title" style={{textDecoration:a.status==='done'?'line-through':'none'}}>{a.title}</div>
                    <div className="list-item-sub">{a.subject}{member?` · ${member.name}`:''}{a.dueDate?` · Due ${new Date(a.dueDate+'T12:00:00').toLocaleDateString()}`:''}</div>
                  </div>
                  <div className="list-item-actions">
                    <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(a,'assignments')}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>{setFormType('assignments');setConfirmDelete(a.id);}}>🗑️</button>
                  </div>
                </li>);
              })}
            </ul>
          </div>);
        })}
      </>)}
      {tab==='goals'&&(<>
        {goals.length===0&&<div className="empty-state card"><div className="empty-icon">🎯</div><h3>No learning goals</h3><p>Set subject-specific goals for each child.</p><button className="btn btn-primary" onClick={()=>openAdd('goals')}>+ Add Goal</button></div>}
        <ul className="item-list">
          {goals.map(g=>{
            const member=members.find(m=>m.id===g.memberId);
            return(<li key={g.id} className="list-item">
              <button onClick={()=>toggleGoal(g.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'1.3rem'}}>{g.completed?'🏆':'🎯'}</button>
              <div className="list-item-content">
                <div className="list-item-title" style={{textDecoration:g.completed?'line-through':'none'}}>{g.title}</div>
                <div className="list-item-sub">{g.subject}{member?` · ${member.name}`:''}{g.targetDate?` · Target: ${new Date(g.targetDate+'T12:00:00').toLocaleDateString()}`:''}</div>
              </div>
              <div className="list-item-actions">
                <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(g,'goals')}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={()=>{setFormType('goals');setConfirmDelete(g.id);}}>🗑️</button>
              </div>
            </li>);
          })}
        </ul>
      </>)}
      {tab==='readingLog'&&(<>
        {readingLog.length===0&&<div className="empty-state card"><div className="empty-icon">📖</div><h3>Reading log is empty</h3><p>Log books your children have read.</p><button className="btn btn-primary" onClick={()=>openAdd('readingLog')}>+ Log a Book</button></div>}
        <ul className="item-list">
          {[...readingLog].sort((a,b)=>b.completedAt?.localeCompare(a.completedAt)).map(r=>{
            const member=members.find(m=>m.id===r.memberId);
            return(<li key={r.id} className="list-item">
              <div className="list-item-avatar">📖</div>
              <div className="list-item-content">
                <div className="list-item-title">{r.title}</div>
                <div className="list-item-sub">{r.author&&`By ${r.author} · `}{r.pages&&`${r.pages} pages · `}{member&&`${member.name} · `}{r.completedAt&&new Date(r.completedAt+'T12:00:00').toLocaleDateString()}</div>
              </div>
              <div className="list-item-actions">
                <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(r,'readingLog')}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={()=>{setFormType('readingLog');setConfirmDelete(r.id);}}>🗑️</button>
              </div>
            </li>);
          })}
        </ul>
      </>)}
      {showForm&&(
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{editing?'✏️ Edit':'➕ Add'} {formType==='assignments'?'Assignment':formType==='goals'?'Goal':'Book'}</div>
            <div className="form-group"><label className="form-label">{formType==='readingLog'?'Reader':'Assign To'}</label>
              <select className="form-control" value={form.memberId||''} onChange={e=>setForm(f=>({...f,memberId:e.target.value}))}>
                <option value="">— Select child —</option>{members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">{formType==='readingLog'?'Book Title':'Title'} *</label>
              <input className="form-control" value={form.title||''} onChange={e=>setForm(f=>({...f,title:e.target.value}))} autoFocus /></div>
            {formType!=='readingLog'&&<div className="form-group"><label className="form-label">Subject</label><select className="form-control" value={form.subject||'Math'} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}>{SUBJECTS.map(s=><option key={s}>{s}</option>)}</select></div>}
            {formType==='readingLog'&&<div className="form-row">
              <div className="form-group"><label className="form-label">Author</label><input className="form-control" value={form.author||''} onChange={e=>setForm(f=>({...f,author:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Pages</label><input type="number" min="0" className="form-control" value={form.pages||''} onChange={e=>setForm(f=>({...f,pages:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Completed</label><input type="date" className="form-control" value={form.completedAt||''} onChange={e=>setForm(f=>({...f,completedAt:e.target.value}))}/></div>
            </div>}
            {formType==='assignments'&&<div className="form-row">
              <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-control" value={form.dueDate||''} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Status</label><select className="form-control" value={form.status||'todo'} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
            </div>}
            {formType==='goals'&&<div className="form-group"><label className="form-label">Target Date</label><input type="date" className="form-control" value={form.targetDate||''} onChange={e=>setForm(f=>({...f,targetDate:e.target.value}))}/></div>}
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.title?.trim()}>Save</button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete&&(<div className="modal-overlay" onClick={()=>setConfirmDelete(null)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-title">🗑️ Delete?</div><p>This cannot be undone.</p><div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={()=>deleteItem(confirmDelete)}>Delete</button></div></div></div>)}
    </div>
  );
}
