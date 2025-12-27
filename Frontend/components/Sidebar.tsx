"use client"
import "../styles/sidebar.css"

interface Conversation {
  id: string
  title: string
}

interface SidebarProps {
  conversations: Conversation[]
  activeThreadId: string
  onNewChat: () => void
  onSelectChat: (threadId: string) => void
}

export default function Sidebar({ conversations, activeThreadId, onNewChat, onSelectChat }: SidebarProps) {
  return (
    <aside className="sidebar">
      <button className="new-chat-btn" onClick={onNewChat}>
        + New Chat
      </button>

      <div className="conversations-list">
        <h3 className="conversations-title">Recent</h3>
        {conversations.map((conv) => (
          <div 
            key={conv.id} 
            className={`conversation-item ${conv.id === activeThreadId ? 'active' : ''}`}
            onClick={() => onSelectChat(conv.id)}
          >
            <span className="conversation-icon">💬</span>
            <span className="conversation-text">{conv.title}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-icon-btn">⚙️</button>
        <button className="sidebar-icon-btn">👤</button>
      </div>
    </aside>
  )
}
