import { Mic, Paperclip, Send, Square, X } from 'lucide-react'
import { useRef, useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const MIN_RECORDING_MS = 1200

export default function InputBar({ onSend, loading, isMobile = false }) {
  const [text, setText] = useState('')
  const [attached, setAttached] = useState(null)
  const [recording, setRecording] = useState(false)
  const [speechError, setSpeechError] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const textRef = useRef(null)
  const fileRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const startedAtRef = useRef(0)

  const handleFile = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1]
      setAttached({ name: file.name, data: base64, mimeType: file.type })
    }
    reader.readAsDataURL(file)
  }

  const handle = () => {
    if ((!text.trim() && !attached) || loading || transcribing) return
    onSend(text || 'Please describe or analyze this file.', attached)
    setText('')
    setAttached(null)
    if (fileRef.current) fileRef.current.value = ''
    if (textRef.current) textRef.current.style.height = 'auto'
  }

  const startRecording = async () => {
    try {
      setSpeechError('')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      })
      streamRef.current = stream
      chunksRef.current = []
      startedAtRef.current = Date.now()

      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : undefined
      const recorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        try {
          setTranscribing(true)
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', blob, 'speech.webm')

          const response = await fetch(`${BACKEND_URL}/api/transcribe`, {
            method: 'POST',
            body: formData,
          })
          const data = await response.json()

          if (!response.ok) throw new Error(data.error || 'Could not transcribe voice input.')
          if (data.text) setText((current) => `${current.trim()}${current.trim() ? ' ' : ''}${data.text}`)
        } catch (error) {
          setSpeechError(error.message || 'Voice input could not be transcribed.')
        } finally {
          setTranscribing(false)
          streamRef.current?.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      recorder.start(250)
      setRecording(true)
    } catch (error) {
      setSpeechError(
        error.name === 'NotAllowedError'
          ? 'Please allow microphone permission in your browser.'
          : 'Microphone could not start. Please check browser permission and try again.'
      )
    }
  }

  const stopRecording = () => {
    const elapsed = Date.now() - startedAtRef.current
    if (elapsed < MIN_RECORDING_MS) {
      setSpeechError('Speak for at least one full second, then stop recording.')
      return
    }

    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const toggleRecording = () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setSpeechError('Voice input is not supported in this browser.')
      return
    }

    if (recording) stopRecording()
    else startRecording()
  }

  const onKey = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handle()
    }
  }

  const onInput = (event) => {
    setText(event.target.value)
    event.target.style.height = 'auto'
    event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`
  }

  const canSend = (text.trim() || attached) && !loading && !transcribing

  return (
    <div className={`input-shell ${isMobile ? 'mobile' : ''}`}>
      <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.csv,.json,.md" hidden onChange={handleFile} />

      {attached && (
        <div className="input-attachment">
          <Paperclip size={14} />
          <span>{attached.name}</span>
          <button onClick={() => { setAttached(null); if (fileRef.current) fileRef.current.value = '' }} aria-label="Remove attachment">
            <X size={15} />
          </button>
        </div>
      )}

      {speechError && <div className="speech-error">{speechError}</div>}

      <div className={`composer ${canSend ? 'ready' : ''}`}>
        <div className="composer-main">
          <textarea
            ref={textRef}
            value={text}
            onChange={onInput}
            onKeyDown={onKey}
            placeholder={recording ? 'Listening...' : transcribing ? 'Transcribing...' : 'Message Krivya AI...'}
            rows={1}
          />
          <button onClick={toggleRecording} title={recording ? 'Stop recording' : 'Start recording'} className={`composer-icon ${recording ? 'recording' : ''}`}>
            {recording ? <Square size={16} /> : <Mic size={16} />}
          </button>
          <button onClick={handle} disabled={!canSend} className="composer-send" aria-label="Send message">
            <Send size={16} />
          </button>
        </div>
        <div className="composer-footer">
          <button onClick={() => fileRef.current.click()}>
            <Paperclip size={14} /> Attach file
          </button>
          {!isMobile && <span>{recording ? 'Recording... speak clearly, then click again' : transcribing ? 'Turning speech into text...' : 'Mic ready - speak for 1-2 seconds minimum'}</span>}
        </div>
      </div>
    </div>
  )
}
