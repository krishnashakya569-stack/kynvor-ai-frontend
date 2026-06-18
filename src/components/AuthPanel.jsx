import { Eye, EyeOff, GitBranch, Mail, Phone } from 'lucide-react'
import { useState } from 'react'

export default function AuthPanel({
  onSignIn,
  onSignUp,
  onProviderSignIn,
  onSendPhoneOtp,
  onVerifyPhoneOtp,
  loading,
  error,
  onBack,
  isNativeApp = false,
}) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    if (mode === 'phone') {
      if (otpSent) onVerifyPhoneOtp(phone, otp)
      else onSendPhoneOtp(phone).then((sent) => sent && setOtpSent(true))
      return
    }

    if (mode === 'signin') onSignIn(email, password)
    else onSignUp(email, password)
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setOtp('')
    setOtpSent(false)
  }

  return (
    <main className="auth-stage">
      <div className="chat-bg-ring one" />
      <div className="chat-bg-ring two" />
      {!isNativeApp && <button onClick={onBack} className="auth-back">Back to website</button>}
      <section className="auth-card">
        <div className="sidebar-brand-card auth-brand">
          <img src="/logo.png" alt="Kynvor AI" className="navbar-logo" />
          <div>
            <strong>Kynvor AI</strong>
            <span>Your chats, waiting for you</span>
          </div>
        </div>

        <div className="auth-socials">
          <button type="button" onClick={() => onProviderSignIn('google')} disabled={loading}>
            <Mail size={17} />
            Gmail
          </button>
          <button type="button" onClick={() => onProviderSignIn('github')} disabled={loading}>
            <GitBranch size={17} />
            GitHub
          </button>
        </div>

        <div className="auth-tabs three">
          <button onClick={() => switchMode('signin')} className={mode === 'signin' ? 'active' : ''}>Sign in</button>
          <button onClick={() => switchMode('signup')} className={mode === 'signup' ? 'active' : ''}>Create</button>
          <button onClick={() => switchMode('phone')} className={mode === 'phone' ? 'active' : ''}>Phone</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'phone' ? (
            <>
              <label className="auth-field">
                <Phone size={16} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Phone number with country code"
                  autoComplete="tel"
                  required
                />
              </label>
              {otpSent && (
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Enter OTP"
                  autoComplete="one-time-code"
                  required
                />
              )}
            </>
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                autoComplete="email"
                required
              />
              <label className="auth-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </label>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}
          <button disabled={loading} className="primary-button compact">
            {loading ? 'Please wait...' : mode === 'phone' ? (otpSent ? 'Verify OTP' : 'Send OTP') : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  )
}
