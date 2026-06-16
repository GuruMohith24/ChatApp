import { useState } from "react"
import { Link } from "react-router-dom"
function RegisterPage(){
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const handleRegister = async () => {
        const response = await fetch("http://localhost:8080/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username , email, password })
        })
    
        if (response.ok) {
          alert("Registeration successful! Please Login.")
        } else {
          alert("Registeration failed! Try again")
        }
    }  
    return<>
        <div>
        <h1>ChatApp</h1>
        <label>Username</label>
        <input type="text" placeholder="Enter username"
        value={username}
        onChange={(e) => 
            setUsername(e.target.value)
        }
        />
        <label>Email</label>
        <input type="text" placeholder="Enter email id"
        value={email}
        onChange={(e) => 
            setEmail(e.target.value)
        }
        />
        <label>Password</label>
        <input type="password" placeholder="Enter password"
        value={password}
        onChange={(e) => 
            setPassword(e.target.value)
        }
        />
        <button onClick={handleRegister}>Register</button>
        </div>
        <Link to="/">Already have an account? Login</Link>
    </>
}
export default RegisterPage