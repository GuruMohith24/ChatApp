import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Client } from "@stomp/stompjs"

interface User {
  id: number
  username: string
  email: string
  avatarUrl: string | null
  isOnline: boolean
  createdAt: string
}

interface Message {
  id: number
  senderUsername: string
  recipientUsername: string
  content: string
  createdAt: string
}

function ChatPage() {
  const username = localStorage.getItem("username")
  const token = localStorage.getItem("token")
  const navigate = useNavigate()

  const [users, setUsers] = useState<User[]>([])
  const [recipient, setRecipient] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  const stompClient = useRef<Client | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token || !username) {
      navigate("/")
    }
  }, [token, username, navigate])

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Auto-scroll when messages update
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch users & setup WebSocket connection
  useEffect(() => {
    if (!token || !username) return

    // Fetch registered users
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/user/all", {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          // Exclude self from the users list
          const filteredUsers = data.filter((u: User) => u.username !== username)
          setUsers(filteredUsers)
        }
      } catch (err) {
        console.error("Failed to load users:", err)
      }
    }

    fetchUsers()

    // Establish WebSocket Connection
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws",
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        console.log("Connected to WebSocket!")
        client.subscribe("/user/queue/messages", (message) => {
          const received = JSON.parse(message.body) as Message
          
          // Only add to message history if it is from the active recipient or to the active recipient
          setMessages((prev) => {
            const alreadyExists = prev.some((m) => m.id === received.id)
            if (alreadyExists) return prev
            
            // If the incoming message belongs to our active conversation, append it
            if (
              (received.senderUsername === recipient && received.recipientUsername === username) ||
              (received.senderUsername === username && received.recipientUsername === recipient)
            ) {
              return [...prev, received]
            }
            return prev
          })
        })
      },
      onDisconnect: () => console.log("Disconnected from WebSocket"),
    })

    client.activate()
    stompClient.current = client

    return () => {
      client.deactivate()
    }
  }, [token, username, recipient])

  // Load chat history when recipient changes
  useEffect(() => {
    if (!recipient) return

    const loadChat = async () => {
      setLoadingHistory(true)
      try {
        const response = await fetch(`http://localhost:8080/api/messages/${recipient}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setMessages(data)
        }
      } catch (err) {
        console.error("Failed to load chat history:", err)
      } finally {
        setLoadingHistory(false)
      }
    }

    loadChat()
  }, [recipient, token])

  const handleLogout = () => {
    stompClient.current?.deactivate()
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    navigate("/")
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !recipient) return

    if (stompClient.current?.connected) {
      const tempId = Date.now()
      const payload = { recipientUsername: recipient, content: newMessage }
      
      stompClient.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(payload)
      })

      // Optimistically append sent message
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          senderUsername: username || "",
          recipientUsername: recipient,
          content: newMessage,
          createdAt: new Date().toISOString()
        }
      ])
      setNewMessage("")
    } else {
      console.warn("WebSocket client is not connected")
    }
  }

  // Filtered users list based on search query
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Format timestamp helper
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return ""
    }
  }

  const getInitials = (name: string) => {
    return name.slice(0, 2)
  }

  return (
    <div className="chat-container">
      {/* Sidebar Panel */}
      <aside className="chat-sidebar" id="sidebar-container">
        <div className="sidebar-header">
          <div className="app-brand">
            <h2 className="app-logo">ChatApp</h2>
            <button className="logout-btn" onClick={handleLogout} id="logout-button">
              Logout
            </button>
          </div>
          
          <div className="user-profile">
            <div className="avatar-small">
              {username ? getInitials(username) : "?"}
            </div>
            <div className="profile-info">
              <span className="profile-name" id="current-username">{username}</span>
              <span className="profile-status">Online</span>
            </div>
          </div>

          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search or enter recipient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="recipient-search-input"
            />
            {searchQuery && !filteredUsers.some(u => u.username === searchQuery) && (
              <button 
                className="btn-icon"
                onClick={() => {
                  setRecipient(searchQuery)
                  setSearchQuery("")
                }}
                title="Direct Chat"
                id="direct-chat-btn"
              >
                +
              </button>
            )}
          </div>
        </div>

        <div className="user-list" id="users-sidebar-list">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`user-item ${recipient === user.username ? "active" : ""}`}
                onClick={() => setRecipient(user.username)}
                id={`user-item-${user.username}`}
              >
                <div className="avatar-medium has-char">
                  {getInitials(user.username)}
                  {user.isOnline && <span className="status-dot"></span>}
                </div>
                <div className="user-item-info">
                  <span className="user-item-name">{user.username}</span>
                  <span className="user-item-meta">{user.email}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="chat-empty-state" style={{ padding: "20px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                No other users found
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Conversation Window */}
      <main className="chat-main" id="chat-conversation-area">
        {recipient ? (
          <>
            {/* Header info */}
            <header className="chat-header-main">
              <div className="active-recipient-info">
                <div className="avatar-medium has-char" style={{ width: "36px", height: "36px", fontSize: "14px" }}>
                  {getInitials(recipient)}
                </div>
                <div>
                  <h3 className="recipient-name" id="active-recipient-name">{recipient}</h3>
                  <span className="recipient-status">
                    <span className="status-dot" style={{ position: "relative", display: "inline-block", border: "none" }}></span>
                    Active Session
                  </span>
                </div>
              </div>
            </header>

            {/* Messages body */}
            <div className="messages-area" id="messages-list-viewport">
              {loadingHistory ? (
                <div className="chat-empty-state">
                  <p>Loading conversation history...</p>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => {
                  const isSent = msg.senderUsername === username
                  return (
                    <div
                      key={msg.id}
                      className={`message-group ${isSent ? "sent" : "received"}`}
                      id={`message-bubble-${msg.id}`}
                    >
                      <div className="message-bubble">{msg.content}</div>
                      <span className="message-meta">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="chat-empty-state">
                  <div className="empty-icon">💬</div>
                  <h3>No messages yet</h3>
                  <p>Send a message to start the conversation with {recipient}!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <footer className="chat-input-bar">
              <input
                id="message-send-input"
                type="text"
                className="chat-input-field"
                placeholder={`Type a message to ${recipient}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button 
                id="message-send-btn" 
                className="btn-send" 
                onClick={sendMessage}
              >
                Send
              </button>
            </footer>
          </>
        ) : (
          /* Empty placeholder state */
          <div className="chat-empty-state" id="conversation-empty-state">
            <div className="empty-icon">👋</div>
            <h2 style={{ fontSize: "28px", fontWeight: 600 }}>Welcome to ChatApp!</h2>
            <p style={{ maxWidth: "400px", color: "var(--text-secondary)" }}>
              Select a contact from the sidebar list, search for a username, or type a custom recipient name to start your secure real-time conversation.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default ChatPage
