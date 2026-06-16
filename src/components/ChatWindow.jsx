import { Bot, CloudSun, Globe2, LocateFixed, Menu, Minus, Newspaper, Plus, Share2, Sparkles, Type } from 'lucide-react'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'
import { useEffect, useRef, useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

function needsLocation(text = '') {
  return /\b(weather|temperature|rain|forecast|location|where am i|near me|nearby)\b/i.test(text)
}

const suggestions = [
  [CloudSun, 'Weather', 'What is the weather near me right now?'],
  [Newspaper, 'News', 'Give me the latest top news in India today.'],
  [Globe2, 'Affairs', "Summarize today's current affairs in India and the world."],
  [LocateFixed, 'Location', 'Where am I right now?'],
]

export default function ChatWindow({ conversation, onUpdateMessages, isMobile = false, onToggleSidebar }) {
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('')
  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem('krivyaChatFontScale')) || 1)
  const chatScrollRef = useRef(null)

  useEffect(() => {
    const scrollBox = chatScrollRef.current
    if (!scrollBox) return
    requestAnimationFrame(() => {
      scrollBox.scrollTo({ top: scrollBox.scrollHeight, behavior: 'smooth' })
    })
  }, [conversation?.messages, loading])

  const adjustFont = (step) => {
    setFontScale((current) => {
      const next = Math.min(1.35, Math.max(0.85, Number((current + step).toFixed(2))))
      localStorage.setItem('krivyaChatFontScale', String(next))
      return next
    })
  }

  const requestLocation = () => new Promise((resolve) => {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not supported')
      resolve(null)
      return
    }

    setLocationStatus('Getting location...')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
        setLocation(nextLocation)
        setLocationStatus('Location on')
        resolve(nextLocation)
      },
      () => {
        setLocationStatus('Location off')
        resolve(null)
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 10 * 60 * 1000 }
    )
  })

  const sendMessage = async (text, attachment = null) => {
    if ((!text.trim() && !attachment) || loading) return
    const userMsg = { role: 'user', content: text || 'Please analyze this file.', attachment }
    const newMessages = [...(conversation?.messages || []), userMsg]
    onUpdateMessages(newMessages)
    setLoading(true)

    try {
      const messageLocation = needsLocation(text) ? (location || await requestLocation()) : location
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          attachment,
          location: messageLocation,
        }),
      })
      const data = await res.json()
      onUpdateMessages([...newMessages, { role: 'assistant', content: data.message || data.error }])
    } catch {
      onUpdateMessages([...newMessages, { role: 'assistant', content: 'Cannot connect to backend. Make sure the server is running.' }])
    } finally {
      setLoading(false)
    }
  }

  const isEmpty = !conversation?.messages?.length

  return (
    <section className="chat-stage" style={{ '--chat-font-scale': fontScale }}>
      <div className="chat-bg-ring one" />
      <div className="chat-bg-ring two" />
      <header className="chat-topbar">
        <div className="chat-title-row">
          {isMobile && (
            <button className="icon-button" onClick={onToggleSidebar} aria-label="Open menu">
              <Menu size={18} />
            </button>
          )}
          <div className="chat-brand-pill"><Sparkles size={15} /> Krivya AI</div>
        </div>
        <div className="chat-actions">
          {!isMobile && locationStatus && <span className={location ? 'status-on' : ''}>{locationStatus}</span>}
          <div className="font-size-control" aria-label="Chat font size">
            <Type size={15} />
            <button type="button" onClick={() => adjustFont(-0.05)} aria-label="Decrease chat font size"><Minus size={14} /></button>
            <span>{Math.round(fontScale * 100)}%</span>
            <button type="button" onClick={() => adjustFont(0.05)} aria-label="Increase chat font size"><Plus size={14} /></button>
          </div>
          <button className="ghost-action" onClick={requestLocation} title="Use my location">
            <LocateFixed size={15} /> {!isMobile && 'Location'}
          </button>
          {!isMobile && <button className="ghost-action" title="Share link"><Share2 size={15} /> Share</button>}
        </div>
      </header>

      <div className="chat-scroll" ref={chatScrollRef}>
        {isEmpty ? (
          <div className="empty-chat">
            <div className="empty-logo"><Bot size={30} /></div>
            <h1>How can Krivya AI help you today?</h1>
            <p>Ask about studying, coding, writing, live news, weather, current affairs, files, images, or voice.</p>
            <div className="suggestion-row">
              {suggestions.map(([Icon, label, prompt]) => (
                <button key={label} onClick={() => sendMessage(prompt)}>
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="message-list">
            {conversation.messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
            {loading && (
              <div className="msg-fade assistant-typing">
                <div className="assistant-avatar">K</div>
                <div className="typing-dots">
                  <span className="dot-1" />
                  <span className="dot-2" />
                  <span className="dot-3" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <InputBar onSend={sendMessage} loading={loading} isMobile={isMobile} />
    </section>
  )
}
