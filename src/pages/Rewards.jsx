import React, { useState } from 'react';
import { useData } from '../utils/DataContext.jsx';
import { genId } from '../utils/storage.js';
import PinModal from '../components/PinModal.jsx';

const blankReward = () => ({ title: '', description: '', cost: { points: 0, money: 0, screenMinutes: 0, tokens: 0 } });

export default function Rewards() {
  const { state, setState, writeAudit, adjustBalance } = useData();
  const rewards = state.rewards ?? [];
  const requests = state.rewardRequests ?? [];
  const members = (state.members ?? []).filter(m => m.role !== 'Pet');
  const [tab, setTab] = useState('catalog');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankReward());
  const [pinAction, setPinAction] = useState(null);
  const [requestForm, setRequestForm] = useState({ rewardId: '', requestedBy: '' });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function openAdd() { setEditing(null); setForm(blankReward()); setShowForm(true); }
  function openEdit(r) { setEditing(r.id); setForm({ title: r.title, description: r.description || '', cost: { ...r.cost } }); setShowForm(true); }

  function save() {
    if (!form.title.trim()) return;
    if (editing) {
      setState(prev => ({ ...prev, rewards: prev.rewards.map(r => r.id === editing ? { ...r, ...form, title: form.title.trim() } : r) }));
      writeAudit('reward_edited', `Edited reward: ${form.title}`, 'parent');
    } else {
      const reward = { id: genId(), ...form, title: form.title.trim(), createdAt: new Date().toISOString() };
      setState(prev => ({ ...prev, rewards: [...prev.rewards, reward] }));
      writeAudit('reward_created', `Created reward: ${form.title}`, 'parent');
    }
    setShowForm(false);
  }

  function submitRequest() {
    if (!requestForm.rewardId || !requestForm.requestedBy) return;
    const req = { id: genId(), rewardId: requestForm.rewardId, requestedBy: requestForm.requestedBy, status: 'pending', requestedAt: new Date().toISOString() };
    setState(prev => ({ ...prev, rewardRequests: [...(prev.rewardRequests ?? []), req] }));
    writeAudit('reward_requested', 'Reward request submitted', requestForm.requestedBy);
    setShowRequestModal(false);
  }

  function approveRequest(reqId) {
    const req = requests.find(r => r.id === reqId);
    const reward = rewards.find(r => r.id === req?.rewardId);
    if (!req || !reward) return;
    const c = reward.cost ?? {};
    if (c.points) adjustBalance(req.requestedBy, 'points', -Number(c.points), `Reward: ${reward.title}`, 'parent');
    if (c.money) adjustBalance(req.requestedBy, 'money', -Number(c.money), `Reward: ${reward.title}`, 'parent');
    if (c.screenMinutes) adjustBalance(req.requestedBy, 'screenMinutes', -Number(c.screenMinutes), `Reward: ${reward.title}`, 'parent');
    if (c.tokens) adjustBalance(req.requestedBy, 'tokens', -Number(c.tokens), `Reward: ${reward.title}`, 'parent');
    setState(prev => ({ ...prev, rewardRequests: prev.rewardRequests.map(r => r.id === reqId ? { ...r, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: 'parent' } : r) }));
    writeAudit('reward_approved', `Approved reward: ${reward.title}`, 'parent');
    setPinAction(null);
  }

  function denyRequest(reqId) {
    const req = requests.find(r => r.id === reqId);
    const reward = rewards.find(r => r.id === req?.rewardId);
    setState(prev => ({ ...prev, rewardRequests: prev.rewardRequests.map(r => r.id === reqId ? { ...r, status: 'denied', reviewedAt: new Date().toISOString() } : r) }));
    writeAudit('reward_denied', `Denied reward: ${reward?.title}`, 'parent');
    setPinAction(null);
  }

  function deleteReward() {
    const r = rewards.find(x => x.id === confirmDelete);
    setState(prev => ({ ...prev, rewards: prev.rewards.filter(x => x.id !== confirmDelete) }));
    writeAudit('reward_deleted', `Deleted reward: ${r?.title}`, 'parent');
    setConfirmDelete(null); setPinAction(null);
  }

  const pendingReqs = requests.filter(r => r.status === 'pending');

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">🎁 Rewards</h1><p className="page-subtitle">Create rewards and manage redemption requests</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Reward</button>
      </div>
      <div className="tabs">
        <button className={`tab-btn ${tab === 'catalog' ? 'active' : ''}`} onClick={() => setTab('catalog')}>Catalog ({rewards.length})</button>
        <button className={`tab-btn ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>Requests {pendingReqs.length > 0 && <span className="badge badge-orange" style={{ marginLeft: 4 }}>{pendingReqs.length}</span>}</button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
      </div>
      {tab === 'catalog' && (
        <>
          {rewards.length === 0 && <div className="empty-state card"><div className="empty-icon">🎁</div><h3>No rewards yet</h3><p>Add rewards to your catalog. Family members can request them using their earned points.</p><button className="btn btn-primary" onClick={openAdd}>+ Add First Reward</button></div>}
          <ul className="item-list">
            {rewards.map(r => (
              <li key={r.id} className="list-item" style={{ flexWrap: 'wrap' }}>
                <div className="list-item-avatar">🎁</div>
                <div className="list-item-content">
                  <div className="list-item-title">{r.title}</div>
                  {r.description && <div className="list-item-sub">{r.description}</div>}
                  <div className="reward-chips" style={{ marginTop: 6 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>Cost:</span>
                    {r.cost?.points > 0 && <span className="chip chip-gold">⭐ {r.cost.points}</span>}
                    {r.cost?.money > 0 && <span className="chip chip-green">💰 ${r.cost.money}</span>}
                    {r.cost?.screenMinutes > 0 && <span className="chip chip-blue">📺 {r.cost.screenMinutes}m</span>}
                    {r.cost?.tokens > 0 && <span className="chip chip-purple">🪙 {r.cost.tokens}</span>}
                  </div>
                </div>
                <div className="list-item-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => { setRequestForm({ rewardId: r.id, requestedBy: '' }); setShowRequestModal(true); }}>Request</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setPinAction({ type: 'delete', id: r.id })}>🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {tab === 'requests' && (
        <>
          {pendingReqs.length === 0 && <div className="empty-state card"><div className="empty-icon">📬</div><h3>No pending requests</h3><p>When family members request rewards, they'll appear here for approval.</p></div>}
          <ul className="item-list">
            {pendingReqs.map(req => {
              const reward = rewards.find(r => r.id === req.rewardId);
              const member = members.find(m => m.id === req.requestedBy);
              return (
                <li key={req.id} className="list-item" style={{ flexWrap: 'wrap' }}>
                  <div className="list-item-avatar">🎁</div>
                  <div className="list-item-content">
                    <div className="list-item-title">{reward?.title ?? 'Unknown Reward'}</div>
                    <div className="list-item-sub">Requested by {member?.name ?? 'Unknown'} · {new Date(req.requestedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="list-item-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => setPinAction({ type: 'approve', id: req.id })}>✅ Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setPinAction({ type: 'deny', id: req.id })}>✗ Deny</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {tab === 'history' && (
        <>
          {requests.filter(r => r.status !== 'pending').length === 0 && <div className="empty-state card"><div className="empty-icon">📋</div><h3>No history yet</h3><p>Approved and denied requests will appear here.</p></div>}
          <ul className="item-list">
            {requests.filter(r => r.status !== 'pending').map(req => {
              const reward = rewards.find(r => r.id === req.rewardId);
              const member = members.find(m => m.id === req.requestedBy);
              return (
                <li key={req.id} className="list-item">
                  <div className="list-item-avatar">{req.status === 'approved' ? '✅' : '✗'}</div>
                  <div className="list-item-content">
                    <div className="list-item-title">{reward?.title ?? 'Deleted Reward'}</div>
                    <div className="list-item-sub">{member?.name} · {new Date(req.requestedAt).toLocaleDateString()}</div>
                  </div>
                  <div>{req.status === 'approved' ? <span className="badge badge-green">Approved</span> : <span className="badge badge-red">Denied</span>}</div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editing ? '✏️ Edit Reward' : '➕ Add Reward'}</div>
            <div className="form-group"><label className="form-label">Reward Title *</label><input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus /></div>
            <div className="form-group"><label className="form-label">Description (optional)</label><textarea className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="section-header"><span className="section-title">💸 Cost</span></div>
            <div className="form-row">
              {[['points','⭐ Points'],['money','💰 Money ($)'],['screenMinutes','📺 Screen Min'],['tokens','🪙 Tokens']].map(([key, label]) => (
                <div key={key} className="form-group"><label className="form-label">{label}</label><input type="number" min="0" className="form-control" value={form.cost[key]} onChange={e => setForm(f => ({ ...f, cost: { ...f.cost, [key]: Number(e.target.value) } }))} /></div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.title.trim()}>{editing ? 'Save' : 'Add Reward'}</button>
            </div>
          </div>
        </div>
      )}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📬 Request Reward</div>
            <div className="form-group"><label className="form-label">Who is requesting?</label>
              <select className="form-control" value={requestForm.requestedBy} onChange={e => setRequestForm(f => ({ ...f, requestedBy: e.target.value }))}>
                <option value="">— Select member —</option>{members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}</select></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitRequest} disabled={!requestForm.requestedBy}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
      {pinAction && (
        <PinModal
          title={pinAction.type === 'approve' ? 'Approve Reward' : pinAction.type === 'deny' ? 'Deny Request' : 'Delete Reward'}
          storedHash={state.security?.parentPinHash}
          onSuccess={() => {
            if (pinAction.type === 'approve') approveRequest(pinAction.id);
            else if (pinAction.type === 'deny') denyRequest(pinAction.id);
            else if (pinAction.type === 'delete') { setConfirmDelete(pinAction.id); setPinAction(null); }
          }}
          onCancel={() => setPinAction(null)}
        />
      )}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🗑️ Delete Reward?</div>
            <p>Delete <strong>{rewards.find(r => r.id === confirmDelete)?.title}</strong>?</p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={deleteReward}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
