import { useState } from "react"
import { Link, useNavigate} from "react-router-dom"
function LoginPage() {
  const navigate = useNavigate()  
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async () => {
    const response = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })

    if (response.ok) {
      const data = await response.json()
      localStorage.setItem("token", data.token)
      localStorage.setItem("username", data.username)
      navigate("/chat")
    } else {
      alert("Login failed!")
    }
  }

  return (
    <div>
      <h1>ChatApp</h1>
      <label>Username</label>
      <input type="text" placeholder="Enter username"
      value={username}
      onChange={(e) => 
        setUsername(e.target.value)
      }
      />
      <label>Password</label>
      <input type="password" placeholder="Enter password"
      value={password}
      onChange={(e) => 
        setPassword(e.target.value)
      }
      />
      <button onClick={handleLogin}>Login</button>
      <Link to="/register">Don't have an account? Register</Link>
    </div>
  )
}

export default LoginPage
