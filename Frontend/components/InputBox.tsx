"use client"

import { useState } from "react"
import "../styles/input-box.css"

export default function InputBox({ onSendMessage, isLoading }) {
  const [inputValue, setInputValue] = useState("")

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue)
      setInputValue("")
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="input-box">
      <div className="input-wrapper">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          className="message-input"
        />
        <button onClick={handleSend} disabled={isLoading || !inputValue.trim()} className="send-button">
          {isLoading ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  )
}
