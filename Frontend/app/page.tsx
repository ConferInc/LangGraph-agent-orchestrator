"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import ChatWindow from "@/components/ChatWindow"
import "@/styles/app.css"
import axios from "axios"

interface Message {
  role: string
  content: string
}

export default function Home() {

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm here to help you with MoXi mortgage services and Confer AI solutions. How can I assist you today?",
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState([{ id: 1, title: "Getting Started" }])

  const handleSendMessage = async (message: string) => {
    // Add user message
    const userMessage = { role: "user", content: message }
    // Construct the new list of messages to send, including the one just added
    // Note: 'messages' state won't update immediately, so we build the array manually for the API call
    const newMessages = [...messages, userMessage]

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

      const response = await axios.post(
        `${backendUrl}/chat`,
        { "question": message },
        {
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
          },
        }
      )

      const assistantMessage = {
        role: "assistant",
        content: response.data.answer,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage = { role: "assistant", content: "Sorry, there was an error. Please try again." }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hello! I'm ChatGPT Clone. How can I help you today?",
      },
    ])
  }

  return (
    <div className="app-container">
      <Sidebar conversations={conversations} onNewChat={handleNewChat} />
      <ChatWindow messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} />
    </div>
  )
}
