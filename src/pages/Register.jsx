import React, { useState } from 'react'
import { register } from '../lib/auth.js'

export default function Register({ onGoLogin }) {
  const [householdName, setHouseholdName] = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]   = useState('')
  const [info, setInfo]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const data = await register(email, password, householdName.trim() || 'My Family')
      // Supabase returns identities: [] when the email already exists
      if (data.user?.identities?.length === 0) {
        setError('An account with this email already exists. Try signing in.')
      } else {
        setInfo('Account created! Check your email to confirm, then sign in.')
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🏠</div>
        <h1 className="auth-title">Create Your Workspace</h1>
        <p className="auth-subtitle">Family Home Hub — set up your household</p>

        {info ? (
          <div>
            <div className="alert alert-info">✅ {info}</div>
            <button className="btn btn-primary btn-full" onClick={onGoLogin}>
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Household Name <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="text" className="form-input"
                value={householdName} onChange={e => setHouseholdName(e.target.value)}
                placeholder="The Smith Family"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Your Email</label>
              <input
                type="email" className="form-input"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password" className="form-input"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters" required autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password" className="form-input"
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password" required autoComplete="new-password"
              />
            </div>

            <div className="alert alert-info" style={{ fontSize: '0.85rem', padding: '8px 12px', marginBottom: 16 }}>
              🔑 Default parent PIN is <strong>1234</strong> — change it in Settings after setup.
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create Household'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.9rem', color: 'var(--text-light)' }}>
              Already have an account?{' '}
              <button type="button" className="btn-link" onClick={onGoLogin}>Sign in</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
