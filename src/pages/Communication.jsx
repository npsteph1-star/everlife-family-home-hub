import React, { useState } from 'react';
import { useData } from '../utils/DataContext.jsx';
import { genId } from '../utils/storage.js';

export default function Communication() {
  const { state, setState, writeAudit } = useData();
  const comm = state.communication ?? { announcements: [], brainDump: [], messages: [] };
  const members = state.members ?? [];
  const [tab, setTab] = useState('announcements');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('announcements');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  function openAdd(type) {
    setFormType(type); setEditing(null);
    if (type === 'announcements') setForm({ title: '', body: '', authorId: '', pinned: false });
    if (type === 'brainDump') setForm({ content: '', authorId: '' });
    if (type === 'messages') setForm({ fromId: '', title: '', body: '' });
    setShowForm(true);
  }
  function openEdit(item, type) { setFormType(type); setEditing(item.id); setForm({ ...item }); setShowForm(true); }

  function save() {
    const valid = formType === 'brainDump' ? form.content?.trim() : form.title?.trim();
    if (!valid) return;
    if (editing) {
      setState(prev => ({ ...prev, communication: { ...prev.communication, [formType]: prev.communication[formType].map(i => i.id === editing ? { ...i, ...form } : i) } }));
    } else {
      const item = { id: genId(), ...form, createdAt: new Date().toISOString() };
      setState(prev => ({ ...prev, communication: { ...prev.communication, [formType]: [...prev.communication[formType], item] } }));
      writeAudit('communication_posted', `New ${formType} posted`, form.authorId || form.fromId || 'family');
    }
    setShowForm(false);
  }

  function deleteItem(id) {
    setState(prev => ({ ...prev, communication: { ...prev.communication, [formType]: prev.communication[formType].filter(i => i.id !== id) } }));
    setConfirmDelete(null);
  }

  function togglePin(id) {
    setState(prev => ({ ...prev, communication: { ...prev.communication, announcements: prev.communication.announcements.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a) } }));
  }

  const announcements = [...(comm.announcements ?? [])].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const brainDump = [...(comm.brainDump ?? [])].sort((a, b) => b.createdAt?.localeCompare(a.createdAt));
  const messages = [...(comm.messages ?? [])].sort((a, b) => b.createdAt?.localeCompare(a.createdAt));

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">💬 Communication</h1><p className="page-subtitle">Announcements, brain dump, and family messages</p></div>
        <button className="btn btn-primary" onClick={() => openAdd(tab)}>+ Add</button>
      </div>
      <div className="tabs">
        <button className={`tab-btn ${tab==='announcements'?'active':''}`} onClick={()=>setTab('announcements')}>📢 Announcements</button>
        <button className={`tab-btn ${tab==='brainDump'?'active':''}`} onClick={()=>setTab('brainDump')}>🧠 Brain Dump</button>
        <button className={`tab-btn ${tab==='messages'?'active':''}`} onClick={()=>setTab('messages')}>✉️ Messages</button>
      </div>
      {tab==='announcements'&&(<>
        {announcements.length===0&&<div className="empty-state card"><div className="empty-icon">📢</div><h3>No announcements</h3><p>Share family announcements, reminders, and important notices.</p><button className="btn btn-primary" onClick={()=>openAdd('announcements')}>+ Add Announcement</button></div>}
        {announcements.map(a=>{
          const author=members.find(m=>m.id===a.authorId);
          return(<div key={a.id} className="card" style={{borderLeft:a.pinned?'4px solid var(--green-mid)':undefined}}>
            <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:8}}>
              <div><span style={{fontWeight:700,fontSize:'1.05rem'}}>{a.title}</span>{a.pinned&&<span className="badge badge-green" style={{marginLeft:8}}>📌 Pinned</span>}</div>
              <div style={{display:'flex',gap:6}}>
                <button className="btn btn-secondary btn-sm" onClick={()=>togglePin(a.id)}>{a.pinned?'Unpin':'📌 Pin'}</button>
                <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(a,'announcements')}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={()=>{setFormType('announcements');setConfirmDelete(a.id);}}>🗑️</button>
              </div>
            </div>
            <p style={{color:'var(--text-mid)',lineHeight:1.6}}>{a.body}</p>
            <div style={{marginTop:8,fontSize:'0.8rem',color:'var(--text-light)'}}>{author?`By ${author.name} · `:''}{new Date(a.createdAt).toLocaleDateString()}</div>
          </div>);
        })}
      </>)}
      {tab==='brainDump'&&(<>
        {brainDump.length===0&&<div className="empty-state card"><div className="empty-icon">🧠</div><h3>Brain dump is empty</h3><p>Write whatever is on your mind here.</p><button className="btn btn-primary" onClick={()=>openAdd('brainDump')}>+ Write Something</button></div>}
        <ul className="item-list">
          {brainDump.map(b=>{
            const author=members.find(m=>m.id===b.authorId);
            return(<li key={b.id} className="list-item" style={{alignItems:'flex-start'}}>
              <div className="list-item-avatar">🧠</div>
              <div className="list-item-content">
                <div className="list-item-title" style={{whiteSpace:'pre-wrap',fontWeight:400}}>{b.content}</div>
                <div className="list-item-sub" style={{marginTop:4}}>{author?`${author.name} · `:''}{new Date(b.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="list-item-actions">
                <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(b,'brainDump')}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={()=>{setFormType('brainDump');setConfirmDelete(b.id);}}>🗑️</button>
              </div>
            </li>);
          })}
        </ul>
      </>)}
      {tab==='messages'&&(<>
        {messages.length===0&&<div className="empty-state card"><div className="empty-icon">✉️</div><h3>No messages</h3><p>Leave notes and messages for family members.</p><button className="btn btn-primary" onClick={()=>openAdd('messages')}>+ Post Message</button></div>}
        {messages.map(msg=>{
          const from=members.find(m=>m.id===msg.fromId);
          return(<div key={msg.id} className="card">
            <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:8}}>
              <span style={{fontWeight:700,fontSize:'1.05rem'}}>{msg.title}</span>
              <div style={{display:'flex',gap:6}}>
                <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(msg,'messages')}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={()=>{setFormType('messages');setConfirmDelete(msg.id);}}>🗑️</button>
              </div>
            </div>
            <p style={{color:'var(--text-mid)',lineHeight:1.6}}>{msg.body}</p>
            <div style={{marginTop:8,fontSize:'0.8rem',color:'var(--text-light)'}}>From {from?.name??'Family'} · {new Date(msg.createdAt).toLocaleDateString()}</div>
          </div>);
        })}
      </>)}
      {showForm&&(<div className="modal-overlay" onClick={()=>setShowForm(false)}><div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
        <div className="modal-title">{editing?'✏️ Edit':'➕ Add'} {formType==='announcements'?'Announcement':formType==='brainDump'?'Brain Dump':'Message'}</div>
        {formType!=='brainDump'&&<div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={form.title||''} onChange={e=>setForm(f=>({...f,title:e.target.value}))} autoFocus /></div>}
        <div className="form-group"><label className="form-label">{formType==='brainDump'?'Content *':'Body'}</label>
          <textarea className="form-control" style={{minHeight:120}} value={formType==='brainDump'?(form.content||''):(form.body||'')} onChange={e=>setForm(f=>({...f,[formType==='brainDump'?'content':'body']:e.target.value}))} autoFocus={formType==='brainDump'}/></div>
        <div className="form-group"><label className="form-label">{formType==='messages'?'From':'Author'}</label>
          <select className="form-control" value={form.authorId||form.fromId||''} onChange={e=>setForm(f=>({...f,[formType==='messages'?'fromId':'authorId']:e.target.value}))}>
            <option value="">— Family —</option>{members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={formType==='brainDump'?!form.content?.trim():!form.title?.trim()}>Save</button>
        </div>
      </div></div>)}
      {confirmDelete&&(<div className="modal-overlay" onClick={()=>setConfirmDelete(null)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-title">🗑️ Delete?</div><p>Are you sure? This cannot be undone.</p><div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={()=>deleteItem(confirmDelete)}>Delete</button></div></div></div>)}
    </div>
  );
}
