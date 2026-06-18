import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

function cleanSpeechText(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#*_>-]/g, ' ')
    .replace(/[,:;]+/g, ' ')
    .replace(/[.!?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(null)
  const [speaking, setSpeaking] = useState(false)
  const [voices, setVoices] = useState([])
  const isUser = message.role === 'user'

  useEffect(() => {
    if (!window.speechSynthesis) return
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices())
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const copy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const speak = () => {
    if (!window.speechSynthesis) return

    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText(message.content))
    utterance.rate = 0.92
    utterance.pitch = 1.08
    utterance.volume = 1

    const preferredVoice =
      voices.find(v => /zira|samantha|aria|female/i.test(v.name)) ||
      voices.find(v => /en-IN/i.test(v.lang) && /female/i.test(v.name)) ||
      voices.find(v => /^en/i.test(v.lang))

    if (preferredVoice) utterance.voice = preferredVoice

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className={`msg-fade message-row ${isUser ? 'from-user' : 'from-assistant'}`}>
      <div className="message-avatar">{isUser ? 'U' : 'K'}</div>
      <div className="message-content">
        <p className="message-author">{isUser ? 'You' : 'Kynvor AI'}</p>
        {message.attachment && (
          <div className="attachment-chip">
            Attached: {message.attachment.name || 'Attached file'}
          </div>
        )}
        <div className="prose message-prose">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {!isUser && (
          <div className="message-tools">
            <button onClick={copy} className={copied ? 'is-done' : ''}>
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={speak} className={speaking ? 'is-active' : ''}>
              {speaking ? 'Stop' : 'Listen'}
            </button>
            <button onClick={() => setLiked('up')} className={liked === 'up' ? 'is-done' : ''}>Good</button>
            <button onClick={() => setLiked('down')} className={liked === 'down' ? 'is-bad' : ''}>Bad</button>
          </div>
        )}
      </div>
    </div>
  )
}
