"use client"
import "../styles/sidebar.css"

export default function Sidebar({ conversations, onNewChat }) {
  return (
    <aside className="sidebar">
      <button className="new-chat-btn" onClick={onNewChat}>
        + New Chat
      </button>

      <div className="conversations-list">
        <h3 className="conversations-title">Recent</h3>
        {conversations.map((conv) => (
          <div key={conv.id} className="conversation-item">
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
