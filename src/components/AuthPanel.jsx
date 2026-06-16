import { useState } from 'react'

export default function AuthPanel({ onSignIn, onSignUp, loading, error, onBack, isNativeApp = false }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (mode === 'signin') onSignIn(email, password)
    else onSignUp(email, password)
  }

  return (
    <main className="auth-stage">
      <div className="chat-bg-ring one" />
      <div className="chat-bg-ring two" />
      {!isNativeApp && <button onClick={onBack} className="auth-back">Back to website</button>}
      <section className="auth-card">
        <div className="sidebar-brand-card auth-brand">
          <img src="/logo.png" alt="Krivya AI" className="navbar-logo" />
          <div>
            <strong>Krivya AI</strong>
            <span>Your chats, waiting for you</span>
          </div>
        </div>

        <div className="auth-tabs">
          <button onClick={() => setMode('signin')} className={mode === 'signin' ? 'active' : ''}>Sign in</button>
          <button onClick={() => setMode('signup')} className={mode === 'signup' ? 'active' : ''}>Create account</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required />
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" minLength={6} required />
          {error && <div className="auth-error">{error}</div>}
          <button disabled={loading} className="primary-button compact">
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  )
}
