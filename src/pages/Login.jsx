import React, { useState } from 'react'
import { signInWithPassword, signInWithMagicLink, resetPassword } from '../lib/auth.js'

export default function Login({ onLogin, onGoRegister }) {
  const [mode, setMode]     = useState('password') // 'password' | 'magic' | 'forgot'
  const [email, setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]   = useState('')
  const [info, setInfo]     = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(m) {
    setMode(m)
    setError('')
    setInfo('')
  }

  async function handlePassword(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithPassword(email, password)
      onLogin?.()
    } catch (err) {
      setError(err.message || 'Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithMagicLink(email)
      setInfo('Check your email — a login link is on its way!')
    } catch (err) {
      setError(err.message || 'Failed to send magic link.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setInfo('Password reset email sent. Check your inbox.')
    } catch (err) {
      setError(err.message || 'Could not send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🏠</div>
        <h1 className="auth-title">Family Home Hub</h1>
        <p className="auth-subtitle">Sign in to your family workspace</p>

        {mode !== 'forgot' && (
          <div className="tab-bar">
            <button
              className={`tab-btn${mode === 'password' ? ' active' : ''}`}
              onClick={() => switchMode('password')}
            >
              Password
            </button>
            <button
              className={`tab-btn${mode === 'magic' ? ' active' : ''}`}
              onClick={() => switchMode('magic')}
            >
              Magic Link
            </button>
          </div>
        )}

        {mode === 'password' && (
          <form onSubmit={handlePassword}>
            <div className="form-group">
              <label className="form-label">Email</label>
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
                placeholder="••••••••" required autoComplete="current-password"
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button type="button" className="btn-link" onClick={() => switchMode('forgot')}>
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {mode === 'magic' && (
          <form onSubmit={handleMagicLink}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email" className="form-input"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {info  && <div className="alert alert-info">✉️ {info}</div>}
            <button
              type="submit" className="btn btn-primary btn-full"
              disabled={loading || !!info}
            >
              {loading ? 'Sending…' : 'Send Magic Link'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot}>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: 16 }}>
              Enter your email and we’ll send a reset link.
            </p>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email" className="form-input"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {info  && <div className="alert alert-info">✉️ {info}</div>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || !!info}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <button
              type="button" className="btn btn-secondary btn-full"
              style={{ marginTop: 8 }} onClick={() => switchMode('password')}
            >
              ← Back to Login
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--text-light)' }}>
          Don’t have an account?{' '}
          <button className="btn-link" onClick={onGoRegister}>Create one</button>
        </div>
      </div>
    </div>
  )
}
