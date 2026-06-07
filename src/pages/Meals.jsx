import React, { useState } from 'react';
import { useData } from '../utils/DataContext.jsx';
import { genId } from '../utils/storage.js';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS = { breakfast: '🌄', lunch: '🥪', dinner: '🍽️', snack: '🍎' };
const PANTRY_CATS = ['Produce', 'Dairy', 'Meat', 'Pantry', 'Frozen', 'Beverages', 'Other'];

export default function Meals() {
  const { state, setState } = useData();
  const meals = state.meals ?? { planner: [], pantry: [], groceryList: [] };
  const [tab, setTab] = useState('planner');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('planner');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const todayStr = new Date().toISOString().split('T')[0];

  function openAdd(type) {
    setFormType(type); setEditing(null);
    if (type === 'planner') setForm({ date: todayStr, mealType: 'dinner', title: '', notes: '' });
    if (type === 'pantry') setForm({ name: '', quantity: '', unit: 'unit', category: 'Pantry', lowAlert: false });
    if (type === 'grocery') setForm({ name: '', quantity: '1', unit: 'unit', checked: false });
    setShowForm(true);
  }

  function openEdit(item, type) { setFormType(type); setEditing(item.id); setForm({ ...item }); setShowForm(true); }

  function save() {
    const listKey = formType === 'planner' ? 'planner' : formType === 'pantry' ? 'pantry' : 'groceryList';
    if (!form.title && !form.name) return;
    if (editing) {
      setState(prev => ({ ...prev, meals: { ...prev.meals, [listKey]: prev.meals[listKey].map(i => i.id === editing ? { ...i, ...form } : i) } }));
    } else {
      const item = { id: genId(), ...form, createdAt: new Date().toISOString() };
      setState(prev => ({ ...prev, meals: { ...prev.meals, [listKey]: [...prev.meals[listKey], item] } }));
    }
    setShowForm(false);
  }

  function deleteItem(id, listKey) {
    setState(prev => ({ ...prev, meals: { ...prev.meals, [listKey]: prev.meals[listKey].filter(i => i.id !== id) } }));
    setConfirmDelete(null);
  }

  function toggleGrocery(id) {
    setState(prev => ({ ...prev, meals: { ...prev.meals, groceryList: prev.meals.groceryList.map(i => i.id === id ? { ...i, checked: !i.checked } : i) } }));
  }

  const planner = meals.planner ?? []; const pantry = meals.pantry ?? []; const groceryList = meals.groceryList ?? [];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">🍽️ Meals</h1><p className="page-subtitle">Meal planner, grocery list, and pantry inventory</p></div>
        <button className="btn btn-primary" onClick={() => openAdd(tab === 'grocery' ? 'grocery' : tab === 'pantry' ? 'pantry' : 'planner')}>+ Add</button>
      </div>
      <div className="tabs">
        <button className={`tab-btn ${tab === 'planner' ? 'active' : ''}`} onClick={() => setTab('planner')}>🍽️ Planner</button>
        <button className={`tab-btn ${tab === 'grocery' ? 'active' : ''}`} onClick={() => setTab('grocery')}>🛒 Grocery ({groceryList.filter(i => !i.checked).length})</button>
        <button className={`tab-btn ${tab === 'pantry' ? 'active' : ''}`} onClick={() => setTab('pantry')}>📦 Pantry</button>
      </div>
      {tab === 'planner' && (
        <>
          {planner.length === 0 && <div className="empty-state card"><div className="empty-icon">🍽️</div><h3>No meals planned</h3><p>Plan your family meals for the week.</p><button className="btn btn-primary" onClick={() => openAdd('planner')}>+ Plan a Meal</button></div>}
          <ul className="item-list">
            {[...planner].sort((a,b)=>a.date.localeCompare(b.date)).map(m => (
              <li key={m.id} className="list-item">
                <div className="list-item-avatar">{MEAL_ICONS[m.mealType]||'🍽️'}</div>
                <div className="list-item-content">
                  <div className="list-item-title">{m.title}</div>
                  <div className="list-item-sub">{new Date(m.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})} · {m.mealType}</div>
                  {m.notes && <div style={{fontSize:'0.8rem',color:'var(--text-light)'}}>{m.notes}</div>}
                </div>
                <div className="list-item-actions">
                  <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(m,'planner')}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>setConfirmDelete({id:m.id,list:'planner'})}>🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {tab === 'grocery' && (
        <>
          {groceryList.length === 0 && <div className="empty-state card"><div className="empty-icon">🛒</div><h3>Grocery list is empty</h3><p>Add items you need to buy.</p><button className="btn btn-primary" onClick={()=>openAdd('grocery')}>+ Add Item</button></div>}
          <div className="card">
            {['🛒 To Buy','✅ Got It'].map((section,si)=>{
              const items=groceryList.filter(i=>si===0?!i.checked:i.checked);
              if(items.length===0)return null;
              return(<div key={section} style={{marginBottom:16}}>
                <div className="section-title" style={{marginBottom:8}}>{section}</div>
                {items.map(item=>(
                  <div key={item.id} className="checkbox-item">
                    <input type="checkbox" checked={item.checked} onChange={()=>toggleGrocery(item.id)}/>
                    <span className={`checkbox-label ${item.checked?'done':''}`} style={{flex:1}}>{item.name} <span style={{color:'var(--text-light)',fontSize:'0.82rem'}}>({item.quantity} {item.unit})</span></span>
                    <button className="btn btn-danger btn-xs" onClick={()=>setConfirmDelete({id:item.id,list:'groceryList'})}>✕</button>
                  </div>
                ))}
              </div>);
            })}
          </div>
        </>
      )}
      {tab === 'pantry' && (
        <>
          {pantry.length === 0 && <div className="empty-state card"><div className="empty-icon">📦</div><h3>Pantry is empty</h3><p>Track what you have on hand.</p><button className="btn btn-primary" onClick={()=>openAdd('pantry')}>+ Add Pantry Item</button></div>}
          <ul className="item-list">
            {pantry.map(item=>(
              <li key={item.id} className="list-item">
                <div className="list-item-avatar">📦</div>
                <div className="list-item-content">
                  <div className="list-item-title">{item.name}</div>
                  <div className="list-item-sub">{item.quantity} {item.unit} · {item.category}{item.lowAlert&&Number(item.quantity)<=1&&<span className="badge badge-orange" style={{marginLeft:6}}>Low Stock</span>}</div>
                </div>
                <div className="list-item-actions">
                  <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(item,'pantry')}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>setConfirmDelete({id:item.id,list:'pantry'})}>🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{editing?'✏️ Edit':'➕ Add'} {formType==='planner'?'Meal':formType==='pantry'?'Pantry Item':'Grocery Item'}</div>
            {formType==='planner'&&(<>
              <div className="form-group"><label className="form-label">Meal Name *</label><input className="form-control" value={form.title||''} onChange={e=>setForm(f=>({...f,title:e.target.value}))} autoFocus /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" value={form.date||''} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Meal Type</label><select className="form-control" value={form.mealType||'dinner'} onChange={e=>setForm(f=>({...f,mealType:e.target.value}))}>{MEAL_TYPES.map(t=><option key={t} value={t}>{MEAL_ICONS[t]} {t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></div>
              </div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
            </>)}
            {(formType==='pantry'||formType==='grocery')&&(<>
              <div className="form-group"><label className="form-label">Name *</label><input className="form-control" value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Quantity</label><input type="number" min="0" className="form-control" value={form.quantity||''} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Unit</label><input className="form-control" value={form.unit||''} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} placeholder="lbs, oz, unit"/></div>
              </div>
              {formType==='pantry'&&<div className="form-group"><label className="form-label">Category</label><select className="form-control" value={form.category||'Pantry'} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{PANTRY_CATS.map(c=><option key={c}>{c}</option>)}</select></div>}
            </>)}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.title&&!form.name}>Save</button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete&&(<div className="modal-overlay" onClick={()=>setConfirmDelete(null)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-title">🗑️ Delete Item?</div><p>Are you sure?</p><div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setConfirmDelete(null)}>Cancel</button><button className="btn btn-danger" onClick={()=>deleteItem(confirmDelete.id,confirmDelete.list)}>Delete</button></div></div></div>)}
    </div>
  );
}
