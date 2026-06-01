# 💬 ChatApp — Real-Time Chat Application

A production-grade real-time chat application built from scratch as a learning project for placement interviews. Every architectural decision is intentional, documented, and interview-ready.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Java 21, Spring Boot 3.5 |
| **Security** | Spring Security, JWT (jjwt 0.12.5), BCrypt |
| **Database** | PostgreSQL |
| **ORM** | Spring Data JPA (Hibernate) |
| **Real-Time** | WebSockets (planned) |
| **Frontend** | React (planned) |
| **Deployment** | Railway (backend), Vercel (frontend) |

## 📐 Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   React UI  │────▶│  Spring Boot API  │────▶│  PostgreSQL  │
│  (Vercel)   │◀────│   (Railway)       │◀────│  (Railway)   │
└─────────────┘     └──────────────────┘     └──────────────┘
                           │
                    ┌──────┴──────┐
                    │ JWT Auth    │
                    │ (Stateless) │
                    └─────────────┘
```

### Why Stateless Authentication?
- No server-side session storage — each request carries its own credentials via `Authorization: Bearer <token>`
- Horizontally scalable — any backend instance can verify a token without shared state
- Optimized for serverless/containerized deployments (Railway, Vercel)

## 🗂️ Project Structure

```
chatapp/src/main/java/chatapp/com/chatapp/
├── config/
│   ├── SecurityConfig.java        # PasswordEncoder, UserDetailsService beans
│   └── JwtAuthFilter.java         # OncePerRequestFilter — intercepts & validates JWTs
├── controller/
│   ├── AuthController.java        # POST /api/auth/register, POST /api/auth/login
│   └── UserController.java        # Protected user endpoints
├── dto/
│   ├── RegisterRequest.java       # Registration payload
│   ├── LoginRequest.java          # Login payload
│   ├── AuthResponse.java          # JWT token response
│   └── UserResponse.java          # Safe user data (no passwordHash)
├── model/
│   ├── User.java                  # JPA entity — users table
│   └── Message.java               # JPA entity — messages table
├── repository/
│   ├── UserRepository.java        # JPA queries for User
│   └── MessageRepository.java     # JPA queries for Message
└── service/
    ├── UserService.java           # Registration + login business logic
    └── JwtService.java            # Token generation, parsing, validation
```

## 🔐 Authentication Flow

```
1. User sends POST /api/auth/register with {username, email, password}
   → Password hashed with BCrypt → User saved to PostgreSQL

2. User sends POST /api/auth/login with {username, password}
   → Credentials verified against DB → JWT token returned

3. User sends requests with header: Authorization: Bearer <token>
   → JwtAuthFilter intercepts → Validates signature & expiry
   → Sets SecurityContext → Request reaches controller
```

## 🚀 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ Public | Register a new user |
| `POST` | `/api/auth/login` | ❌ Public | Login and receive JWT |
| `GET` | `/api/user/` | 🔒 Protected | User endpoints (WIP) |

## ⚙️ Local Development

### Prerequisites
- Java 21
- PostgreSQL running locally
- Database named `chatapp` created

### Setup
```bash
# Clone the repository
git clone https://github.com/GuruMohith24/ChatApp.git
cd ChatApp/chatapp

# Set environment variables (or use defaults)
export DB_URL=jdbc:postgresql://localhost:5432/chatapp
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export JWT_SECRET=your-secret-key-at-least-32-characters-long

# Build and run
./mvnw spring-boot:run
```

The application starts on `http://localhost:8080`.

## 🏗️ Build Status

### ✅ Completed
- Database entities (User, Message) with proper JPA relationships
- User registration with BCrypt password hashing
- User login with credential verification
- JWT token generation, parsing, and validation (jjwt 0.12.5)
- JWT authentication filter (`OncePerRequestFilter`)
- Spring Security `UserDetailsService` integration
- DTOs to prevent sensitive data leakage (passwordHash never exposed)

### 🔲 In Progress
- `SecurityFilterChain` configuration (CSRF disabled, stateless sessions, endpoint permissions)
- End-to-end auth flow testing

### 📋 Planned
- WebSocket integration for real-time messaging
- Message send/receive endpoints
- Online status tracking
- Chat history with pagination
- React frontend
- Railway + Vercel deployment

## 📔 Engineering Journal

Detailed architectural decisions, trade-offs, and interview flashcards are documented in [`LEARNINGS.md`](./LEARNINGS.md).

## 📄 License

This project is built for educational purposes and placement interview preparation.

---

Built by [GuruMohith24](https://github.com/GuruMohith24)
