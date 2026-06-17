import { useState } from "react"
import { useNavigate } from "react-router-dom"

function ChatPage() {
  const username = localStorage.getItem("username")
  const token = localStorage.getItem("token")
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    navigate("/")
  }

  const [recipient, setRecipient] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")

  const loadChat = async () => {
    const response = await fetch(`http://localhost:8080/api/messages/${recipient}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      setMessages(data)
    }
  }

  const sendMessage = async () => {
    const response = await fetch("http://localhost:8080/api/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ recipientUsername: recipient, content: newMessage })
    })
    if (response.ok) {
      setNewMessage("")
      loadChat()
    }
  }

  return (
    <div>
      <h2>ChatApp - {username} <button onClick={handleLogout}>Logout</button></h2>

      <div>
        <input
          type="text"
          placeholder="Enter recipient username"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <button onClick={loadChat}>Load Chat</button>
      </div>

      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.senderUsername}: </strong>{msg.content}
          </div>
        ))}
      </div>

      <div>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  )
}

export default ChatPage
