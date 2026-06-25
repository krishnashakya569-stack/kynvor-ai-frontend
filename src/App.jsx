import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { App as CapApp } from '@capacitor/app'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import AuthPanel from './components/AuthPanel'
import LandingPage from './components/LandingPage'
import SplashIntro from './components/SplashIntro'
import { supabase, supabaseConfigError } from './lib/supabase'

const isNativeApp = Capacitor.isNativePlatform()
const AUTH_TIMEOUT_MS = 12000
const LOCAL_SESSION_KEY = 'kynvorLocalSession'
const LOCAL_CONVERSATIONS_KEY = 'kynvorLocalConversations'

function makeLocalSession(identifier) {
  return {
    access_token: 'local',
    provider_token: null,
    user: {
      id: `local:${identifier || 'guest'}`,
      email: identifier?.includes('@') ? identifier : `${identifier || 'guest'}@kynvor.local`,
      user_metadata: { full_name: 'Kynvor User' },
    },
    isLocal: true,
  }
}

function readLocalConversations() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CONVERSATIONS_KEY) || '[]')
  } catch {
    return []
  }
}

function writeLocalConversations(conversations) {
  localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify(conversations))
}

function App() {
  const [showChat, setShowChat] = useState(() => isNativeApp || window.location.hash === '#chat')
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authActionLoading, setAuthActionLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loadingChats, setLoadingChats] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const [authOffline, setAuthOffline] = useState(false)
  const sessionUserId = session?.user?.id
  const isLocalSession = Boolean(session?.isLocal)

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

  const createConversation = useCallback(async (userId = sessionUserId) => {
    if (!userId) return null

    if (isLocalSession || authOffline || !supabase) {
      const conversation = {
        id: crypto.randomUUID?.() || `local-${Date.now()}`,
        title: 'New conversation',
        messages: [],
        updated_at: new Date().toISOString(),
      }
      const next = [conversation, ...readLocalConversations()]
      writeLocalConversations(next)
      setConversations(next)
      setActiveId(conversation.id)
      return conversation
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title: 'New conversation', messages: [] })
      .select('id,title,messages,updated_at')
      .single()

    if (error) throw error

    setConversations(prev => [data, ...prev])
    setActiveId(data.id)
    return data
  }, [authOffline, isLocalSession, sessionUserId])

  const loadConversations = useCallback(async (userId) => {
    setLoadingChats(true)
    setAuthError('')

    try {
      if (isLocalSession || authOffline || !supabase) {
        const localConversations = readLocalConversations()
        if (localConversations.length) {
          setConversations(localConversations)
          setActiveId(localConversations[0].id)
        } else {
          await createConversation(userId)
        }
        return
      }

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
  }, [authOffline, createConversation, isLocalSession])

  useEffect(() => {
    let mounted = true
    let authTimeout

    const finishAuth = () => {
      if (!mounted) return
      window.clearTimeout(authTimeout)
      setAuthLoading(false)
    }

    const cleanAuthUrl = () => {
      const nextUrl = `${window.location.origin}${window.location.pathname}#chat`
      window.history.replaceState(null, '', nextUrl)
      setShowChat(true)
    }

    if (!supabase) {
      setAuthError(supabaseConfigError || 'Supabase is not configured yet.')
      setAuthOffline(true)
      const localSession = localStorage.getItem(LOCAL_SESSION_KEY)
      if (localSession) setSession(JSON.parse(localSession))
      finishAuth()
      return () => {
        mounted = false
        window.clearTimeout(authTimeout)
      }
    }

    const initAuth = async () => {
      authTimeout = window.setTimeout(() => {
        if (!mounted) return
        setAuthError('Login is taking too long. Please try again, or check Supabase Auth redirect settings.')
        setAuthLoading(false)
      }, AUTH_TIMEOUT_MS)

      try {
        const params = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))

        const authError = params.get('error_description') || hashParams.get('error_description')
        if (authError) {
          setAuthError(decodeURIComponent(authError.replace(/\+/g, ' ')))
          cleanAuthUrl()
        }

        if (params.has('code')) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
          if (error) setAuthError(error.message)
          if (data?.session) {
            setSession(data.session)
            cleanAuthUrl()
          }
        }

        const { data, error } = await supabase.auth.getSession()
        if (error) setAuthError(error.message)
        if (mounted) {
          setSession(data?.session || null)
          if (data?.session) setShowChat(true)
        }
      } catch {
        if (mounted) {
          setAuthOffline(true)
          const localSession = localStorage.getItem(LOCAL_SESSION_KEY)
          if (localSession) setSession(JSON.parse(localSession))
          setAuthError('Supabase is not reachable right now. You can still sign in locally and use Kynvor on this device.')
        }
      } finally {
        finishAuth()
      }
    }

    initAuth()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) {
        setShowChat(true)
        setAuthLoading(false)
      }
    })

    return () => {
      mounted = false
      window.clearTimeout(authTimeout)
      listener?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isNativeApp || !supabase) return

    const handleDeepLink = async ({ url }) => {
      if (!url || !url.startsWith('com.kynvor.app://auth/callback')) return

      await Browser.close().catch(() => {})
      setAuthError('')

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(url)
        if (error) {
          setAuthError(error.message)
        } else if (data?.session) {
          setSession(data.session)
          setShowChat(true)
        }
      } catch {
        setAuthError('Could not complete sign-in. Please try again.')
      } finally {
        setAuthActionLoading(false)
      }
    }

    const listenerPromise = CapApp.addListener('appUrlOpen', handleDeepLink)

    return () => {
      listenerPromise.then((handle) => handle.remove())
    }
  }, [])

  useEffect(() => {
    if (!showIntro) return
    const introTimer = window.setTimeout(() => setShowIntro(false), 2800)
    return () => window.clearTimeout(introTimer)
  }, [showIntro])

  useEffect(() => {
    if (!sessionUserId) {
      setConversations([])
      setActiveId(null)
      return
    }

    loadConversations(sessionUserId)
  }, [loadConversations, sessionUserId])
  const signIn = async (email, password) => {
    setAuthError('')
    setAuthActionLoading(true)
    try {
      if (!supabase || authOffline) throw new Error('Supabase offline')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setAuthError(error.message)
    } catch {
      const localSession = makeLocalSession(email)
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localSession))
      setSession(localSession)
      setShowChat(true)
      setAuthOffline(true)
    } finally {
      setAuthActionLoading(false)
    }
  }

  const signUp = async (email, password) => {
    setAuthError('')
    setAuthActionLoading(true)
    try {
      if (!supabase || authOffline) throw new Error('Supabase offline')
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setAuthError(error.message)
      else setAuthError('Account created. Check your email if confirmation is enabled, then sign in.')
    } catch {
      const localSession = makeLocalSession(email)
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localSession))
      setSession(localSession)
      setShowChat(true)
      setAuthOffline(true)
    } finally {
      setAuthActionLoading(false)
    }
  }

  const signInWithProvider = async (provider) => {
    setAuthError('')
    setAuthActionLoading(true)

    if (authOffline || !supabase) {
      setAuthError('Supabase is not reachable, so social login cannot start. Use email sign-in for local access, then reconnect the correct Supabase project URL.')
      setAuthActionLoading(false)
      return
    }

    if (isNativeApp) {
      // Native app: Supabase must redirect to our custom URL scheme, not
      // https://localhost. We open the OAuth URL in the system browser and
      // listen for the app to be reopened via that custom scheme deep link.
      const redirectTo = 'com.kynvor.app://auth/callback'
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      })

      if (error || !data?.url) {
        setAuthError(error?.message?.toLowerCase().includes('provider')
          ? `${provider === 'google' ? 'Gmail' : 'GitHub'} login is not enabled in Supabase yet. Enable this provider in Supabase Auth settings, then try again.`
          : (error?.message || 'Could not start sign-in.'))
        setAuthActionLoading(false)
        return
      }

      await Browser.open({ url: data.url, presentationStyle: 'popover' })
      // Loading state is cleared once the deep-link listener (set up in
      // useEffect below) receives the callback and the session updates, or
      // the user dismisses the browser without finishing sign-in.
      return
    }

    const redirectTo = `${window.location.origin}${window.location.pathname}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })

    if (error) {
      setAuthError(error.message?.toLowerCase().includes('provider')
        ? `${provider === 'google' ? 'Gmail' : 'GitHub'} login is not enabled in Supabase yet. Enable this provider in Supabase Auth settings, then try again.`
        : error.message)
      setAuthActionLoading(false)
    }
  }

  const signOut = async () => {
    localStorage.removeItem(LOCAL_SESSION_KEY)
    if (supabase && !isLocalSession) await supabase.auth.signOut()
    setSession(null)
    setShowChat(!isNativeApp && window.location.hash === '#chat')
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
    const sortedConversations = conversations
      .map(c => c.id === activeId ? nextConversation : c)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))

    setConversations(sortedConversations)

    if (isLocalSession || authOffline || !supabase) {
      writeLocalConversations(sortedConversations)
      return
    }

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
        onClearError={() => setAuthError('')}
        loading={authActionLoading}
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