import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { DataProvider } from './utils/DataContext.jsx'
import Navigation from './components/Navigation.jsx'
import Login    from './pages/Login.jsx'
import Register from './pages/Register.jsx'

import Dashboard    from './pages/Dashboard.jsx'
import Family       from './pages/Family.jsx'
import Chores       from './pages/Chores.jsx'
import Rewards      from './pages/Rewards.jsx'
import Economy      from './pages/Economy.jsx'
import Routines     from './pages/Routines.jsx'
import Calendar     from './pages/Calendar.jsx'
import Meals        from './pages/Meals.jsx'
import Education    from './pages/Education.jsx'
import Communication from './pages/Communication.jsx'
import Settings     from './pages/Settings.jsx'
import Audit        from './pages/Audit.jsx'

/** Inner app — has access to AuthContext */
function AppInner() {
  const { isAuthenticated, loading, user } = useAuth()
  const [active, setActive]   = useState('dashboard')
  const [authPage, setAuthPage] = useState('login') // 'login' | 'register'

  // ─── Loading splash ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: 16,
        background: 'var(--bg-main, #f0f4f0)',
      }}>
        <div style={{ fontSize: '3.5rem' }}>🏠</div>
        <p style={{ color: 'var(--text-light, #6b7c6b)', margin: 0 }}>
          Loading Family Home Hub…
        </p>
      </div>
    )
  }

  // ─── Not authenticated ─────────────────────────────────────────────────────────
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

  // ─── Authenticated — render the main app ──────────────────────────────────────────────
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

/** Root component — wraps everything in AuthProvider */
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
