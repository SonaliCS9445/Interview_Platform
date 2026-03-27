# Talent IQ – Architecture Documentation

## Overview

**Talent IQ** is a full-stack online coding interview and coaching platform that enables real-time interactive coding sessions between candidates and interviewers. The system combines a modern React frontend with a Node.js backend, supporting live code execution, chat, and session management.

---

## System Architecture

### High-Level Deployment Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Frontend: React + Vite (SPA)                     │   │
│  │  • Pages: Home, Problems, Dashboard, Session            │   │
│  │  • Components: Editor, Output, Chat, Modal             │   │
│  │  • State: useAxiosAuth, useSessions, useStreamClient    │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↓ Axios HTTP                ↓ WebSocket / Stream        │
└─────────────────────────────────────────────────────────────────┘
         │                                    │
         ↓ REST API                           ↓ Real-time Events
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      Express.js + Node.js (server.js)                    │   │
│  │                                                          │   │
│  │  Routes:  /api/sessions, /api/chat, /api/code           │   │
│  │  │                                                       │   │
│  │  │  ↓ Controllers (Business Logic)                       │   │
│  │  ├─ sessionController.js → Session CRUD, status         │   │
│  │  ├─ chatController.js → Conversation management         │   │
│  │  └─ codeController (implied) → Code execution          │   │
│  │  │                                                       │   │
│  │  │  ↓ Models & Middleware                                │   │
│  │  ├─ Session.js, User.js (Mongoose/ODM)                 │   │
│  │  └─ protectRoute.js (Auth middleware)                  │   │
│  │                                                          │   │
│  │  Libraries:                                              │   │
│  │  • db.js → MongoDB connection                           │   │
│  │  • env.js → Config & secrets                            │   │
│  │  • stream.js → Event streaming (WebSocket)              │   │
│  │  • inngest.js → Async event-driven jobs                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↓ MongoDB Driver              ↓ External APIs            │
└─────────────────────────────────────────────────────────────────┘
         │                                    │
         ↓                                    ↓
    ┌────────────┐                    ┌──────────────┐
    │  MongoDB   │                    │ Piston API   │
    │  Database  │                    │ (Code Exec)  │
    └────────────┘                    └──────────────┘
```

---

## Frontend Architecture

### Directory Structure & Responsibilities

```
frontend/src/
├── pages/
│   ├── HomePage.jsx              ← Landing & onboarding
│   ├── ProblemsPage.jsx          ← Browse all problems
│   ├── ProblemPage.jsx           ← Single problem detail
│   ├── DashboardPage.jsx         ← User stats & sessions
│   └── SessionPage.jsx           ← Live editing interface (core)
│
├── components/
│   ├── CodeEditorPanel.jsx       ← Monaco editor / code input
│   ├── OutputPanel.jsx           ← Execution results
│   ├── ProblemDescription.jsx    ← Problem statement UI
│   ├── ActiveSessions.jsx        ← Current sessions list
│   ├── RecentSessions.jsx        ← Past session history
│   ├── StatsCards.jsx            ← User analytics tiles
│   ├── CreateSessionModal.jsx    ← Session creation flow
│   ├── VideoCallUI.jsx           ← Video integration (if enabled)
│   └── Navbar.jsx                ← Top navigation & auth
│
├── api/
│   └── sessions.js               ← Axios wrappers → backend /api/sessions
│
├── hooks/
│   ├── useAxiosAuth.js           ← Auth token + refresh logic
│   ├── useSessions.js            ← Session list state & fetching
│   └── useStreamClient.js        ← WebSocket / stream connection
│
├── lib/
│   ├── axios.js                  ← Base Axios instance + interceptors
│   ├── piston.js                 ← Code execution API client
│   ├── stream.js                 ← Real-time event stream setup
│   └── utils.js                  ← Utility functions
│
├── data/
│   └── problems.js               ← Static problem fixtures
│
├── main.jsx                      ← App bootstrapping (React 18)
├── App.jsx                       ← Root component & routing
└── index.css                     ← Global styles
```

### Page & Component Flow

```
Router (App.jsx)
 ├─ HomePage
 │   └─ WelcomeSection, CTA buttons
 ├─ ProblemsPage
 │   └─ List of ProblemDescription components
 ├─ ProblemPage
 │   └─ Full problem + CreateSessionModal trigger
 ├─ DashboardPage
 │   ├─ StatsCards (user metrics)
 │   ├─ ActiveSessions (current interviews)
 │   └─ RecentSessions (past sessions)
 └─ SessionPage (CORE INTERACTIVE PAGE)
    ├─ Navbar (back, user menu)
    ├─ ProblemDescription (left panel)
    │   └─ Problem statement & hints
    ├─ CodeEditorPanel (center)
    │   └─ Monaco editor + run button
    ├─ OutputPanel (right panel)
    │   ├─ Execution output
    │   └─ Chat / collaboration panel
    ├─ VideoCallUI (optional top/overlay)
    │   └─ Video streams & controls
    └─ [WebSocket stream feed → real-time updates]
```

---

## Backend Architecture

### Directory Structure & Responsibilities

```
backend/src/
├── server.js                     ← Express app entry point
│                                  ├─ Middleware setup (CORS, auth, body)
│                                  ├─ Route mounting
│                                  └─ Error handlers
├── routes/
│   ├── sessionRoutes.js          ← GET /api/sessions
│   │                              ├─ GET /:id
│   │                              ├─ POST (create)
│   │                              └─ PATCH /:id (update status)
│   ├── chatRoutes.js             ← POST /api/chat
│   │                              ├─ GET conversation history
│   │                              └─ POST new message
│   └── codeRoutes.js             ← POST /api/code/run
│                                  └─ Execute code & return output
├── controllers/
│   ├── sessionController.js      ← Business logic for sessions
│   │                              ├─ createSession()
│   │                              ├─ getSession()
│   │                              ├─ updateSessionStatus()
│   │                              ├─ endSession()
│   │                              └─ listUserSessions()
│   └── chatController.js         ← Business logic for messages
│                                  ├─ sendMessage()
│                                  └─ getConvergent History()
├── models/
│   ├── User.js                   ← User data schema (Mongoose)
│   │                              ├─ email, password, profile
│   │                              └─ timestamps
│   └── Session.js                ← Session data schema
│                                  ├─ participants
│                                  ├─ problem reference
│                                  ├─ status (active, completed)
│                                  ├─ code snapshots
│                                  └─ start/end times
├── middleware/
│   └── protectRoute.js           ← JWT/session verification
│                                  └─ Attach user to req
├── lib/
│   ├── db.js                     ← MongoDB connection & init
│   ├── env.js                    ← Config from .env
│   ├── stream.js                 ← WebSocket / SSE server
│   │                              └─ Broadcast real-time events
│   └── inngest.js                ← Event-driven async jobs
│                                  ├─ Session cleanup
│                                  ├─ Notifications
│                                  └─ Analytics aggregation
└── package.json                  ← Dependencies
```

---

## Data Flow Diagrams

### Flow 1: User Authentication & Session List Load

```
Browser
   ↓ (load app)
   └─→ App.jsx
       ├─ useAxiosAuth() hook
       │   ├─ Check localStorage for JWT token
       │   ├─ If expired → POST /api/auth/refresh
       │   └─ Provide axios instance with Authorization header
       │
       └─ useSessions() hook
           ├─ GET /api/sessions (with token)
           │
           └─ server.js
               ├─ Route: GET /api/sessions
               │   ├─ Middleware: protectRoute (verify JWT)
               │   ├─ Controller: sessionController.listUserSessions()
               │   │   ├─ Query: Session.find({ userId })
               │   │   └─ Filter by status (active, completed)
               │   │
               │   └─ MongoDB: Session collection
               │       └─ Return array of session docs
               │
               ├─ Axios interceptor: 200 OK
               └─ useState(() ⇐ sessions array)

UI Updated: ActiveSessions, RecentSessions render
```

### Flow 2: Create Session & Start Coding

```
User clicks "Start Session" → CreateSessionModal

Modal
 ├─ Select problem
 ├─ Select language
 └─ Click "Create"
    │
    ├─ POST /api/sessions { problemId, language, participants }
    │
    └─ server.js (sessionRoutes.js)
        ├─ Route: POST /api/sessions
        │   ├─ Middleware: protectRoute (get userId)
        │   ├─ Controller: sessionController.createSession()
        │   │   ├─ Create Session doc
        │   │   ├─ Set status = "active"
        │   │   ├─ session.save() → MongoDB
        │   │   │
        │   │   └─ Publish event: inngest JobRun
        │   │       └─ "session.started" → webhooks, notifications
        │   │
        │   └─ Response: { sessionId, createdAt, ... }
        │
        └─ Frontend: useSessions() refetch
            └─ ActiveSessions component updates

Redirect to SessionPage with sessionId
 ├─ CodeEditorPanel (empty editor)
 ├─ ProblemDescription (problem statement)
 ├─ OutputPanel (awaiting first run)
 └─ [WebSocket stream.js]: Subscribe to session events
```

### Flow 3: Execute Code

```
User clicks "Run" in CodeEditorPanel

CodeEditorPanel → OutputPanel
 │
 ├─ Gather code from editor
 ├─ POST /api/code/run { sessionId, code, language }
 │
 └─ server.js (codeRoutes.js)
    ├─ Route: POST /api/code/run
    │ ├─ Middleware: protectRoute
    │ ├─ Controller: codeController.executeCode()
    │ │   ├─ Save code to Session.codeSnapshot
    │ │   ├─ Call Piston API (external sandbox)
    │ │   │   └─ language, code, input (stdin)
    │ │   │
    │ │   ├─ Response: { output, stderr, runtime, exitCode }
    │ │   │
    │ │   └─ Publish event: inngest
    │ │       └─ "code.executed" → analytics, chat context
    │ │
    │ └─ Response: execution result JSON
    │
    └─ Frontend: axios response handler
        ├─ Update OutputPanel: { output, exitCode, logs }
        ├─ Publish to stream: "codeRun:executed"
        │   └─ Other participants see update in real-time
        │
        └─ useSessions() may refetch if session data changed
```

### Flow 4: Real-Time Chat & Collaboration

```
useStreamClient() hook
 └─ WebSocket connection to stream.js
    │
    ├─ On mount: ws.subscribe(`/session/${sessionId}`)
    │
    └─ Listen for events:
       ├─ "message:received"
       │   └─ New chat message → append to OutputPanel
       │
       ├─ "codeRun:executed"
       │   └─ Another user ran code → update output
       │
       ├─ "session:statusChanged"
       │   └─ Session closed → redirect to dashboard
       │
       └─ "participant:joined" / "participant:left"
           └─ Update VideoCallUI presence

User types message in chat box
 ├─ POST /api/chat/send { sessionId, message }
 │
 └─ chatController.sendMessage()
    ├─ Save message to DB
    ├─ Publish WebSocket event to all connected clients
    │   └─ stream.js broadcast("message:received", {})
    │
    └─ All participants see chat instantly
```

---

## Key Components Deep Dive

### 1. **Authentication & Authorization**
- **Where**: `backend/src/middleware/protectRoute.js`
- **How**: JWT extracted from headers, verified, user attached to `req`
- **Used by**: All protected routes in `*Routes.js`
- **Frontend**: `useAxiosAuth` hook auto-injects token in every request
- **Refresh**: Axios interceptor on 401 → auto-refresh token

### 2. **Real-Time Streaming**
- **Backend**: `stream.js` manages WebSocket/SSE server
- **Inngest**: `inngest.js` publishes events (async, decoupled)
- **Frontend**: `useStreamClient` establishes connection, listens for events
- **Use cases**:
  - Code execution results (OutputPanel sync)
  - Chat messages (instant collaboration)
  - Session status (active → closed)
  - Presence (who is in the session)

### 3. **Code Execution Sandbox**
- **Client-side**: `frontend/src/lib/piston.js` wraps Piston API
- **Server-side**: Backend endpoint delegates to Piston
- **Safety**: Piston runs code in isolated container, returns output
- **Supported**: Multiple languages, configurable timeouts

### 4. **Session Lifecycle**
```
Create
  ↓
Active (participants edit code, chat, run)
  ↓
Paused / On-Hold
  ↓
Completed (archived, visible in RecentSessions)
  ↓
Deleted (optional)
```
- Stored in MongoDB `Session` collection
- Status changes published to stream → real-time UI updates

---

## Database Schema Overview

### User Collection
```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "password": "hashed",
  "name": "John Doe",
  "role": "candidate|interviewer|admin",
  "stats": {
    "sessionCount": 10,
    "problemsSolved": 5
  },
  "createdAt": "2026-03-27T...",
  "updatedAt": "2026-03-27T..."
}
```

### Session Collection
```json
{
  "_id": "ObjectId",
  "problemId": "ObjectId (link to problems)",
  "participants": [
    { "userId": "ObjectId", "role": "candidate|interviewer" }
  ],
  "status": "active|paused|completed",
  "codeSnapshot": {
    "language": "javascript",
    "code": "function solve() { ... }",
    "lastUpdated": "2026-03-27T..."
  },
  "startTime": "2026-03-27T...",
  "endTime": "2026-03-27T..." (if completed),
  "result": {
    "passed": true,
    "output": "...",
    "duration": 1200
  },
  "createdAt": "2026-03-27T...",
  "updatedAt": "2026-03-27T..."
}
```

### Chat Message (embedded in Session or separate)
```json
{
  "_id": "ObjectId",
  "sessionId": "ObjectId",
  "userId": "ObjectId",
  "message": "Great solution!",
  "timestamp": "2026-03-27T..."
}
```

---

## Deployment & Environment

### Environment Variables (`.env`)
```bash
# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/talentiq

# Server
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key

# Third-party APIs
PISTON_API_URL=https://api.piston.codingame.com
INNGEST_SIGNING_KEY=your-key

# Frontend
VITE_API_URL=http://localhost:5000
```

### Build & Run
```bash
# Backend
cd backend && npm install && npm start

# Frontend
cd frontend && npm install && npm run dev (dev) / npm run build (prod)
```

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| **Unauthorized API access** | JWT in `protectRoute.js` middleware |
| **Code injection** | Piston sandbox isolation; input validation |
| **Exposed secrets** | `.env` file (never commit); use cloud secrets in prod |
| **CORS attacks** | Backend sets `Access-Control-Allow-Origin` |
| **Data leaks** | Role-based filtering in queries (only own sessions) |
| **Session hijacking** | Short JWT expiry + refresh token rotation |

---

## Scalability Roadmap

1. **Database**: Shard sessions by `userId` or `status`
2. **API**: Separate auth service, gateway pattern
3. **Streaming**: Upgrade to Redis Pub/Sub for horizontal scaling
4. **Code Execution**: Dedicated Piston cluster or container orchestration
5. **Caching**: Redis for session metadata, frequently accessed problems
6. **Monitoring**: Logs aggregation, distributed tracing (OpenTelemetry)

---

## Quick Reference: API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/sessions` | List user's sessions |
| `GET` | `/api/sessions/:id` | Get session details |
| `POST` | `/api/sessions` | Create new session |
| `PATCH` | `/api/sessions/:id` | Update session status |
| `POST` | `/api/code/run` | Execute code |
| `GET` | `/api/chat/:sessionId` | Fetch chat history |
| `POST` | `/api/chat/send` | Send message |
| `POST` | `/api/auth/login` | User authentication |
| `POST` | `/api/auth/refresh` | Refresh JWT token |

---

## Development Tips

1. **Inspect payloads**: Use browser DevTools Network tab to check request/response bodies.
2. **Test stream**: Use client-side `stream.subscribe()` in browser console to verify real-time events.
3. **Mock Piston**: For offline dev, mock `/api/code/run` to return sample output.
4. **Debug userIds**: Add `console.log(req.user)` in `protectRoute.js` to verify auth.
5. **Trace async jobs**: Check `inngest.js` logs for missed events or failed webhooks.

---

## Summary

**Talent IQ** follows a **clean, layered architecture**:
- **Presentation** (React components + pages)
- **API Layer** (RESTful routes + controllers)
- **Business Logic** (session lifecycle, permissions)
- **Data** (MongoDB models)
- **Infrastructure** (auth, streaming, external APIs)

This design enables **real-time collaboration**, **secure code execution**, and **scalable growth**.
