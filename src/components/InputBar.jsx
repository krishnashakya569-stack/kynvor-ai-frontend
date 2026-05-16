import { useState, useRef } from 'react'

export default function InputBar({ onSend, loading }) {
  const [text, setText] = useState('')
  const [attached, setAttached] = useState(null)
  const textRef = useRef(null)
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1]
      setAttached({ name: file.name, data: base64, mimeType: file.type })
    }
    reader.readAsDataURL(file)
  }

  const handle = () => {
    if ((!text.trim() && !attached) || loading) return
    onSend(text || 'Please describe or analyze this file.', attached)
    setText('')
    setAttached(null)
    if (fileRef.current) fileRef.current.value = ''
    if (textRef.current) textRef.current.style.height = 'auto'
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handle() }
  }

  const onInput = (e) => {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
  }

  const canSend = (text.trim() || attached) && !loading

  return (
    <div style={{ padding:'8px 20px 18px', maxWidth:760, width:'100%', margin:'0 auto' }}>
      <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.csv,.json,.md" style={{ display:'none' }} onChange={handleFile} />

      {attached && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', marginBottom:8, background:'#2a2a2a', borderRadius:9, fontSize:12, color:'#aaa', border:'1px solid #333' }}>
          <span>📎</span>
          <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{attached.name}</span>
          <button onClick={() => { setAttached(null); if(fileRef.current) fileRef.current.value=''; }}
            style={{ background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:16, lineHeight:1, padding:'0 2px', flexShrink:0 }}>×</button>
        </div>
      )}

      <div style={{ border:`1px solid ${canSend ? '#444' : '#2e2e2e'}`, borderRadius:14, background:'#2f2f2f', overflow:'hidden', transition:'border-color 0.2s' }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:8, padding:'12px 12px 8px 16px' }}>
          <textarea ref={textRef} value={text} onChange={onInput} onKeyDown={onKey}
            placeholder="Message Mitra AI..."
            rows={1}
            style={{ flex:1, border:'none', background:'transparent', resize:'none', outline:'none', fontSize:14.5, color:'#ececec', fontFamily:'inherit', lineHeight:1.6, maxHeight:140, caretColor:'#c96442' }}
          />
          <button onClick={handle} disabled={!canSend}
            style={{ width:34, height:34, borderRadius:9, background: canSend ? '#c96442' : '#3a3a3a', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor: canSend ? 'pointer' : 'not-allowed', flexShrink:0, color: canSend ? 'white' : '#555', fontSize:17, transition:'all 0.2s' }}>
            ↑
          </button>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px 10px' }}>
          <button onClick={() => fileRef.current.click()}
            style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#777', border:'1px solid #3a3a3a', borderRadius:6, padding:'4px 10px', background:'transparent', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#333'; e.currentTarget.style.color='#bbb'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#777'; }}>
            📎 Attach file
          </button>
          <span style={{ fontSize:11, color:'#444' }}>Enter to send · Shift+Enter for newline</span>
        </div>
      </div>
    </div>
  )
}
