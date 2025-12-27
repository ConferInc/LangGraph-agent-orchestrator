"use client"

import { useState, useRef } from "react"
import Sidebar from "@/components/Sidebar"
import ChatWindow from "@/components/ChatWindow"
import "@/styles/app.css"
import axios from "axios"

interface Message {
  role: string
  content: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hello! I'm here to help you with MoXi mortgage services and Confer AI solutions. How can I assist you today?",
}

const generateThreadId = () => `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string>(generateThreadId())
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const hasUserMessage = useRef(false)

  const handleSendMessage = async (message: string) => {
    const userMessage = { role: "user", content: message }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    // Add to conversations list on first user message
    if (!hasUserMessage.current) {
      hasUserMessage.current = true
      const title = message.length > 30 ? message.substring(0, 30) + "..." : message
      setConversations(prev => [{ id: activeThreadId, title, messages: updatedMessages }, ...prev])
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

      const response = await axios.post(
        `${backendUrl}/chat`,
        { 
          question: message,
          thread_id: activeThreadId 
        },
        {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        }
      )

      const assistantMessage = { role: "assistant", content: response.data.answer }
      const newMessages = [...updatedMessages, assistantMessage]
      setMessages(newMessages)

      // Update conversation in list
      setConversations(prev => prev.map(conv => 
        conv.id === activeThreadId ? { ...conv, messages: newMessages } : conv
      ))
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage = { role: "assistant", content: "Sorry, there was an error. Please try again." }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    // Save current chat if it has user messages
    if (hasUserMessage.current) {
      setConversations(prev => prev.map(conv => 
        conv.id === activeThreadId ? { ...conv, messages } : conv
      ))
    }
    
    // Start new chat
    hasUserMessage.current = false
    setActiveThreadId(generateThreadId())
    setMessages([INITIAL_MESSAGE])
  }

  const handleSelectChat = (threadId: string) => {
    // Save current messages before switching
    if (hasUserMessage.current) {
      setConversations(prev => prev.map(conv => 
        conv.id === activeThreadId ? { ...conv, messages } : conv
      ))
    }

    // Load selected conversation
    const selectedConv = conversations.find(conv => conv.id === threadId)
    if (selectedConv) {
      setActiveThreadId(threadId)
      setMessages(selectedConv.messages)
      hasUserMessage.current = true
    }
  }

  return (
    <div className="app-container">
      <Sidebar 
        conversations={conversations} 
        activeThreadId={activeThreadId}
        onNewChat={handleNewChat} 
        onSelectChat={handleSelectChat}
      />
      <ChatWindow messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} />
    </div>
  )
}
