import { BrowserRouter, Routes, Route } from "react-router-dom"
import LoginPage from "./LoginPage"
import RegisterPage from "./RegisterPage"
import ChatPage from "./ChatPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
