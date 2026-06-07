import React, { useState } from 'react';
import { hashPin } from '../utils/storage.js';

/**
 * PIN entry modal with a numeric keypad.
 */
export default function PinModal({ title = 'Enter Parent PIN', storedHash, onSuccess, onCancel }) {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');

  function press(d) {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    setError('');
    if (next.length === 4) {
      setTimeout(() => check(next), 80);
    }
  }

  function check(pin) {
    if (hashPin(pin) === storedHash) {
      onSuccess();
    } else {
      setError('Incorrect PIN. Try again.');
      setDigits('');
    }
  }

  function backspace() {
    setDigits(d => d.slice(0, -1));
    setError('');
  }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 320 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title" style={{ textAlign: 'center' }}>🔒 {title}</div>
        <div className="pin-display">
          {[0,1,2,3].map(i => (
            <div key={i} className={`pin-dot ${digits.length > i ? 'filled' : ''}`} />
          ))}
        </div>
        {error && (
          <div className="alert alert-danger" style={{ textAlign: 'center', marginBottom: 8 }}>
            {error}
          </div>
        )}
        <div className="pin-pad">
          {keys.map((k, i) => (
            k === '' ? (
              <div key={i} />
            ) : k === '⌫' ? (
              <button key={i} className="pin-btn" onClick={backspace}>{k}</button>
            ) : (
              <button key={i} className="pin-btn" onClick={() => press(k)}>{k}</button>
            )
          ))}
        </div>
        <button className="btn btn-secondary btn-block" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
