"use client"

import { useRef, useEffect } from "react"
import MessageBubble from "./MessageBubble"
import InputBox from "./InputBox"
import "../styles/chat-window.css"

export default function ChatWindow({ messages, isLoading, onSendMessage }) {
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  return (
    <div className="chat-window">
      <header className="chat-header">
        <h1>ChatGPT Clone</h1>
      </header>

      <div className="messages-container">
        {messages.map((message, index) => (
          <MessageBubble key={index} role={message.role} content={message.content} />
        ))}
        {isLoading && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <InputBox onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  )
}
