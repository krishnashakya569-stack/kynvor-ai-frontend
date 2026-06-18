import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import AuthPanel from './components/AuthPanel'
import LandingPage from './components/LandingPage'
import SplashIntro from './components/SplashIntro'
import { supabase, supabaseConfigError } from './lib/supabase'

const isNativeApp = Capacitor.isNativePlatform()

function App() {
  const [showChat, setShowChat] = useState(() => isNativeApp || window.location.hash === '#chat')
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loadingChats, setLoadingChats] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const openChat = () => {
    window.location.hash = 'chat'
    setShowChat(true)
  }

  const openWebsite = () => {
    if (isNativeApp) return
    window.location.hash = ''
    setShowChat(false)
  }

  const createConversation = useCallback(async (userId = session?.user?.id) => {
    if (!userId) return null

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title: 'New conversation', messages: [] })
      .select('id,title,messages,updated_at')
      .single()

    if (error) throw error

    setConversations(prev => [data, ...prev])
    setActiveId(data.id)
    return data
  }, [session?.user?.id])

  const loadConversations = useCallback(async (userId) => {
    setLoadingChats(true)
    setAuthError('')

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id,title,messages,updated_at')
        .order('updated_at', { ascending: false })

      if (error) throw error

      if (data?.length) {
        setConversations(data)
        setActiveId(data[0].id)
        return
      }

      await createConversation(userId)
    } catch (error) {
      setAuthError(error.message || 'Could not load your chats.')
      setConversations([])
      setActiveId(null)
    } finally {
      setLoadingChats(false)
    }
  }, [createConversation])

  useEffect(() => {
    if (!supabase) {
      setAuthError(supabaseConfigError || 'Supabase is not configured yet.')
      setAuthLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError(error.message)
      setSession(data?.session || null)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!showIntro) return
    const introTimer = window.setTimeout(() => setShowIntro(false), 2800)
    return () => window.clearTimeout(introTimer)
  }, [showIntro])

  useEffect(() => {
    if (!session?.user) {
      setConversations([])
      setActiveId(null)
      return
    }

    loadConversations(session.user.id)
  }, [loadConversations, session?.user])
  const signIn = async (email, password) => {
    setAuthError('')
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
    setAuthLoading(false)
  }

  const signUp = async (email, password) => {
    setAuthError('')
    setAuthLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setAuthError(error.message)
    else setAuthError('Account created. Check your email if confirmation is enabled, then sign in.')
    setAuthLoading(false)
  }

  const signInWithProvider = async (provider) => {
    setAuthError('')
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}#chat`,
      },
    })
    if (error) {
      setAuthError(error.message)
      setAuthLoading(false)
    }
  }

  const sendPhoneOtp = async (phone) => {
    setAuthError('')
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) setAuthError(error.message)
    else setAuthError('OTP sent. Enter the code to continue.')
    setAuthLoading(false)
    return !error
  }

  const verifyPhoneOtp = async (phone, token) => {
    setAuthError('')
    setAuthLoading(true)
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
    if (error) setAuthError(error.message)
    setAuthLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const newConversation = async () => {
    setAuthError('')
    try {
      await createConversation()
      if (isMobile) setSidebarOpen(false)
    } catch (error) {
      setAuthError(error.message || 'Could not create a new conversation.')
    }
  }

  const selectConversation = (id) => {
    setActiveId(id)
    if (isMobile) setSidebarOpen(false)
  }

  const updateMessages = async (messages) => {
    const activeConversation = conversations.find(c => c.id === activeId)
    if (!activeConversation) return

    const title = messages[0]?.content.slice(0, 35) || 'New conversation'
    const nextConversation = { ...activeConversation, messages, title, updated_at: new Date().toISOString() }

    setConversations(prev => prev
      .map(c => c.id === activeId ? nextConversation : c)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)))

    const { error } = await supabase
      .from('conversations')
      .update({ title, messages, updated_at: nextConversation.updated_at })
      .eq('id', activeId)

    if (error) setAuthError(error.message)
  }

  if (showIntro) {
    return <SplashIntro />
  }

  if (!showChat && !isNativeApp) {
    return <LandingPage onOpenChat={openChat} />
  }

  if (authLoading) {
    return <div className="app-loading">Loading Kynvor AI...</div>
  }

  if (!session) {
    return (
      <AuthPanel
        onSignIn={signIn}
        onSignUp={signUp}
        onProviderSignIn={signInWithProvider}
        onSendPhoneOtp={sendPhoneOtp}
        onVerifyPhoneOtp={verifyPhoneOtp}
        loading={authLoading}
        error={authError}
        onBack={openWebsite}
        isNativeApp={isNativeApp}
      />
    )
  }

  const activeConv = conversations.find(c => c.id === activeId)

  return (
    <div className="chat-app-shell">
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:20 }} />
      )}

      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={newConversation}
        user={session.user}
        onSignOut={signOut}
        isMobile={isMobile}
        isOpen={!isMobile || sidebarOpen}
        onBackToWebsite={openWebsite}
        isNativeApp={isNativeApp}
      />

      {loadingChats ? (
        <div className="chat-loading">Loading chats...</div>
      ) : activeConv ? (
        <ChatWindow conversation={activeConv} onUpdateMessages={updateMessages} isMobile={isMobile} onToggleSidebar={() => setSidebarOpen(true)} />
      ) : (
        <div className="empty-state-panel">
          <div>
            <div className="empty-state-title">No conversation loaded</div>
            <div className={authError ? 'empty-state-error' : 'empty-state-copy'}>
              {authError || 'Start a new conversation to begin using Kynvor AI.'}
            </div>
            <button onClick={newConversation} className="primary-button compact">
              Start new conversation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
