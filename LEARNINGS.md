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
