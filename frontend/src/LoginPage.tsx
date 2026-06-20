import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async () => {
    setError("")
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields")
      return
    }

    try {
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
        setError("Invalid username or password")
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again later.")
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">
          <h1 className="auth-title" id="login-app-title">ChatApp</h1>
          <p className="auth-subtitle">Sign in to start messaging in real-time</p>
        </header>

        {error && <div className="alert-error" id="login-error-msg">{error}</div>}

        <div className="form-group">
          <label className="form-label" htmlFor="username-input">Username</label>
          <input
            id="username-input"
            type="text"
            className="input-field"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password-input">Password</label>
          <input
            id="password-input"
            type="password"
            className="input-field"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <button id="login-submit-btn" className="btn-primary" onClick={handleLogin}>
          Sign In
        </button>

        <footer className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register" className="auth-link" id="register-redirect-link">
            Register here
          </Link>
        </footer>
      </div>
    </div>
  )
}

export default LoginPage
