import React, { useState, useRef } from 'react';
import { useData } from '../utils/DataContext.jsx';
import { exportData, importData, clearState, hashPin } from '../utils/storage.js';
import PinModal from '../components/PinModal.jsx';

const AI_PROVIDERS = ['none','openai','anthropic','gemini'];
const ALLOWANCE_MODES = [
  { value: 'real', label: '💵 Real Money Only' },
  { value: 'points', label: '⭐ Points Only' },
  { value: 'both', label: '💰 Both (Real + Points)' },
];

export default function Settings() {
  const { state, setState, writeAudit } = useData();
  const settings = state.settings ?? {};
  const [pinGate, setPinGate] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [pinModal, setPinModal] = useState(null);
  const [newPinBuffer, setNewPinBuffer] = useState('');
  const [toast, setToast] = useState('');
  const fileRef = useRef();

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(''),2500); }

  function updateSetting(key, value) {
    setState(prev => ({ ...prev, settings: { ...prev.settings, [key]: value } }));
    writeAudit('settings_changed', `Changed setting: ${key}`, 'parent');
  }

  function doReset() {
    clearState();
    writeAudit('data_reset', 'All data was reset', 'parent');
    window.location.reload();
  }

  function handleExport() {
    exportData(state);
    writeAudit('data_exported', 'Data exported to JSON', 'parent');
    showToast('✅ Data exported!');
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    importData(file, (err, data) => {
      if (err) { showToast('❌ Invalid file. Please use a valid backup.'); return; }
      setState(data);
      writeAudit('data_imported', 'Data imported from JSON', 'parent');
      showToast('✅ Data imported successfully!');
    });
    e.target.value = '';
  }

  if (!unlocked) {
    return (
      <div>
        <div className="page-header"><div><h1 className="page-title">⚙️ Settings</h1><p className="page-subtitle">Parent-protected settings</p></div></div>
        <div className="empty-state card">
          <div className="empty-icon">🔒</div>
          <h3>Parent PIN Required</h3>
          <p>Settings are protected. Enter your parent PIN to continue. Default PIN is <strong>1234</strong>.</p>
          <button className="btn btn-primary" onClick={()=>setPinGate(true)}>🔓 Enter PIN</button>
        </div>
        {pinGate&&<PinModal title="Access Settings" storedHash={state.security?.parentPinHash} onSuccess={()=>{setUnlocked(true);setPinGate(false);}} onCancel={()=>setPinGate(false)}/>}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">⚙️ Settings</h1><p className="page-subtitle">App preferences and family configuration</p></div>
        <button className="btn btn-secondary btn-sm" onClick={()=>setUnlocked(false)}>🔒 Lock</button>
      </div>
      {toast&&<div className="alert alert-success" style={{position:'fixed',top:16,right:16,zIndex:3000,maxWidth:320}}>{toast}</div>}
      <div className="tabs">
        {[['general','⚙️ General'],['security','🔒 Security'],['modules','🧩 Modules'],['integrations','🔗 Integrations'],['data','💾 Data']].map(([k,l])=>(
          <button key={k} className={`tab-btn ${activeTab===k?'active':''}`} onClick={()=>setActiveTab(k)}>{l}</button>
        ))}
      </div>
      {activeTab==='general'&&(
        <div className="card">
          <div className="section-title" style={{marginBottom:16}}>🏠 App Identity</div>
          <div className="form-group"><label className="form-label">App Name</label><input className="form-control" value={settings.productName??'Family Home Hub'} onChange={e=>updateSetting('productName',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Workspace / Family Name</label><input className="form-control" value={settings.workspaceName??''} onChange={e=>updateSetting('workspaceName',e.target.value)} placeholder="The Johnson Family"/></div>
          <div className="form-group"><label className="form-label">Internal Branding (optional)</label><input className="form-control" value={settings.internalBranding??''} onChange={e=>updateSetting('internalBranding',e.target.value)} placeholder="EverLife Family Workspace (optional)"/><p style={{fontSize:'0.78rem',color:'var(--text-light)',marginTop:4}}>Only visible in settings. Not shown in the public UI.</p></div>
          <hr className="divider"/>
          <div className="section-title" style={{marginBottom:16}}>💰 Allowance Mode</div>
          <div className="form-group"><label className="form-label">Track balances using</label><select className="form-control" value={settings.allowanceMode??'both'} onChange={e=>updateSetting('allowanceMode',e.target.value)}>{ALLOWANCE_MODES.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
          <div className="alert alert-warning">⚠️ Allowance balances are tracking tools and not financial accounts.</div>
        </div>
      )}
      {activeTab==='security'&&(
        <div className="card">
          <div className="section-title" style={{marginBottom:16}}>🔐 PIN Management</div>
          <p style={{color:'var(--text-light)',marginBottom:16}}>The parent PIN (default: <strong>1234</strong>) protects Settings, reward approvals, chore approvals, economy edits, and data reset.</p>
          <button className="btn btn-primary" onClick={()=>setPinModal('changePin')}>🔑 Change Parent PIN</button>
          <hr className="divider"/>
          <div className="section-title" style={{marginBottom:12}}>👦 Child Mode</div>
          <div className="alert alert-info">Child mode PIN system is in development. All sensitive actions currently require the parent PIN.</div>
        </div>
      )}
      {activeTab==='modules'&&(
        <div className="card">
          <div className="section-title" style={{marginBottom:8}}>🧩 Feature Modules</div>
          {[
            {key:'faithEnabled',title:'✝️ Faith Mode',desc:'Enables faith-based routine templates (Prayer, Devotional, Bible Reading, Gratitude).'},
            {key:'babyModeEnabled',title:'🍼 Baby Mode',desc:'Track feedings, sleep, diapers, pumping, baths, and medication.'},
            {key:'pregnancyModeEnabled',title:'🤰 Pregnancy Mode',desc:'Track pregnancy milestones, due date, and prenatal appointments.'},
            {key:'petsEnabled',title:'🐾 Pet Module',desc:'Track feeding, vet visits, vaccines, medications, and grooming for pets.'},
            {key:'toddlerMode',title:'👶 Toddler Mode',desc:'Simplified tap-only interface for toddler family members.'},
          ].map(({key,title,desc})=>(
            <div key={key} className="toggle-row">
              <div className="toggle-info"><div className="toggle-title">{title}</div><div className="toggle-desc">{desc}</div></div>
              <label className="switch"><input type="checkbox" checked={settings[key]??false} onChange={e=>updateSetting(key,e.target.checked)}/><span className="slider"/></label>
            </div>
          ))}
        </div>
      )}
      {activeTab==='integrations'&&(
        <div className="card">
          <div className="section-title" style={{marginBottom:16}}>🔗 Future Integrations</div>
          <div className="alert alert-info" style={{marginBottom:16}}>These are placeholder settings. No external services are currently connected.</div>
          <div className="form-group"><label className="form-label">🤖 AI Provider</label><select className="form-control" value={settings.aiProvider??'none'} onChange={e=>updateSetting('aiProvider',e.target.value)}>{AI_PROVIDERS.map(p=><option key={p} value={p}>{p==='none'?'— None (coming soon) —':p.charAt(0).toUpperCase()+p.slice(1)}</option>)}</select></div>
          {settings.aiProvider!=='none'&&<div className="form-group"><label className="form-label">🔑 BYO API Key</label><input type="password" className="form-control" value={settings.aiApiKey??''} onChange={e=>updateSetting('aiApiKey',e.target.value)} placeholder="sk-..."/></div>}
          <hr className="divider"/>
          <div className="form-group"><label className="form-label">🗄️ Supabase URL (placeholder)</label><input className="form-control" value={settings.supabaseUrl??''} onChange={e=>updateSetting('supabaseUrl',e.target.value)} placeholder="https://your-project.supabase.co"/></div>
          <div className="form-group"><label className="form-label">💳 Stripe Key (placeholder)</label><input type="password" className="form-control" value={settings.stripeKey??''} onChange={e=>updateSetting('stripeKey',e.target.value)} placeholder="pk_..."/></div>
        </div>
      )}
      {activeTab==='data'&&(
        <div className="card">
          <div className="section-title" style={{marginBottom:16}}>💾 Data Management</div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div><div style={{fontWeight:600,marginBottom:4}}>📤 Export Data</div><p style={{fontSize:'0.88rem',color:'var(--text-light)',marginBottom:8}}>Download all family data as a JSON backup.</p><button className="btn btn-primary" onClick={handleExport}>📤 Export to JSON</button></div>
            <hr className="divider"/>
            <div><div style={{fontWeight:600,marginBottom:4}}>📥 Import Data</div><p style={{fontSize:'0.88rem',color:'var(--text-light)',marginBottom:8}}>Restore from a backup file. <strong>This will overwrite all current data.</strong></p>
              <input ref={fileRef} type="file" accept=".json" style={{display:'none'}} onChange={handleImport}/>
              <button className="btn btn-secondary" onClick={()=>fileRef.current?.click()}>📥 Import from JSON</button></div>
            <hr className="divider"/>
            <div><div style={{fontWeight:600,color:'var(--danger)',marginBottom:4}}>🗑️ Reset All Data</div><p style={{fontSize:'0.88rem',color:'var(--text-light)',marginBottom:8}}>Permanently delete all data. Cannot be undone.</p><button className="btn btn-danger" onClick={()=>setPinModal('reset')}>🗑️ Reset All Data</button></div>
          </div>
        </div>
      )}
      {pinModal==='changePin'&&<PinModal title="Enter Current PIN" storedHash={state.security?.parentPinHash} onSuccess={()=>{setPinModal('newPin');}} onCancel={()=>setPinModal(null)}/>}
      {pinModal==='newPin'&&<NewPinModal title="Enter New PIN" onConfirm={pin=>{setNewPinBuffer(pin);setPinModal('confirmPin');}} onCancel={()=>setPinModal(null)}/>}
      {pinModal==='confirmPin'&&<NewPinModal title="Confirm New PIN" onConfirm={pin=>{
        if(pin===newPinBuffer){setState(prev=>({...prev,security:{...prev.security,parentPinHash:hashPin(pin)}}));writeAudit('pin_changed','Parent PIN changed','parent');showToast('✅ PIN changed!');}
        else showToast('❌ PINs did not match.');
        setPinModal(null);setNewPinBuffer('');
      }} onCancel={()=>setPinModal(null)}/>}
      {pinModal==='reset'&&<PinModal title="Confirm Reset" storedHash={state.security?.parentPinHash} onSuccess={doReset} onCancel={()=>setPinModal(null)}/>}
    </div>
  );
}

function NewPinModal({title,onConfirm,onCancel}){
  const [digits,setDigits]=useState('');
  function press(d){if(digits.length>=4)return;const next=digits+d;setDigits(next);if(next.length===4)setTimeout(()=>onConfirm(next),80);}
  function backspace(){setDigits(d=>d.slice(0,-1));}
  const keys=['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return(<div className="modal-overlay" onClick={onCancel}><div className="modal" style={{maxWidth:320}} onClick={e=>e.stopPropagation()}>
    <div className="modal-title" style={{textAlign:'center'}}>🔒 {title}</div>
    <div className="pin-display">{[0,1,2,3].map(i=><div key={i} className={`pin-dot ${digits.length>i?'filled':''}`}/>)}</div>
    <div className="pin-pad">{keys.map((k,i)=>k===''?<div key={i}/>:k==='⌫'?<button key={i} className="pin-btn" onClick={backspace}>{k}</button>:<button key={i} className="pin-btn" onClick={()=>press(k)}>{k}</button>)}</div>
    <button className="btn btn-secondary btn-block" onClick={onCancel}>Cancel</button>
  </div></div>);
}
