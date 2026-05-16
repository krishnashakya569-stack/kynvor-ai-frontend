import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'

function App() {
  const [conversations, setConversations] = useState([
    { id: 1, title: 'New conversation', messages: [] }
  ])
  const [activeId, setActiveId] = useState(1)

  const activeConv = conversations.find(c => c.id === activeId)

  const newConversation = () => {
    const id = Date.now()
    setConversations(prev => [...prev, { id, title: 'New conversation', messages: [] }])
    setActiveId(id)
  }

  const updateMessages = (messages) => {
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages, title: messages[0]?.content.slice(0, 35) || 'New conversation' }
        : c
    ))
  }

  return (
    <div style={{ display:'flex', height:'100vh', background:'#f5f4ef' }}>
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newConversation}
      />
      <ChatWindow
        conversation={activeConv}
        onUpdateMessages={updateMessages}
      />
    </div>
  )
}

export default App
