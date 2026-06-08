import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { DataProvider } from './utils/DataContext.jsx'
import Navigation   from './components/Navigation.jsx'
import Login        from './pages/Login.jsx'
import Register     from './pages/Register.jsx'
import Onboarding  from './pages/Onboarding.jsx'

import Dashboard     from './pages/Dashboard.jsx'
import Family        from './pages/Family.jsx'
import Chores        from './pages/Chores.jsx'
import Rewards       from './pages/Rewards.jsx'
import Economy       from './pages/Economy.jsx'
import Routines      from './pages/Routines.jsx'
import Calendar      from './pages/Calendar.jsx'
import Meals         from './pages/Meals.jsx'
import Education     from './pages/Education.jsx'
import Communication from './pages/Communication.jsx'
import Settings      from './pages/Settings.jsx'
import Audit         from './pages/Audit.jsx'

// ── App not available (env vars missing — operator problem, not user problem) ──
function AppNotAvailable() {
  return (
    <div style={{
      minHeight: '100vh', background: '#f0f4f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏠</div>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#2d5a2d', marginBottom: 8 }}>Family Home Hub</h1>
        <p style={{ color: '#6b7c6b', fontSize: '0.95rem', margin: '0 0 6px' }}>
          This app is not available right now.
        </p>
        <p style={{ color: '#9aaa9a', fontSize: '0.85rem', margin: 0 }}>Please try again later.</p>
      </div>
    </div>
  )
}

// ── Inner app (has access to AuthContext) ───────────────────────────────

function AppInner() {
  const { isAuthenticated, loading, user, isSupabaseConfigured } = useAuth()
  const [active,    setActive]    = useState('dashboard')
  const [authPage,  setAuthPage]  = useState('login')  // 'login' | 'register'

  // Track whether first-time setup has been completed…
  const [setupDone, setSetupDone] = useState(
    () => Boolean(window.localStorage.getItem('fhh_setup_complete'))
  )

  // Called from Onboarding’s “Sign in” link or email-confirmation state
  function handleGoToLogin() {
    window.localStorage.setItem('fhh_setup_complete', '1')
    setSetupDone(true)
  }

  // ── Env vars missing — show minimal message, no tech details ────────────
  if (!isSupabaseConfigured) return <AppNotAvailable />

  // ── Waiting for Supabase session check ─────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: 16,
        background: 'var(--bg-main, #f0f4f0)',
      }}>
        <div style={{ fontSize: '3.5rem' }}>🏠</div>
        <p style={{ color: 'var(--text-light, #6b7c6b)', margin: 0 }}>Loading Family Home Hub…</p>
      </div>
    )
  }

  // ── Not authenticated ─────────────────────────────────────────────
  if (!isAuthenticated) {
    // New user — show friendly onboarding wizard
    if (!setupDone) {
      return <Onboarding onGoToLogin={handleGoToLogin} />
    }
    // Returning user — show login / register
    if (authPage === 'register') {
      return <Register onGoLogin={() => setAuthPage('login')} />
    }
    return (
      <Login
        onLogin={() => setActive('dashboard')}
        onGoRegister={() => setAuthPage('register')}
      />
    )
  }

  // ── Authenticated — render main app ───────────────────────────────
  const renderPage = () => {
    switch (active) {
      case 'dashboard':     return <Dashboard setActive={setActive} />
      case 'family':        return <Family />
      case 'chores':        return <Chores />
      case 'rewards':       return <Rewards />
      case 'economy':       return <Economy />
      case 'routines':      return <Routines />
      case 'calendar':      return <Calendar />
      case 'meals':         return <Meals />
      case 'education':     return <Education />
      case 'communication': return <Communication />
      case 'settings':      return <Settings setActive={setActive} />
      case 'audit':         return <Audit />
      default:              return <Dashboard setActive={setActive} />
    }
  }

  return (
    <DataProvider user={user}>
      <Navigation active={active} setActive={setActive} />
      <main className="content" id="main-content">
        {renderPage()}
      </main>
    </DataProvider>
  )
}

// ── Root ──────────────────────────────────────────────────────
export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>
}
