export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  user,
  onSignOut,
  isMobile = false,
  isOpen = true,
  onBackToWebsite,
  isNativeApp = false,
}) {
  return (
    <aside
      className="chat-sidebar"
      style={{
        width: isMobile ? '82vw' : 292,
        maxWidth: isMobile ? 340 : 292,
        transform: isOpen ? 'translateX(0)' : 'translateX(-105%)',
        position: isMobile ? 'fixed' : 'relative',
      }}
    >
      <div className="sidebar-brand-card">
        <img src="/logo.png" alt="Kynvor AI" className="navbar-logo" />
        <div>
          <strong>Kynvor AI</strong>
          <span>Your Personal AI Guide</span>
        </div>
      </div>

      <button className="sidebar-new-button" onClick={onNew}>+ New Conversation</button>

      <p className="sidebar-label">Recent Chats</p>

      <div className="sidebar-list">
        {conversations.map((conv) => (
          <button
            className={conv.id === activeId ? 'active' : ''}
            key={conv.id}
            onClick={() => onSelect(conv.id)}
          >
            {conv.title}
          </button>
        ))}
      </div>

      <div className="sidebar-user">
        <div className="sidebar-user-row">
          <div className="user-avatar">{user?.email?.[0]?.toUpperCase() || 'U'}</div>
          <div className="user-email">{user?.email}</div>
        </div>
        {!isNativeApp && <button className="sidebar-website" onClick={onBackToWebsite}>Website</button>}
        <button className="sidebar-signout" onClick={onSignOut}>Sign Out</button>
      </div>
    </aside>
  )
}
