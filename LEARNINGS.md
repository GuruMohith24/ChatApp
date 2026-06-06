# 📔 Engineering Notes: Real-Time Chat Application
> A comprehensive log of architectural decisions, technical definitions, and placement-ready interview concepts.

---

## 📅 Day 1: The Database & Entity Layer (JPA & Relational Modeling)

### 🧠 Core Concepts Learned
*   **Object-Relational Mapping (ORM)**: The translation layer that bridges the gap between the Object-Oriented world of Java and the Relational (Table/Row) world of SQL databases.
*   **JPA (Java Persistence API)**: A standardized Java specification (collection of interfaces) defining how to map Java classes to database tables.
*   **Hibernate**: The actual framework implementing the JPA specification under the hood in Spring Boot.
*   **Java's Generic Types (`<T, ID>`)**: Leveraged in `JpaRepository<User, Long>` to tell Spring's compiled engine exactly which entity class to manage and what data type its primary key holds.

### 🏛️ Key Architectural Decisions & Trade-Offs

#### 1. Why PostgreSQL instead of MongoDB?
*   **Decision**: We chose PostgreSQL (a Relational/SQL database).
*   **Trade-Off**: Real-time chats rely heavily on structured relations (Users sending Messages to other Users). SQL ensures **data integrity** through foreign keys and **ACID compliance** (guaranteeing that messages are never partially saved or corrupted). MongoDB (NoSQL) is great for unstructured document scaling, but SQL is ideal for highly relational user-to-user systems.

#### 2. Why `java.time.Instant` over `LocalDateTime` for Timestamps?
*   **Decision**: We used `Instant.now()` for `createdAt` timestamps.
*   **Trade-Off**: `LocalDateTime` represents timezone-blind local time (dependent on where the server runs). If the backend deploys to Railway in US-East, but a user is in Asia, timestamps become inaccurate. `Instant` always records time in UTC (Greenwich Mean Time) as a single point on the timeline. Timezones are handled strictly on the client (React frontend) side.

#### 3. Why `@ManyToOne` with `@JoinColumn` on Message Senders and Recipients?
*   **Decision**: We mapped `sender` and `recipient` relationships in `Message.java` using `@ManyToOne` and `@JoinColumn`.
*   **Trade-Off**: 
    *   From a single Message's perspective, there is only **one** sender and **one** recipient. But a User can send **many** messages. Thus, `@ManyToOne` is mathematically correct.
    *   We replaced `@Column(unique=true)` with `@JoinColumn(name="sender_id", nullable=false)`. If we kept `@Column(unique=true)`, the database would crash as soon as a user tried to send their second message, because foreign keys must support duplicates!

---

## 📅 Day 2: The Service Layer, Security & REST API Contracts

### 🧠 Core Concepts Learned
*   **Separation of Concerns**: Keeping controllers, services, and repositories strictly decoupled (Waiter ➔ Chef ➔ Pantry).
*   **Inversion of Control (IoC) & Beans**: Spring manages the lifecycle of our components. We do not write `new UserService()`; Spring automatically instantiates it as a **Bean** in its **IoC Container**.
*   **Constructor Dependency Injection**: Injecting beans using constructors. We annotated our classes with Lombok's `@RequiredArgsConstructor` to automatically generate constructor injection for all `private final` fields.
*   **Hashing vs. Encryption**: Encryption is a reversible two-way function (using a key). Hashing (like BCrypt) is a one-way, irreversible function. Passwords must be hashed so that even if the database is hacked, the plain-text passwords cannot be decrypted.
*   **DTOs (Data Transfer Objects)**: Simple classes used to pass data between the frontend and backend, keeping internal database structures decoupled from public API endpoints.
*   **`@RestController` vs. `@Controller`**: `@RestController` combines `@Controller` and `@ResponseBody` to serialize returned Java objects directly into JSON payloads.
*   **`@RequestBody`**: Instructs Spring to capture incoming JSON strings from the HTTP body and deserialize them into structured Java classes (like `RegisterRequest`).
*   **`ResponseEntity<T>`**: Represents the complete HTTP response (Body, Headers, Status Code), allowing us to return proper RESTful status codes (like `201 Created`).

### 🏛️ Key Architectural Decisions & Trade-Offs

#### 1. Why do we define `PasswordEncoder` as a `@Bean` in a `@Configuration` class?
*   **Decision**: Created `SecurityConfig.java` annotated with `@Configuration` to register `BCryptPasswordEncoder` as a `@Bean`.
*   **Trade-Off**: `PasswordEncoder` is an interface. By registering it as a `@Bean`, we instruct Spring's IoC container to inject `BCryptPasswordEncoder` automatically whenever any class declares a dependency on `PasswordEncoder`. This avoids hardcoding `new BCryptPasswordEncoder()` in multiple services, making it easy to swap hash algorithms in the future.

#### 2. Why do we map Entities to DTOs in the Controller?
*   **Decision**: We created `RegisterRequest` and `UserResponse` DTOs and map them inside `AuthController.java`.
*   **Trade-Off**: Returning raw `User` database entities would send `passwordHash` over the internet in JSON payloads — a catastrophic security vulnerability. By mapping to `UserResponse`, we guarantee that only safe, public fields are sent back to the frontend.

---

## 📅 Day 3: Stateless Authentication (JWT & Spring Security Architecture)

### 🧠 Core Concepts Learned
*   **JWT (JSON Web Token)**: A compact, self-contained token format for securely transmitting claims between parties. Consists of three Base64Url-encoded parts separated by dots: `Header.Payload.Signature`.
*   **JWT Header**: Contains metadata — the token type (`"typ": "JWT"`) and the signing algorithm (`"alg": "HS256"`).
*   **JWT Payload (Claims)**: Contains non-sensitive user data like `sub` (subject/username), `iat` (issued at), `exp` (expiration). **CRITICAL: Never store passwords or sensitive data here — JWTs are encoded, NOT encrypted. Anyone can decode the payload.**
*   **JWT Signature**: Computed as `HMACSHA256(Base64Url(Header) + "." + Base64Url(Payload), secret_key)`. This guarantees **integrity** — if someone tampers with the payload, the signature becomes invalid because they don't know the server's secret key.
*   **Stateless vs. Stateful Authentication**: Stateful stores sessions in server memory (requires sticky sessions or shared session stores). Stateless stores credentials in JWT tokens on the client side — no server memory needed, making it horizontally scalable.
*   **SecurityContextHolder**: The central component of Spring Security where the authenticated user's details are stored for the duration of a single HTTP request.
*   **OncePerRequestFilter**: A Spring filter base class that guarantees execution exactly once per request dispatch, preventing redundant security checks during internal forwards or redirects.
*   **UserDetailsService**: A core Spring Security interface with a single method `loadUserByUsername(String username)` — the bridge between your database and Spring Security's authentication system.

### 🏛️ Key Architectural Decisions & Trade-Offs

#### 1. Why JJWT (io.jsonwebtoken) over java-jwt (com.auth0)?
*   **Decision**: We used `io.jsonwebtoken:jjwt-api` version 0.12.5.
*   **Trade-Off**: JJWT is the most widely used JWT library in Spring Boot tutorials and production codebases. Version 0.12.x uses a modern builder API (`Jwts.builder().subject()` instead of the deprecated `setClaims()`), making it fully compatible with Spring Boot 3.x and Jakarta EE.

#### 2. Why a separate `JwtAuthFilter` instead of using Spring's built-in form login?
*   **Decision**: We created a custom `JwtAuthFilter` extending `OncePerRequestFilter`.
*   **Trade-Off**: Spring's default form-based login (`formLogin()`) is designed for server-rendered HTML pages with session cookies. Our React SPA sends JSON requests and expects JWT tokens — not HTML redirects. A custom filter reads the `Authorization: Bearer <token>` header, validates the JWT, and sets the `SecurityContext` programmatically.

#### 3. Decoupling JPA Entities from Spring Security (`UserDetails`)
*   **Decision**: We kept `User.java` as a pure JPA entity and converted it into a Spring Security `UserDetails` object inside the `UserDetailsService` bean in `SecurityConfig.java`.
*   **Trade-Off**: Implementing `UserDetails` directly on `User.java` would force Spring Security imports into our database domain layer. Creating the mapping in the config class maintains clean **separation of concerns** between security infrastructure and database models.

#### 4. Why Stateless Sessions for SPA Deployments?
*   **Decision**: Configured `SessionCreationPolicy.STATELESS` in Spring Security.
*   **Trade-Off**: The server creates no HTTP sessions. Each request must carry its own `Authorization: Bearer <token>` header. This works seamlessly with React (Vercel) talking to Spring Boot (Railway) across different domains, and eliminates the need for CSRF protection (since there are no cookies to exploit).

### 🔧 Files Created/Modified on Day 3
*   `JwtService.java` — Added `extractUsername()`, `extractExpiration()`, `isTokenExpired()`, `isTokenValid()`, `extractAllClaims()`, `extractClaim()` methods.
*   `JwtAuthFilter.java` — Complete `OncePerRequestFilter` implementation intercepting every request, validating Bearer tokens, and setting `SecurityContext`.
*   `UserService.java` — Unified `loginUser()` method returning `AuthResponse` (token + username) after credential verification.
*   `AuthController.java` — `/login` endpoint now delegates entirely to `UserService.loginUser()` with try/catch error handling.
*   `SecurityConfig.java` — Added `UserDetailsService` bean mapping JPA `User` to Spring Security `UserDetails`.
*   `AuthResponse.java` — New DTO with `token` and `username` fields for login responses.

---

## 📅 Day 4-5: The Messaging Layer & WebSocket Architecture

### 🧠 Core Concepts Learned

*   **HTTP vs. WebSocket**: HTTP follows a request-response model — the client requests, the server responds, and the connection is cut off. WebSocket is an **upgraded version of HTTP** that maintains a persistent, **full-duplex** connection. Both client and server can send data at any time without re-establishing connections or sending heavy headers repeatedly. This is what makes real-time chat possible.
*   **Full-Duplex Communication**: Both sides (client and server) can send messages to each other simultaneously over a single connection, like a phone call. HTTP is half-duplex — like a walkie-talkie where only one side talks at a time.
*   **STOMP (Simple Text Oriented Messaging Protocol)**: A lightweight messaging protocol layered on top of WebSocket. It provides conventions for message routing using destinations like `/app/chat.send` and `/queue/messages`, similar to how HTTP has URL paths.
*   **SimpMessagingTemplate**: Spring's built-in tool for pushing messages to specific users over WebSocket. `convertAndSendToUser(username, destination, payload)` delivers a message to a specific connected user in real-time.
*   **`@MessageMapping`**: The WebSocket equivalent of `@PostMapping`. Maps incoming STOMP messages to handler methods. When a client sends a message to `/app/chat.send`, the method annotated with `@MessageMapping("/chat.send")` handles it.
*   **`@Payload`**: The WebSocket equivalent of `@RequestBody`. Deserializes the incoming STOMP message body into a Java DTO.
*   **`Principal`**: A Spring Security interface representing the authenticated user. Injected automatically into controller methods — `principal.getName()` returns the logged-in user's username. Works for both REST and WebSocket handlers (once WebSocket auth is configured).
*   **`@PathVariable`**: Extracts a value from the URL path. In `@GetMapping("/api/messages/{username}")`, the `{username}` placeholder is injected into the method parameter annotated with `@PathVariable`.
*   **Java Streams & `.map()`**: Used to transform a `List<Message>` (database entities) into a `List<ChatMessageResponse>` (DTOs). The `.stream().map(msg -> ...).collect(Collectors.toList())` pipeline applies a transformation function to each element.
*   **Spring Data JPA Derived Query Methods**: Spring automatically generates SQL from method names. `findBySenderAndRecipientOrRecipientAndSenderOrderByCreatedAtAsc` parses into: `WHERE (sender=? AND recipient=?) OR (recipient=? AND sender=?) ORDER BY created_at ASC`.

### 🏛️ Key Architectural Decisions & Trade-Offs

#### 1. Why WebSocket instead of HTTP Polling for Real-Time Chat?
*   **Decision**: We configured WebSocket with STOMP via `@EnableWebSocketMessageBroker` in `WebSocketConfig.java`.
*   **Trade-Off**: HTTP polling would require the client to repeatedly ask "any new messages?" every few seconds — wasting bandwidth with redundant requests and heavy headers. WebSocket keeps a single persistent connection open, and the server **pushes** new messages instantly. The trade-off is that WebSocket connections consume server memory (each connected user holds an open socket), but for a chat app the real-time benefit far outweighs this cost.

#### 2. Why SockJS Fallback on the WebSocket Endpoint?
*   **Decision**: We configured `.withSockJS()` on the `/ws` STOMP endpoint.
*   **Trade-Off**: Not all networks and browsers support raw WebSocket connections (corporate firewalls, older proxies can block them). SockJS provides automatic fallback to HTTP long-polling or streaming if WebSocket fails. The trade-off is a slightly larger client-side library, but it guarantees connectivity for all users.

#### 3. Why a Simple Broker instead of an External Message Broker (RabbitMQ/Kafka)?
*   **Decision**: We used `registry.enableSimpleBroker("/topic", "/queue")` — an in-memory broker built into Spring.
*   **Trade-Off**: A simple broker stores subscriptions in server memory. If the server restarts, all active subscriptions are lost. For production at scale, you'd use RabbitMQ or Kafka as external brokers for durability and horizontal scaling. But for our learning project, the simple broker avoids infrastructure complexity while teaching the same STOMP concepts.

#### 4. Why Separate REST and WebSocket Endpoints for Messaging?
*   **Decision**: `ChatController` has both `@GetMapping("/api/messages/{username}")` for history and `@MessageMapping("/chat.send")` for real-time sending.
*   **Trade-Off**: Chat history is a classic request-response pattern (load old messages when opening a chat window) — perfect for REST. Sending new messages needs real-time push — perfect for WebSocket. Using the right protocol for the right job keeps the architecture clean.

### 🐛 Bug Found & Fixed: Query Parameter Ordering

*   **Bug**: `getChatHistory` only returned messages sent in one direction (alice → bob), missing replies (bob → alice).
*   **Root Cause**: The repository call `findBySenderAndRecipientOrRecipientAndSenderOrderByCreatedAtAsc(user1, user2, user2, user1)` had parameters in the wrong order.
*   **Why**: Spring Data JPA maps parameters positionally. The method name parses as:
    *   Condition 1: `Sender = param1, Recipient = param2` → alice → bob ✅
    *   Condition 2: `Recipient = param3, Sender = param4` → `Recipient = bob, Sender = alice` → same as Condition 1! ❌
*   **Fix**: Changed to `(user1, user2, user1, user2)`:
    *   Condition 1: `Sender = alice, Recipient = bob` → alice → bob ✅
    *   Condition 2: `Recipient = alice, Sender = bob` → bob → alice ✅
*   **Lesson**: When using Spring Data JPA derived queries with OR conditions, always **trace the parameter positions manually** against the method name to verify each condition tests what you intend.

### 🔧 Files Created/Modified on Day 4-5
*   `MessageService.java` — Added `sendMessage()` and `getChatHistory()` methods with proper `Optional` handling, User lookups, and DTO mapping using Java Streams.
*   `ChatController.java` — **NEW**. REST endpoint for chat history (`@GetMapping`) + WebSocket handler for real-time messaging (`@MessageMapping`) + temporary REST send endpoint for Postman testing.
*   `SecurityConfig.java` — Added `/ws/**` to `permitAll()` so WebSocket handshake can pass through Spring Security.
*   `MessageRepository.java` — Already had `findBySenderAndRecipientOrRecipientAndSenderOrderByCreatedAtAsc` from Day 4.

---

## 🧠 Active Recall Placement Flashcards

#### Q: What is the difference between `@Component`, `@Service`, and `@Repository`?
> **Answer**: They are all stereotypic annotations that register a class as a Spring Bean. However, `@Service` is a semantic indicator for business logic, and `@Repository` has a built-in feature that catches JDBC exceptions and translates them into Spring's unified `DataAccessException`.

#### Q: Why is Constructor Injection preferred over Field Injection (using `@Autowired` directly on a private variable)?
> **Answer**: Constructor Injection ensures that:
> 1. Dependencies are **immutable** (marked as `final`).
> 2. The class cannot be instantiated in a "broken" state without its required dependencies.
> 3. The class remains easy to unit-test because you can manually inject mock dependencies via its constructor without needing a heavy Spring container.

#### Q: How does BCrypt secure passwords against brute force attacks?
> **Answer**: BCrypt uses a **slow hashing algorithm** (adaptive hashing). You can configure a "Work Factor" (strength) to make the hashing process computationally expensive. This slows down brute-force and dictionary attacks significantly. It also automatically incorporates a random **salt** for each password, preventing "rainbow table" lookup attacks.

#### Q: What is the fundamental difference between HTTP and WebSocket?
> **Answer**: HTTP is a **request-response** protocol — the client sends a request, the server responds, and the connection is closed. Every request requires full headers. WebSocket is a **persistent, full-duplex** protocol — after an initial HTTP handshake upgrade, the connection stays open and both sides can send data at any time without reconnecting. This makes WebSocket ideal for real-time applications like chat.

#### Q: What does `@MessageMapping` do and how does it relate to `@PostMapping`?
> **Answer**: `@MessageMapping("/chat.send")` is the WebSocket/STOMP equivalent of `@PostMapping`. It maps incoming STOMP messages sent to `/app/chat.send` (prefixed by the application destination prefix configured in `WebSocketConfig`) to a handler method. `@Payload` replaces `@RequestBody` for deserializing the message body.

#### Q: Why did the `getChatHistory` query only return one-directional messages?
> **Answer**: Spring Data JPA maps method parameters **positionally** to the parsed method name. The method `findBySenderAndRecipientOrRecipientAndSender` creates two conditions joined by OR. With parameters `(user1, user2, user2, user1)`, both conditions resolved to the same query (alice→bob). Fixing to `(user1, user2, user1, user2)` made Condition 2 correctly find bob→alice messages.

---

## 📈 Git & GitHub Best Practices

### 🔄 The Essential Git Command Flow

Here is the correct, industry-standard terminal syntax:

1.  **Check status of files**:
    ```bash
    git status
    ```
2.  **Stage your changes** (add files to the tracking index):
    ```bash
    git add .
    ```
3.  **Commit your changes locally** with a descriptive, professional commit message:
    ```bash
    git commit -m "feat: implement User Registration endpoint with DTOs"
    ```
4.  **Push your code** to the remote repository (GitHub) on the `main` branch:
    ```bash
    git push origin main
    ```

### ❓ Should you push your code every single day?
**YES, absolutely!** Here is why:
1.  **Recruiter Impression**: GitHub tracks your daily commits on a visual **Green Contribution Grid**. Recruiters love seeing consistent, day-to-day coding activity during placement evaluations.
2.  **Safety Net**: If your computer's hard drive crashes tonight, your hard work from today is saved securely in the cloud.
3.  **Deployment Prep**: Later on, when we link Railway and Vercel, every time you `git push`, your cloud hosting providers will automatically detect the changes and deploy the latest version of your app!
