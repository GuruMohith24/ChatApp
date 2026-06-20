import { useState } from "react"
import { Link } from "react-router-dom"

function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleRegister = async () => {
    setError("")
    setSuccess("")

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields")
      return
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      })

      if (response.ok) {
        setSuccess("Registration successful! You can now log in.")
        setUsername("")
        setEmail("")
        setPassword("")
      } else {
        const text = await response.text()
        setError(text || "Registration failed! Try again.")
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again later.")
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">
          <h1 className="auth-title" id="register-app-title">ChatApp</h1>
          <p className="auth-subtitle">Create a new account to get started</p>
        </header>

        {error && <div className="alert-error" id="register-error-msg">{error}</div>}
        {success && <div className="alert-success" id="register-success-msg">{success}</div>}

        <div className="form-group">
          <label className="form-label" htmlFor="register-username">Username</label>
          <input
            id="register-username"
            type="text"
            className="input-field"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            className="input-field"
            placeholder="Enter email id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            className="input-field"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          />
        </div>

        <button id="register-submit-btn" className="btn-primary" onClick={handleRegister}>
          Register
        </button>

        <footer className="auth-footer">
          Already have an account?{" "}
          <Link to="/" className="auth-link" id="login-redirect-link">
            Login here
          </Link>
        </footer>
      </div>
    </div>
  )
}

export default RegisterPage