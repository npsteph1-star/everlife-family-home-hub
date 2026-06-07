import React, { useState } from 'react';
import { useData } from '../utils/DataContext.jsx';
import { genId } from '../utils/storage.js';

const TYPES = ['event', 'appointment', 'reminder'];
const TYPE_ICONS = { event: '📅', appointment: '🏥', reminder: '🔔' };
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const blankEvent = () => ({ title: '', date: new Date().toISOString().split('T')[0], time: '', type: 'event', assignedTo: '', notes: '' });

export default function Calendar() {
  const { state, setState, writeAudit } = useData();
  const events = state.calendar ?? [];
  const members = state.members ?? [];
  const today = new Date();
  const [viewMonth, setViewMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankEvent());
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('month');

  function openAdd(date) { setEditing(null); setForm({ ...blankEvent(), date: date || new Date().toISOString().split('T')[0] }); setShowForm(true); }
  function openEdit(e) { setEditing(e.id); setForm({ title: e.title, date: e.date, time: e.time||'', type: e.type, assignedTo: e.assignedTo||'', notes: e.notes||'' }); setShowForm(true); }

  function save() {
    if (!form.title.trim() || !form.date) return;
    if (editing) {
      setState(prev => ({ ...prev, calendar: prev.calendar.map(e => e.id === editing ? { ...e, ...form, title: form.title.trim() } : e) }));
      writeAudit('calendar_edited', `Edited event: ${form.title}`, 'parent');
    } else {
      const ev = { id: genId(), ...form, title: form.title.trim(), createdAt: new Date().toISOString() };
      setState(prev => ({ ...prev, calendar: [...prev.calendar, ev] }));
      writeAudit('calendar_created', `Created event: ${form.title}`, 'parent');
    }
    setShowForm(false);
  }

  function deleteEvent() {
    const e = events.find(x => x.id === confirmDelete);
    setState(prev => ({ ...prev, calendar: prev.calendar.filter(x => x.id !== confirmDelete) }));
    writeAudit('calendar_deleted', `Deleted event: ${e?.title}`, 'parent');
    setConfirmDelete(null);
  }

  const { year, month } = viewMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().split('T')[0];

  function prevMonth() { setViewMonth(v => v.month === 0 ? { year: v.year-1, month: 11 } : { ...v, month: v.month-1 }); }
  function nextMonth() { setViewMonth(v => v.month === 11 ? { year: v.year+1, month: 0 } : { ...v, month: v.month+1 }); }
  function dayStr(d) { return `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

  const dayEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">📅 Calendar</h1><p className="page-subtitle">Events, appointments, and reminders</p></div>
        <div style={{display:'flex',gap:8}}>
          <button className={`btn btn-sm ${view==='month'?'btn-primary':'btn-secondary'}`} onClick={()=>setView('month')}>Month</button>
          <button className={`btn btn-sm ${view==='list'?'btn-primary':'btn-secondary'}`} onClick={()=>setView('list')}>List</button>
          <button className="btn btn-primary btn-sm" onClick={()=>openAdd()}>+ Add</button>
        </div>
      </div>
      {view==='month'&&(
        <div className="card">
          <div className="cal-month-nav">
            <button className="btn btn-secondary btn-sm" onClick={prevMonth}>◄</button>
            <span className="cal-month-title">{MONTHS[month]} {year}</span>
            <button className="btn btn-secondary btn-sm" onClick={nextMonth}>►</button>
          </div>
          <div className="cal-grid">
            {DAYS.map(d=><div key={d} className="cal-day-header">{d}</div>)}
            {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`} className="cal-day other-month"/>)}
            {Array.from({length:daysInMonth}).map((_,i)=>{
              const d=i+1; const ds=dayStr(d);
              const hasEvents=events.some(e=>e.date===ds);
              return(<div key={d} className={`cal-day ${ds===todayStr?'today':''} ${ds===selectedDate?'today':''} ${hasEvents?'has-events':''}`}
                onClick={()=>setSelectedDate(ds===selectedDate?null:ds)}>{d}</div>);
            })}
          </div>
          {selectedDate&&(
            <div style={{marginTop:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <strong style={{color:'var(--green-dark)'}}>{new Date(selectedDate+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</strong>
                <button className="btn btn-primary btn-sm" onClick={()=>openAdd(selectedDate)}>+ Add Event</button>
              </div>
              {dayEvents.length===0?<p style={{color:'var(--text-light)',fontSize:'0.9rem'}}>No events. Click + Add Event.</p>
                :dayEvents.map(ev=>(
                <div key={ev.id} className="list-item" style={{marginBottom:8}}>
                  <div className="list-item-avatar">{TYPE_ICONS[ev.type]}</div>
                  <div className="list-item-content">
                    <div className="list-item-title">{ev.title}</div>
                    <div className="list-item-sub">{ev.time||'All day'} · {ev.type}</div>
                  </div>
                  <div className="list-item-actions">
                    <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(ev)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>setConfirmDelete(ev.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {view==='list'&&(
        <>
          {events.length===0&&<div className="empty-state card"><div className="empty-icon">📅</div><h3>No events yet</h3><p>Add events, appointments, and reminders.</p><button className="btn btn-primary" onClick={()=>openAdd()}>+ Add First Event</button></div>}
          <ul className="item-list">
            {[...events].sort((a,b)=>a.date.localeCompare(b.date)).map(ev=>{
              const assignee=members.find(m=>m.id===ev.assignedTo);
              return(<li key={ev.id} className="list-item">
                <div className="list-item-avatar">{TYPE_ICONS[ev.type]}</div>
                <div className="list-item-content">
                  <div className="list-item-title">{ev.title}</div>
                  <div className="list-item-sub">{new Date(ev.date+'T12:00:00').toLocaleDateString()} {ev.time?`· ${ev.time}`:''} {assignee?`· ${assignee.name}`:''}</div>
                  {ev.notes&&<div style={{fontSize:'0.8rem',color:'var(--text-light)'}}>{ev.notes}</div>}
                </div>
                <div className="list-item-actions">
                  <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(ev)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>setConfirmDelete(ev.id)}>🗑️</button>
                </div>
              </li>);
            })}
          </ul>
        </>
      )}
      {showForm&&(
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{editing?'✏️ Edit Event':'➕ Add Event'}</div>
            <div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} autoFocus /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Time (optional)</label><input type="time" className="form-control" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Type</label><select className="form-control" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{TYPES.map(t=><option key={t} value={t}>{TYPE_ICONS[t]} {t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Assign To</label><select className="form-control" value={form.assignedTo} onChange={e=>setForm(f=>({...f,assignedTo:e.target.value}))}><option value="">— Everyone —</option>{members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            </div>
            <div className="form-group"><label className="form-label">Notes (optional)</label><textarea className="form-control" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.title.trim()||!form.date}>{editing?'Save':'Add Event'}</button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete&&(<div className="modal-overlay" onClick={()=>setConfirmDelete(null)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-title">🗑️ Delete Event?</div><p>Delete <strong>{events.find(e=>e.id===confirmDelete)?.title}</strong>?</p><div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={deleteEvent}>Delete</button></div></div></div>)}
    </div>
  );
}
