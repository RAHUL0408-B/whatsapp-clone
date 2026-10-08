# 💬 WhatsApp Clone

A full-stack, production-ready WhatsApp Web clone engineered with **Spring Boot 3**, **Java 21**, **React 19**, **PostgreSQL**, **Redis**, and **Apache Kafka**.

Designed with enterprise-grade real-time messaging patterns, resilient hybrid cloud deployment support (Render free tier + Docker Compose), JWT security, and a responsive WhatsApp Web interface.

---

## 🚀 Features

- **🔐 Secure Authentication**: JWT-based stateless authentication with token verification, registration, and login.
- **⚡ Real-Time Messaging**: Bidirectional WebSocket communication using STOMP over SockJS.
- **📬 Message Streaming & Decoupling**: Apache Kafka producer/consumer pipeline for scalable message routing.
- **🟢 User Presence Tracking**: Real-time Online/Offline and "Last Seen" timestamps powered by Redis and PostgreSQL.
- **🛡️ Cloud & Free-Tier Resilient**:
  - Automatically switches between Kafka/Redis distributed mode (local / full cloud) and direct persistence mode (e.g. Render free tier).
  - Built-in `RenderDatabaseUrlProcessor` automatically parses standard `postgres://` connection strings into JDBC format.
- **🐳 Containerized**: Complete multi-container `docker-compose.yml` for zero-configuration local orchestration.
- **📱 Responsive UI**: Pixel-accurate WhatsApp Web interface with search, chat list, message thread, and presence indicators.

---

## 🛠️ Architecture

```
[ React 19 Frontend ]
         │
         ├─── REST APIs (Auth, Users, Rooms) ───────────┐
         │                                              ▼
         └─── WebSocket (STOMP / SockJS) ───────► [ Spring Boot 3 Backend ]
                                                        │
                      ┌─────────────────────────────────┼──────────────────────────────┐
                      ▼                                 ▼                              ▼
             [ PostgreSQL ]                     [ Apache Kafka ]                [ Redis Cache ]
          (Persistent Storage)                (Message Streaming)             (Presence & Status)
                                                        │                              │
                                                        └────── (Optional Fallback) ───┘
```

---

## 🧰 Tech Stack

### **Backend**
- **Framework**: Spring Boot 3.3.5 (Java 21)
- **Security**: Spring Security 6 + JWT (`jjwt 0.12.6`)
- **Persistence**: Spring Data JPA + Hibernate + PostgreSQL Driver
- **Messaging**: Spring WebSocket (STOMP), Apache Kafka
- **Caching**: Spring Data Redis / Jedis
- **Build Tool**: Maven Wrapper (`mvnw`)

### **Frontend**
- **Library**: React 19
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Network**: Axios & `@stomp/stompjs` + `sockjs-client`

### **DevOps & Cloud**
- **Containers**: Docker & Docker Compose
- **Cloud Deployment**: Render (`render.yaml` Blueprint) & Vercel (`vercel.json`)

---

## 📁 Repository Structure

```
whatsapp-clone/
├── Dockerfile                             # Root multi-stage Docker build for backend
├── docker-compose.yml                     # Local multi-service stack (Postgres, Redis, Kafka, App)
├── render.yaml                            # Render Blueprint for automated full-stack deployment
├── whatsapp-backend/                      # Spring Boot backend source code
│   ├── src/main/java/...                  # Controllers, Services, Repositories, Configs
│   │   └── config/
│   │       ├── RenderDatabaseUrlProcessor.java  # Auto-config for cloud database URLs
│   │       ├── SecurityConfig.java
│   │       ├── WebSocketConfig.java
│   │       ├── RedisConfig.java
│   │       └── KafkaConfig.java
│   └── src/main/resources/
│       ├── application.properties         # Default development settings
│       └── application-render.properties  # Production Render cloud profile
└── whatsapp-frontend/                     # React frontend source code
    ├── src/
    │   ├── components/                    # Sidebar, ChatArea, MessageList, etc.
    │   ├── context/                       # AuthContext, WebSocketContext
    │   ├── services/                      # API and WebSocket service clients
    │   └── pages/                         # Login, Register, Chat
    └── vercel.json                        # Vercel deployment configuration
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- [Java 21 JDK](https://adoptium.net/) (optional if running via Docker)
- [Node.js 18+](https://nodejs.org/) (for frontend)

---

### Option 1: Run Full Stack with Docker Compose

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RAHUL0408-B/whatsapp-clone.git
   cd whatsapp-clone
   ```

2. **Start the backend infrastructure (Postgres, Redis, Kafka, Spring Boot):**
   ```bash
   docker compose up -d
   ```

3. **Start the React Frontend:**
   ```bash
   cd whatsapp-frontend
   npm install
   npm start
   ```

4. Open your browser at `http://localhost:3000`.

---

### Option 2: Run Backend and Frontend Directly

1. **Start PostgreSQL, Redis, and Kafka** (or run standalone via Docker):
   ```bash
   docker compose up -d postgres redis zookeeper kafka
   ```

2. **Run Spring Boot Backend:**
   ```bash
   cd whatsapp-backend
   ./mvnw spring-boot:run
   ```
   *On Windows Powershell:*
   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

3. **Run React Frontend:**
   ```bash
   cd ../whatsapp-frontend
   npm install
   npm start
   ```

---

## ⚙️ Environment Variables

### Backend (`whatsapp-backend/.env` or Render Dashboard)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `8080` |
| `SPRING_PROFILES_ACTIVE` | Active profile (`default` or `render`) | `default` |
| `DATABASE_URL` | Render / Heroku formatted DB connection string | - |
| `DB_HOST` | PostgreSQL hostname | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | PostgreSQL database name | `whatsapp_clone` |
| `POSTGRES_USER` | PostgreSQL username | `admin` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `0408` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `<random-secret>` |
| `JWT_EXPIRATION` | Token expiration time in milliseconds | `86400000` (24h) |
| `REDIS_ENABLED` | Toggle Redis caching & presence | `true` (`false` on Render) |
| `KAFKA_ENABLED` | Toggle Kafka message pipeline | `true` (`false` on Render) |

### Frontend (`whatsapp-frontend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `REACT_APP_API_URL` | Base URL of the backend API | `http://localhost:8080` |
| `REACT_APP_WS_URL` | WebSocket endpoint URL | `http://localhost:8080/ws` |

---

## 🌐 Deployment Guide

### Deploying Backend to Render

This repository includes a ready-to-use [`render.yaml`](./render.yaml) Blueprint:

1. Connect your repository to **[Render](https://render.com/)**.
2. Create a new **Blueprint** and select this repository.
3. Render will provision:
   - **PostgreSQL Database** (`whatsapp-postgres-db`)
   - **Spring Boot Backend Web Service** (`whatsapp-backend`)
4. **Cloud Resilience Features:**
   - Automatically activates `SPRING_PROFILES_ACTIVE=render`.
   - Excludes Kafka and Redis configurations gracefully to run on Render's free tier.
   - Converts Render's `DATABASE_URL` / `DATABASE_INTERNAL_URL` automatically at startup.
   - Includes `/api/auth/health` health check endpoint.

### Deploying Frontend to Vercel

1. Import the repository into **[Vercel](https://vercel.com/)**.
2. Set the **Root Directory** to `whatsapp-frontend`.
3. Add the Environment Variable:
   - `REACT_APP_API_URL`: `https://<your-render-backend-url>.onrender.com`
4. Deploy!

---

## 📡 API & WebSocket Reference

### Key REST Endpoints

| Method | Endpoint | Description | Public? |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/health` | Health check endpoint | Yes |
| `POST` | `/api/auth/register` | Register new user account | Yes |
| `POST` | `/api/auth/login` | Login and obtain JWT token | Yes |
| `GET` | `/api/users` | List registered users | No |
| `GET` | `/api/chat/rooms` | Retrieve active chat rooms | No |
| `POST` | `/api/chat/message/send` | Fallback REST send message | No |
| `GET` | `/api/presence/{email}` | Query user online status & last seen | Yes |

### WebSocket STOMP Endpoints

- **Connection Endpoint**: `/ws` (with SockJS fallback)
- **Send Message Destination**: `/app/sendMessage`
- **Subscribe to Room Messages**: `/topic/room/{roomId}`
- **User Presence Topic**: `/topic/presence`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
