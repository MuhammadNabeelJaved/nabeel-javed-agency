# Live Chat Handoff System — Design Spec
**Date:** 2026-04-17  
**Feature:** AI-to-Human Live Chat Handoff  
**Approach:** Option C — Dedicated `/livechat` Socket.IO namespace

---

## Overview

When a public visitor is chatting with the Nova AI chatbot and requests to speak with a real person, the chatbot creates a live chat session. An admin or team agent accepts the session from a dedicated admin dashboard page. Once accepted, the AI stops responding and only the human agent communicates with the visitor in real time.

---

## Architecture

```
Public Visitor (anonymous)              Admin / Agent (authenticated)
        │                                           │
 [Chatbot widget]                      [/admin/live-chat page]
   triggers handoff                     sees queue + active chats
        │                                           │
        └──────── Socket.IO /livechat ──────────────┘
                      namespace
                          │
                     MongoDB Atlas
                  LiveChatSession
                  LiveChatMessage
```

### Key Principle
- Visitors connect to `/livechat` namespace **without JWT** (anonymous, identified by `sessionId` UUID)
- Agents connect to the same `/livechat` namespace **with JWT** (verified server-side on join)
- The chatbot's `sessionId` (already stored in visitor localStorage) is the shared key linking the AI session to the live chat session

---

## Data Models

### `LiveChatSession` (`server/src/models/usersModels/LiveChatSession.model.js`)

| Field | Type | Notes |
|---|---|---|
| `sessionId` | String, unique, indexed | Chatbot UUID — links to `ChatbotSession` |
| `visitorName` | String, required | Collected before connecting |
| `visitorEmail` | String, optional | |
| `status` | enum: `waiting \| active \| closed \| missed` | Default: `waiting` |
| `agentId` | ref User, nullable | Set when agent accepts |
| `startedAt` | Date | When visitor joined queue |
| `acceptedAt` | Date | When agent accepted |
| `closedAt` | Date | When session ended |
| `closedBy` | enum: `agent \| visitor \| system` | |
| `tags` | String[] | Admin labels (e.g. "billing", "technical") |
| `agentNotes` | String | Internal only, not shown to visitor |
| `userAgent` | String | Visitor browser/device info |
| `pageUrl` | String | Page visitor was on when they initiated chat |

### `LiveChatMessage` (`server/src/models/usersModels/LiveChatMessage.model.js`)

| Field | Type | Notes |
|---|---|---|
| `sessionId` | String, indexed | Foreign key to `LiveChatSession.sessionId` |
| `sender` | enum: `visitor \| agent \| system` | |
| `senderId` | ref User, nullable | Null for visitor/system messages |
| `content` | String | Message text |
| `timestamp` | Date | Default: now |
| `readByAgent` | Boolean | Default: false |
| `readByVisitor` | Boolean | Default: false |

---

## Socket.IO Events — `/livechat` namespace

### Visitor → Server
| Event | Payload | Purpose |
|---|---|---|
| `lc:visitor_join` | `{ sessionId, visitorName, visitorEmail?, pageUrl?, userAgent? }` | Register visitor in queue, create `LiveChatSession` |
| `lc:message` | `{ sessionId, content }` | Send a message |
| `lc:typing` | `{ sessionId, isTyping }` | Typing indicator |
| `lc:close` | `{ sessionId }` | Visitor ends the chat |

### Agent → Server
| Event | Payload | Purpose |
|---|---|---|
| `lc:agent_join` | `{ token }` | Authenticate agent, join agent room |
| `lc:agent_accept` | `{ sessionId }` | Accept a waiting session |
| `lc:message` | `{ sessionId, content }` | Send a message |
| `lc:typing` | `{ sessionId, isTyping }` | Typing indicator |
| `lc:close` | `{ sessionId }` | Agent ends the chat |

### Server → Client (room: `lc:session:{sessionId}`)
| Event | Payload | Purpose |
|---|---|---|
| `lc:new_message` | `{ sessionId, sender, content, timestamp, senderId? }` | Broadcast new message |
| `lc:typing_indicator` | `{ sessionId, sender, isTyping }` | Broadcast typing state |
| `lc:session_update` | `{ sessionId, status, agentId?, agentName? }` | Status change (accepted, closed) |

### Server → Agent room (`lc:agents`)
| Event | Payload | Purpose |
|---|---|---|
| `lc:queue_update` | `{ sessions: LiveChatSession[] }` | Full queue refresh |
| `lc:new_session` | `{ session }` | New visitor entered queue |
| `lc:session_closed` | `{ sessionId }` | Session removed from queue/active |

---

## Backend

### New Files
- `server/src/models/usersModels/LiveChatSession.model.js`
- `server/src/models/usersModels/LiveChatMessage.model.js`
- `server/src/controllers/usersControllers/liveChat.controller.js`
- `server/src/routes/userRoutes/liveChat.route.js`

### Modified Files
- `server/src/socket/socketServer.js` — add `/livechat` namespace handler
- `server/src/controllers/usersControllers/chatbot.controller.js` — block AI response when `sessionMode === 'human'`
- `server/src/app.js` — mount `/api/v1/live-chat` router

### REST Endpoints (all require `admin` role except stats which allows `team` too)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/live-chat/sessions` | List all sessions; filter by `status`, `agentId`, `date` |
| GET | `/api/v1/live-chat/sessions/:id` | Session detail + all messages |
| PATCH | `/api/v1/live-chat/sessions/:id` | Update `tags`, `agentNotes`, `status` |
| DELETE | `/api/v1/live-chat/sessions/:id` | Hard delete (GDPR) |
| GET | `/api/v1/live-chat/stats` | `{ total, waiting, active, closed, missed, avgWaitTime }` |
| GET | `/api/v1/live-chat/messages/:sessionId` | Full message history for a session |

### AI Handoff Block
In `chatbot.controller.js` public chat endpoint: before calling Claude, check if a `LiveChatSession` with this `sessionId` exists and `status !== 'closed'`. If yes, return a system message: `"You are now connected with a live agent. I'll step aside!"` and skip the AI call.

---

## Frontend — Public Chatbot (`client/src/components/Chatbot.tsx`)

### Changes
1. **"Talk to a person" button** — added to chatbot header (alongside minimize/close)
2. **Phrase detection** — when user message contains keywords (`live agent`, `real person`, `talk to human`, `speak with someone`, `connect me`) → show a CTA pill button: `"Connect with an agent →"`
3. **Pre-connect form** — small inline form in the chat: "Your name" (required) + "Email" (optional) + "Connect" button
4. **Status indicator** — replaces Nova's name/status area:
   - `⏳ Waiting for an agent...` (pulsing dot)
   - `🟢 Connected with [Agent Name]`
   - `Session ended`
5. **Socket connection** — on connect, join `/livechat` namespace and emit `lc:visitor_join`
6. **Message routing** — when `sessionMode === 'human'`, messages go via socket `lc:message` instead of the SSE chat endpoint
7. **Disconnect cleanup** — on chatbot close while session active, emit `lc:close`

### New State
```ts
liveChatMode: 'none' | 'connecting' | 'waiting' | 'active' | 'closed'
liveChatAgent: { name: string; photo?: string } | null
```

---

## Frontend — Admin Live Chat Page (`client/src/pages/admin/LiveChat.tsx`)

### Route: `/admin/live-chat`

### Layout: Two-panel (same pattern as `Messages.tsx`)

**Left Panel — Sessions List**
- Tabs: `Waiting` (badge) | `Active` | `Closed`
- Each row: visitor name, wait time / duration, last message preview, agent avatar or "Unassigned"
- Real-time updates via `lc:queue_update` and `lc:session_update`
- Search bar (by visitor name / email) + date picker for Closed tab
- Clicking a row opens it in the right panel

**Right Panel — Chat Interface**
- Header: visitor name, email, status badge, Close Session button
- Chat messages: visitor (right-aligned), agent (left-aligned), system (centered italic)
- Typing indicator
- Input box + Send button
- **Sidebar toggle** (info panel):
  - Visitor info: name, email, page URL, user agent, started at
  - Chatbot history: AI messages before handoff
  - Tags: chip input
  - Agent Notes: textarea (auto-save on blur)

**Stats Bar (top of page)**
- `Active now` | `Waiting` | `Today's total` | `Avg wait time`
- Real-time via `useDataRealtime('live-chat', refetch)`

**Agent Availability Toggle**
- `Available / Busy` pill toggle in page header
- When `Busy`, new sessions are not auto-routed to this agent (they still appear in queue)

### New API client: `client/src/api/liveChat.api.ts`

---

## Sidebar & Search

### `Sidebar.tsx` — `DEFAULT_LINKS`
```ts
{ name: 'Live Chat', path: '/admin/live-chat', icon: MessageCircle }
```
Badge shows count of `waiting` sessions (same pattern as Messages unread badge).

### `DashboardSearch.tsx` — `ADMIN_ITEMS`
```ts
{ id: 'a-live-chat',       label: 'Live Chat',         path: '/admin/live-chat',              icon: MessageCircle, group: 'Pages',   description: 'Manage live visitor chat sessions' },
{ id: 'a-live-chat-waiting', label: 'Waiting Sessions', path: '/admin/live-chat?tab=waiting', icon: Clock,         group: 'Pages',   keywords: ['queue', 'visitor'] },
{ id: 'a-live-chat-closed',  label: 'Chat History',     path: '/admin/live-chat?tab=closed',  icon: History,       group: 'Pages',   keywords: ['transcript', 'logs'] },
```

### Router (`client/src/App.tsx` or wherever admin routes are defined)
Add: `<Route path="live-chat" element={<LiveChat />} />`

---

## Real-time Sync

| Trigger | Socket event | Who receives |
|---|---|---|
| New visitor in queue | `lc:new_session` + `lc:queue_update` | All agents in `lc:agents` room |
| Agent accepts | `lc:session_update` | Visitor + all agents |
| New message | `lc:new_message` | Everyone in `lc:session:{id}` room |
| Session closed | `lc:session_closed` + `lc:session_update` | Everyone |
| Admin CRUD (stats refresh) | `emitDataUpdate(io, 'live-chat', ['admin:global'])` | Admin dashboard |

**Notification on new session:** `createAndEmitNotification` → type `message`, title `"New live chat request"` → all admins get bell notification.

---

## What Is NOT Included (YAGNI)
- File/image sharing in live chat
- Multi-agent collaboration on same session
- Canned responses / saved replies
- Email transcript to visitor on session close
- Auto-assignment / round-robin routing

These can all be added in a future iteration.

---

## File Checklist

### New files
- `server/src/models/usersModels/LiveChatSession.model.js`
- `server/src/models/usersModels/LiveChatMessage.model.js`
- `server/src/controllers/usersControllers/liveChat.controller.js`
- `server/src/routes/userRoutes/liveChat.route.js`
- `client/src/pages/admin/LiveChat.tsx`
- `client/src/api/liveChat.api.ts`

### Modified files
- `server/src/socket/socketServer.js`
- `server/src/controllers/usersControllers/chatbot.controller.js`
- `server/src/app.js`
- `client/src/components/Chatbot.tsx`
- `client/src/components/Sidebar.tsx`
- `client/src/components/DashboardSearch.tsx`
- `client/src/App.tsx` (or wherever admin routes are registered)
