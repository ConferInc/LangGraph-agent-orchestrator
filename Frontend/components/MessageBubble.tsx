"use client"
import "../styles/message-bubble.css"

export default function MessageBubble({ role, content }) {
  const formatContent = (text) => {
    return text.split("\n").map((line, idx) => {
      // Handle bold text
      const formatted = line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      return <div key={idx} dangerouslySetInnerHTML={{ __html: formatted }} />
    })
  }

  return (
    <div className={`message-bubble message-${role}`}>
      <div className="bubble-content">{formatContent(content)}</div>
    </div>
  )
}
