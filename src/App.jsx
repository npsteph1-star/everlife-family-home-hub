import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { DataProvider } from './utils/DataContext.jsx'
import Navigation from './components/Navigation.jsx'
import Login    from './pages/Login.jsx'
import Register from './pages/Register.jsx'

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

// ── Setup Required screen ─────────────────────────────────────────
function SetupRequired() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main, #f0f4f0)',
      padding: 24,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '40px 36px',
        maxWidth: 540,
        width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        fontFamily: 'inherit',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 12, textAlign: 'center' }}>🏠</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6, textAlign: 'center', color: '#2d5a2d' }}>
          Family Home Hub
        </h1>
        <p style={{ textAlign: 'center', color: '#6b7c6b', marginBottom: 28 }}>
          One-time setup required before the app can start.
        </p>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#333' }}>1️⃣&nbsp; Create a Supabase project</div>
          <p style={{ fontSize: '0.9rem', color: '#555', margin: '0 0 6px 0' }}>
            Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2d5a2d' }}>supabase.com</a>,
            create a free project, and run <code style={codeStyle}>supabase/schema.sql</code> in the SQL editor.
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#333' }}>2️⃣&nbsp; Add environment variables</div>
          <p style={{ fontSize: '0.9rem', color: '#555', margin: '0 0 8px 0' }}>
            <strong>Local dev:</strong> copy <code style={codeStyle}>.env.example</code> to <code style={codeStyle}>.env.local</code> and fill in:
          </p>
          <pre style={preStyle}>
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
          </pre>
          <p style={{ fontSize: '0.9rem', color: '#555', margin: '8px 0 0' }}>
            <strong>Vercel:</strong> add those same two variables in your project&rsquo;s
            Settings &rarr; Environment Variables, then redeploy.
          </p>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#333' }}>3️⃣&nbsp; Set auth redirect URL</div>
          <p style={{ fontSize: '0.9rem', color: '#555', margin: 0 }}>
            In Supabase &rarr; Authentication &rarr; URL Configuration, set
            <strong> Site URL</strong> to your domain and add it to
            <strong> Redirect URLs</strong>.
          </p>
        </div>

        <div style={{
          background: '#f0f4f0',
          borderRadius: 10,
          padding: '12px 16px',
          fontSize: '0.85rem',
          color: '#4a6b4a',
        }}>
          📚 Full instructions are in <code style={{ ...codeStyle, fontSize: '0.83rem' }}>README.md</code> in the repository.
        </div>
      </div>
    </div>
  )
}

const codeStyle = {
  background: 'rgba(0,0,0,0.07)',
  borderRadius: 4,
  padding: '1px 5px',
  fontFamily: 'monospace',
  fontSize: '0.88em',
}
const preStyle = {
  background: '#1e1e1e',
  color: '#d4d4d4',
  borderRadius: 8,
  padding: '12px 14px',
  fontSize: '0.82rem',
  overflowX: 'auto',
  margin: 0,
  lineHeight: 1.6,
}

// ── Inner app — has access to AuthContext ──────────────────────────
function AppInner() {
  const { isAuthenticated, loading, user, isSupabaseConfigured } = useAuth()
  const [active, setActive]   = useState('dashboard')
  const [authPage, setAuthPage] = useState('login') // 'login' | 'register'

  // ── Loading splash (waiting for Supabase session check) ────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 16,
        background: 'var(--bg-main, #f0f4f0)',
      }}>
        <div style={{ fontSize: '3.5rem' }}>🏠</div>
        <p style={{ color: 'var(--text-light, #6b7c6b)', margin: 0 }}>
          Loading Family Home Hub…
        </p>
      </div>
    )
  }

  // ── Supabase not configured — show setup guide ──────────────────────
  if (!isSupabaseConfigured) {
    return <SetupRequired />
  }

  // ── Not authenticated — show Login / Register ───────────────────────
  if (!isAuthenticated) {
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

  // ── Authenticated — render the main app ────────────────────────────
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

// ── Root ─────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
