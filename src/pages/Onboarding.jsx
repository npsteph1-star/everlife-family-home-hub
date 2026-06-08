/**
 * Family Home Hub — Onboarding Wizard
 *
 * 6-step first-run setup. Does NOT mention Supabase, SQL, env vars,
 * Vercel, OAuth, or any technical infrastructure.
 */
import React, { useState, useEffect } from 'react'
import { register } from '../lib/auth.js'
import { hashPin, genId } from '../utils/storage.js'

// ── Config ────────────────────────────────────────────────────────

const MODULES = [
  { key: 'chores',    icon: '✅', title: 'Chores & Tasks',    desc: 'Assign and track household chores',     on: true  },
  { key: 'rewards',   icon: '🎁', title: 'Rewards & Economy', desc: 'Points, allowances, and reward system',  on: true  },
  { key: 'calendar',  icon: '📅', title: 'Calendar',          desc: 'Family events and appointments',        on: true  },
  { key: 'education', icon: '📚', title: 'Education',         desc: 'Reading logs, goals, and assignments',  on: true  },
  { key: 'meals',     icon: '🍽️', title: 'Meal Planning',     desc: 'Weekly meals and grocery lists',        on: true  },
  { key: 'faith',     icon: '✝️', title: 'Faith Mode',        desc: 'Prayer, devotionals, and faith routines', on: false },
  { key: 'baby',      icon: '🍼', title: 'Baby & Pregnancy',  desc: 'Feedings, sleep logs, and more',        on: false },
  { key: 'pets',      icon: '🐾', title: 'Pet Care',          desc: 'Feeding, vet visits, and medications',  on: false },
]

const ROLES = ['Parent', 'Child', 'Toddler', 'Pet']
const ROLE_EMOJI = { Parent: '👤', Child: '🧒', Toddler: '👶', Pet: '🐾' }
const PIN_KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

// ── Colours (matching app CSS vars) ────────────────────────────────────

const G  = '#2d5a2d'   // green-dark
const GM = '#4a7c59'   // green-mid
const GL = '#6b7c6b'   // text-light
const GB = '#cdd8cd'   // border

// ── Tiny shared primitives ───────────────────────────────────────────

function PrimaryBtn({ children, onClick, disabled, full }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        padding: '13px 20px', borderRadius: 12, border: 'none',
        background: disabled ? '#a8c4a8' : G, color: '#fff',
        fontSize: '0.97rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', width: full ? '100%' : undefined,
      }}
    >
      {children}
    </button>
  )
}

function SecondaryBtn({ children, onClick, full }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '13px 20px', borderRadius: 12, border: `1.5px solid ${GB}`,
        background: '#fff', color: '#444',
        fontSize: '0.97rem', fontWeight: 500, cursor: 'pointer',
        fontFamily: 'inherit', width: full ? '100%' : undefined,
      }}
    >
      {children}
    </button>
  )
}

function ErrMsg({ msg }) {
  if (!msg || msg === 'already-exists') return null
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
      padding: '10px 14px', fontSize: '0.88rem', color: '#b91c1c', marginBottom: 16,
    }}>
      {msg}
    </div>
  )
}

function StepHdr({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: G, marginBottom: 5 }}>{title}</div>
      {sub && <div style={{ fontSize: '0.9rem', color: GL, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  )
}

function TextInput({ label, type, value, onChange, placeholder, autoFocus, onKeyDown }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: '#444', marginBottom: 5 }}>{label}</label>}
      <input
        type={type || 'text'} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoFocus={autoFocus}
        onKeyDown={onKeyDown}
        style={{
          width: '100%', padding: '11px 12px', borderRadius: 10,
          border: `1.5px solid ${GB}`, fontSize: '1rem',
          outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

function Toggle({ on, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 46, height: 26, borderRadius: 13, position: 'relative',
        background: on ? G : '#cdd8cd', transition: 'background 0.2s',
        cursor: 'pointer', flexShrink: 0,
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, left: on ? 23 : 3,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

// ── Step 1: Family Name ───────────────────────────────────────────

function Step1({ familyName, setFamilyName, onNext }) {
  const ok = familyName.trim().length >= 2
  return (
    <>
      <StepHdr icon="🏠" title="Welcome to Family Home Hub!" sub="Let’s get your family set up. It only takes a few minutes." />
      <TextInput
        label="Family Name"
        value={familyName}
        onChange={setFamilyName}
        placeholder="e.g. The Johnson Family"
        autoFocus
        onKeyDown={e => e.key === 'Enter' && ok && onNext()}
      />
      <p style={{ fontSize: '0.82rem', color: '#9aaa9a', marginBottom: 20, marginTop: -8 }}>
        This is how your home hub will greet your family.
      </p>
      <PrimaryBtn onClick={onNext} disabled={!ok} full>Continue →</PrimaryBtn>
    </>
  )
}

// ── Step 2: Parent Account ─────────────────────────────────────────

function Step2({ email, setEmail, password, setPassword, confirmPw, setConfirmPw,
                 showPw, setShowPw, error, onNext, onPrev }) {
  return (
    <>
      <StepHdr icon="👤" title="Create Your Account" sub="You’ll use this email and password to sign in and manage your family." />
      <ErrMsg msg={error} />
      <TextInput label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoFocus />
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: '#444', marginBottom: 5 }}>Password</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            style={{ width: '100%', padding: '11px 42px 11px 12px', borderRadius: 10, border: `1.5px solid ${GB}`, fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          <button onClick={() => setShowPw(v => !v)} tabIndex={-1}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: GL, padding: 2 }}>
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>
      </div>
      <TextInput label="Confirm Password" type={showPw ? 'text' : 'password'} value={confirmPw} onChange={setConfirmPw} placeholder="Enter password again" />
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <SecondaryBtn onClick={onPrev}>← Back</SecondaryBtn>
        <PrimaryBtn onClick={onNext} full>Continue →</PrimaryBtn>
      </div>
    </>
  )
}

// ── Step 3: Parent PIN ─────────────────────────────────────────────

function Step3({ pinDigits, pressPin, onPrev }) {
  return (
    <>
      <StepHdr
        icon="🔒"
        title="Set Your Parent PIN"
        sub="A 4-digit PIN protects settings, approvals, and admin actions. You can change it anytime."
      />
      {/* PIN dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 22, height: 22, borderRadius: '50%',
            background: pinDigits.length > i ? G : '#e8f0e8',
            border: `2.5px solid ${pinDigits.length > i ? G : GB}`,
            transition: 'all 0.1s',
          }} />
        ))}
      </div>
      {/* Keypad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 240, margin: '0 auto 24px' }}>
        {PIN_KEYS.map((k, i) => (
          k === '' ? <div key={i} /> :
          <button key={i} onClick={() => pressPin(k)} style={{
            padding: '16px 0', borderRadius: 12, border: `1.5px solid #e0e8e0`,
            background: '#fff', fontSize: '1.3rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', color: G,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            {k}
          </button>
        ))}
      </div>
      <SecondaryBtn onClick={onPrev} full>← Back</SecondaryBtn>
    </>
  )
}

// ── Step 4: Family Members ──────────────────────────────────────────

function Step4({ members, showAdd, setShowAdd, memberName, setMemberName,
                 memberRole, setMemberRole, doAddMember, removeMember, onNext, onPrev }) {
  return (
    <>
      <StepHdr icon="👨‍👩‍👧‍👦" title="Add Family Members" sub="Who’s in your family? You can always add or change members later." />

      {/* Member list */}
      {members.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {members.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', background: '#f7fbf7', borderRadius: 10, marginBottom: 6,
              border: `1px solid #e0ece0`,
            }}>
              <span style={{ fontWeight: 600 }}>{ROLE_EMOJI[m.role]} {m.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.82rem', color: GL, background: '#e8f0e8', borderRadius: 6, padding: '2px 8px' }}>{m.role}</span>
                <button onClick={() => removeMember(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', fontSize: '1rem', padding: 2 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add member inline form */}
      {showAdd ? (
        <div style={{ background: '#f7fbf7', borderRadius: 12, padding: '16px', marginBottom: 14, border: `1px solid #e0ece0` }}>
          <TextInput label="Name" value={memberName} onChange={setMemberName} placeholder="Family member’s name" autoFocus />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: '#444', marginBottom: 5 }}>Role</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ROLES.map(r => (
                <button key={r} onClick={() => setMemberRole(r)} style={{
                  padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${memberRole === r ? G : GB}`,
                  background: memberRole === r ? '#f0f7f0' : '#fff',
                  color: memberRole === r ? G : '#555', fontWeight: memberRole === r ? 600 : 400,
                  cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'inherit',
                }}>
                  {ROLE_EMOJI[r]} {r}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <SecondaryBtn onClick={() => setShowAdd(false)}>Cancel</SecondaryBtn>
            <PrimaryBtn onClick={doAddMember} disabled={!memberName.trim()} full>Add Member</PrimaryBtn>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} style={{
          width: '100%', padding: '12px', borderRadius: 12,
          border: `1.5px dashed ${GM}`, background: '#f7fbf7',
          color: GM, fontSize: '0.95rem', fontWeight: 600,
          cursor: 'pointer', marginBottom: 20, fontFamily: 'inherit',
        }}>
          + Add a Family Member
        </button>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <SecondaryBtn onClick={onPrev}>← Back</SecondaryBtn>
        <PrimaryBtn onClick={onNext} full>
          {members.length === 0 ? 'Skip for Now →' : 'Continue →'}
        </PrimaryBtn>
      </div>
    </>
  )
}

// ── Step 5: Feature Modules ──────────────────────────────────────────

function Step5({ modules, toggleModule, onNext, onPrev }) {
  return (
    <>
      <StepHdr icon="🧩" title="Choose Your Features" sub="Pick what your family needs. You can turn features on or off anytime in Settings." />
      <div style={{ marginBottom: 20 }}>
        {MODULES.map(m => (
          <div key={m.key}
            onClick={() => toggleModule(m.key)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 12, marginBottom: 8, cursor: 'pointer',
              border: `1.5px solid ${modules[m.key] ? GM : GB}`,
              background: modules[m.key] ? '#f0f7f0' : '#fff',
              transition: 'border 0.15s, background 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.3rem' }}>{m.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: modules[m.key] ? G : '#444' }}>{m.title}</div>
                <div style={{ fontSize: '0.78rem', color: GL }}>{m.desc}</div>
              </div>
            </div>
            <Toggle on={modules[m.key]} onToggle={() => toggleModule(m.key)} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <SecondaryBtn onClick={onPrev}>← Back</SecondaryBtn>
        <PrimaryBtn onClick={onNext} full>Continue →</PrimaryBtn>
      </div>
    </>
  )
}

// ── Step 6: Finish ────────────────────────────────────────────────

function Step6({ finishStatus, error, familyName, moduleCount, memberCount, onFinish, onPrev, onGoToLogin }) {
  const enabledModules = MODULES.filter(m => moduleCount > 0) // just for display

  // Idle: show summary + launch button
  if (finishStatus === 'idle') {
    return (
      <>
        <StepHdr icon="🎉" title="You're all set!" sub="Here’s a summary of your setup. Hit the button below to create your family hub." />

        <div style={{ background: '#f7fbf7', borderRadius: 14, padding: '16px 18px', marginBottom: 24 }}>
          {[
            ['🏠', 'Family', familyName || '—'],
            ['📅', 'Features enabled', `${moduleCount} of ${MODULES.length}`],
            ['👨‍👩‍👧', 'Members added', memberCount === 0 ? 'None — add later in app' : String(memberCount)],
            ['🔒', 'Parent PIN', 'Set'],
          ].map(([icon, label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e8f0e8' }}>
              <span style={{ color: GL, fontSize: '0.9rem' }}>{icon} {label}</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: G }}>{val}</span>
            </div>
          ))}
        </div>

        <PrimaryBtn onClick={onFinish} full>Create My Family Hub 🏠</PrimaryBtn>
        <div style={{ marginTop: 12 }}>
          <SecondaryBtn onClick={onPrev} full>← Back</SecondaryBtn>
        </div>
      </>
    )
  }

  // Working
  if (finishStatus === 'working') {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>
          <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚙️</span>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontWeight: 700, fontSize: '1.2rem', color: G, marginBottom: 8 }}>Setting up your family hub…</div>
        <div style={{ color: GL, fontSize: '0.9rem' }}>Creating your account and saving your preferences.</div>
      </div>
    )
  }

  // Done — auto-redirects via AuthContext; show a cheerful message
  if (finishStatus === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
        <div style={{ fontWeight: 700, fontSize: '1.3rem', color: G, marginBottom: 8 }}>Welcome to Family Home Hub!</div>
        <div style={{ color: GL, fontSize: '0.9rem' }}>Taking you to your dashboard…</div>
      </div>
    )
  }

  // Email confirmation required
  if (finishStatus === 'email') {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📧</div>
        <div style={{ fontWeight: 700, fontSize: '1.2rem', color: G, marginBottom: 10 }}>Check your email</div>
        <p style={{ color: GL, fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 24 }}>
          We sent a confirmation link to <strong>your email</strong>.<br />
          Click the link to activate your account, then sign in here.
        </p>
        <PrimaryBtn onClick={onGoToLogin} full>Sign In →</PrimaryBtn>
      </div>
    )
  }

  // Error: already-exists
  if (finishStatus === 'error' && error === 'already-exists') {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👤</div>
        <div style={{ fontWeight: 700, fontSize: '1.2rem', color: G, marginBottom: 10 }}>Account already exists</div>
        <p style={{ color: GL, fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 20 }}>
          That email is already registered. Would you like to sign in instead?
        </p>
        <PrimaryBtn onClick={onGoToLogin} full>Sign In →</PrimaryBtn>
        <div style={{ marginTop: 10 }}>
          <SecondaryBtn onClick={() => { window.location.reload() }} full>Try a Different Email</SecondaryBtn>
        </div>
      </div>
    )
  }

  // Error: generic
  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
      <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#b91c1c', marginBottom: 10 }}>Something went wrong</div>
      <p style={{ color: GL, fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 20 }}>
        {error || 'Please check your connection and try again.'}
      </p>
      <PrimaryBtn onClick={() => { window.location.reload() }} full>Try Again</PrimaryBtn>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────

export default function Onboarding({ onGoToLogin }) {
  const TOTAL = 6
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

  // Step state
  const [familyName,  setFamilyName]  = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirmPw,   setConfirmPw]   = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [pinDigits,   setPinDigits]   = useState('')
  const [members,     setMembers]     = useState([])
  const [showAdd,     setShowAdd]     = useState(false)
  const [memberName,  setMemberName]  = useState('')
  const [memberRole,  setMemberRole]  = useState('Child')
  const [modules,     setModules]     = useState(
    () => Object.fromEntries(MODULES.map(m => [m.key, m.on]))
  )
  const [finishStatus, setFinishStatus] = useState('idle')

  function goNext() { setError(''); setStep(s => s + 1) }
  function goPrev() { setError(''); setStep(s => s - 1) }

  // Step 2 validation before advancing
  function tryStep2() {
    if (!/\S+@\S+\.\S+/.test(email))    { setError('Please enter a valid email address.'); return }
    if (password.length < 6)             { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPw)          { setError('Passwords do not match.'); return }
    goNext()
  }

  // PIN keypad
  function pressPin(k) {
    if (k === '⌫') { setPinDigits(d => d.slice(0, -1)); return }
    if (pinDigits.length >= 4) return
    setPinDigits(p => p + k)
  }
  // Auto-advance at 4 digits
  useEffect(() => {
    if (step === 3 && pinDigits.length === 4) {
      const t = setTimeout(goNext, 380)
      return () => clearTimeout(t)
    }
  }, [step, pinDigits]) // eslint-disable-line react-hooks/exhaustive-deps

  // Add member
  function doAddMember() {
    if (!memberName.trim()) return
    setMembers(prev => [...prev, { id: genId(), name: memberName.trim(), role: memberRole }])
    setMemberName(''); setMemberRole('Child'); setShowAdd(false)
  }

  // Toggle module
  function toggleModule(key) { setModules(m => ({ ...m, [key]: !m[key] })) }

  // Finish
  async function finish() {
    setFinishStatus('working'); setError('')
    try {
      const data = await register(email.trim().toLowerCase(), password, familyName.trim())

      // Stage setup data — DataContext picks this up on its first mount
      window.localStorage.setItem('fhh_onboarding_staged', JSON.stringify({
        settings: {
          workspaceName:        familyName.trim(),
          faithEnabled:         modules.faith,
          babyModeEnabled:      modules.baby,
          pregnancyModeEnabled: false,
          petsEnabled:          modules.pets,
          allowanceMode:        'both',
          toddlerMode:          false,
          aiProvider:           'none',
          alexaEnabled:         false,
        },
        security: {
          parentPinHash:  hashPin(pinDigits),
          childPinHash:   null,
          failedAttempts: 0,
        },
        members,
      }))
      window.localStorage.setItem('fhh_setup_complete', '1')

      if (data?.user && !data?.session) {
        setFinishStatus('email') // email confirmation required
      } else {
        setFinishStatus('done')  // auto-redirect via AuthContext
      }
    } catch (err) {
      const msg = (err?.message ?? '').toLowerCase()
      if (msg.includes('already registered') || msg.includes('already in use') || msg.includes('user already')) {
        setError('already-exists')
      } else {
        setError(err?.message || 'Something went wrong. Please try again.')
      }
      setFinishStatus('error')
    }
  }

  const moduleCount = Object.values(modules).filter(Boolean).length

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-main, #f0f4f0)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '28px 16px 56px',
    }}>
      {/* Logo */}
      <div style={{ fontSize: '2.2rem', marginBottom: 2 }}>🏠</div>
      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: G, marginBottom: 24 }}>Family Home Hub</div>

      {/* Progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, width: '100%', maxWidth: 420 }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <React.Fragment key={i}>
            <div style={{
              width: step > i + 1 ? 12 : 10, height: step > i + 1 ? 12 : 10,
              borderRadius: '50%', flexShrink: 0,
              background: step > i + 1 ? GM : step === i + 1 ? G : '#d0dcd0',
              transition: 'all 0.2s',
            }} />
            {i < TOTAL - 1 && (
              <div style={{ flex: 1, height: 2, background: step > i + 1 ? GM : '#d0dcd0', transition: 'background 0.2s' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: '32px 28px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: 420,
      }}>
        {step === 1 && <Step1 familyName={familyName} setFamilyName={setFamilyName} onNext={goNext} />}
        {step === 2 && (
          <Step2
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            confirmPw={confirmPw} setConfirmPw={setConfirmPw}
            showPw={showPw} setShowPw={setShowPw}
            error={error} onNext={tryStep2} onPrev={goPrev}
          />
        )}
        {step === 3 && <Step3 pinDigits={pinDigits} pressPin={pressPin} onPrev={goPrev} />}
        {step === 4 && (
          <Step4
            members={members}
            showAdd={showAdd} setShowAdd={setShowAdd}
            memberName={memberName} setMemberName={setMemberName}
            memberRole={memberRole} setMemberRole={setMemberRole}
            doAddMember={doAddMember}
            removeMember={id => setMembers(m => m.filter(x => x.id !== id))}
            onNext={goNext} onPrev={goPrev}
          />
        )}
        {step === 5 && <Step5 modules={modules} toggleModule={toggleModule} onNext={goNext} onPrev={goPrev} />}
        {step === 6 && (
          <Step6
            finishStatus={finishStatus} error={error}
            familyName={familyName} moduleCount={moduleCount} memberCount={members.length}
            onFinish={finish} onPrev={goPrev} onGoToLogin={onGoToLogin}
          />
        )}
      </div>

      {/* Sign-in escape hatch */}
      {step < 6 && (
        <p style={{ marginTop: 20, fontSize: '0.88rem', color: '#999' }}>
          Already have an account?{' '}
          <button
            onClick={onGoToLogin}
            style={{ background: 'none', border: 'none', color: G, fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem', padding: 0, fontFamily: 'inherit' }}
          >
            Sign in
          </button>
        </p>
      )}
    </div>
  )
}
