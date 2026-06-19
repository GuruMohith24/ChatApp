import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Client } from "@stomp/stompjs"

function ChatPage() {
  const username = localStorage.getItem("username")
  const token = localStorage.getItem("token")
  const navigate = useNavigate()

  const [recipient, setRecipient] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const stompClient = useRef<Client | null>(null)

  useEffect(() => {
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws",
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        console.log("Connected to WebSocket!")
        client.subscribe("/user/queue/messages", (message) => {
          const received = JSON.parse(message.body)
          setMessages((prev) => [...prev, received])
        })
      },
      onDisconnect: () => console.log("Disconnected from WebSocket"),
    })
    client.activate()
    stompClient.current = client

    return () => { client.deactivate() }
  }, [])

  const handleLogout = () => {
    stompClient.current?.deactivate()
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    navigate("/")
  }

  const loadChat = async () => {
    const response = await fetch(`http://localhost:8080/api/messages/${recipient}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      setMessages(data)
    }
  }

  const sendMessage = () => {
    if (stompClient.current?.connected) {
      stompClient.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ recipientUsername: recipient, content: newMessage })
      })
      setMessages((prev) => [...prev, {
        id: Date.now(),
        senderUsername: username,
        recipientUsername: recipient,
        content: newMessage
      }])
      setNewMessage("")
    }
  }

  return (
    <div>
      <h2>ChatApp - {username} <button onClick={handleLogout}>Logout</button></h2>
      <div>
        <input type="text" placeholder="Enter recipient username"
          value={recipient} onChange={(e) => setRecipient(e.target.value)} />
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
        <input type="text" placeholder="Type a message..."
          value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  )
}

export default ChatPage
