# Nabeel Javed Agency

A full-stack agency website and CMS platform — featuring client project management, team dashboards, job postings, an AI-powered chatbot (Nova AI), and a comprehensive admin panel.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Dev server & bundler (port 5173) |
| React Router DOM v6 | Client-side routing |
| Tailwind CSS + shadcn/ui | Styling & UI components |
| Framer Motion | Animations & transitions |
| Lucide React | Icon library |
| Sonner | Toast notifications |

### Backend
| Technology | Purpose |
|---|---|
| Express 5 | REST API (port 8000, prefix `/api/v1/`) |
| MongoDB Atlas + Mongoose | Database |
| JWT | Auth (access + refresh tokens) |
| Resend SDK | OTP & transactional emails |
| Multer + Cloudinary | File uploads (images, PDFs, docs) |
| Socket.IO | Real-time events across dashboards |

### AI & Search
| Technology | Purpose |
|---|---|
| Anthropic Claude API | Nova AI chatbot (Haiku + Sonnet) |
| OpenAI text-embedding-3-small | Semantic search embeddings |
| Supabase pgvector | Vector database for RAG |

---

## Features

### Public Website
- **Multi-language support** — EN / ES / FR / DE / JP
- **Announcement bar** — infinite ticker with admin-managed items
- **Services, Portfolio, About, Careers** pages
- **Job listings & applications** — with resume upload and email notifications
- **Cookie consent system** (GDPR) — granular controls with audit log
- **Page status manager** — set any page to Active / Maintenance / Coming Soon

### Nova AI Chatbot
- Floating widget on public site + full-page assistants in user & team dashboards
- **5-layer cost optimization pipeline**: Rate limit → Greeting → Off-topic → FAQ match → Response cache → AI API
- **RAG system**: 3-layer retrieval (Supabase pgvector semantic search → MongoDB full-text → recency fallback)
- **Smart model routing**: simple queries → Claude Haiku, complex → Claude Sonnet
- **CTA navigation buttons**: chatbot injects clickable page buttons when relevant pages are mentioned
- **Typewriter animation**, resizable drag handles, chat history persistence
- **Role-based knowledge**: public / user / team access tiers
- Web crawler — auto-indexes site pages into the knowledge base
- Cost & usage tracking with admin dashboard

### Admin Dashboard (`/admin`)
- Client project requests — approve, reject, assign team members
- Portfolio project management (CMS)
- Job management & applicant tracking (hire → auto-upgrades user role to team)
- Content editor — Hero, Services, Testimonials, Tech stack, Process, Contact, Social links
- Nav & Footer manager (logo, navigation links, footer sections, privacy policy)
- Announcement manager — color presets, live preview, speed control
- Page status manager — 36 built-in pages + custom URLs
- Cookie consent stats & audit log
- Nova AI admin panel — Knowledge Base, Configuration, Conversation Logs, Cost & Usage

### Team Dashboard (`/team`)
- View assigned client projects & portfolio projects
- Team AI assistant with full project context
- Applied jobs tracking
- Support ticket system

### User Dashboard (`/user-dashboard`)
- Submit & track project requests with file attachments
- View applied job applications with status & admin notes
- Personal AI assistant with project, billing & account context
- Profile management & password change
- Support ticket system

### Real-Time Sync
- Socket.IO rooms: `admin:global`, `team:global`, `user:{id}`, `/public` namespace
- Every CRUD operation reflects across all dashboards without page reload
- In-app notifications for project status changes, assignments, and messages

---

## Project Structure

```
/
├── client/                  # React 18 + TypeScript frontend
│   └── src/
│       ├── api/             # Typed API client wrappers
│       ├── components/      # Shared UI components
│       ├── contexts/        # Auth, Theme, Content, Language, Cookie
│       ├── hooks/           # Custom hooks (sidebar prefs, data realtime)
│       ├── layouts/         # PublicLayout, AdminLayout, TeamLayout, UserLayout
│       └── pages/           # Route-level page components
│           ├── admin/
│           ├── team/
│           ├── user/
│           └── public/
│
└── server/                  # Express 5 + MongoDB backend
    └── src/
        ├── controllers/     # Route handlers
        ├── models/          # Mongoose schemas
        ├── routes/          # Express routers
        ├── middlewares/     # Auth, Cloudinary, logging
        ├── services/        # RAG, embedding, vector, crawler
        └── utils/           # Email, notifications, socket helpers
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- Resend account (email)
- Anthropic API key
- (Optional) OpenAI API key + Supabase project (for RAG/semantic search)

### Environment Variables

**`server/.env`**
```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
RESEND_API_KEY=your_resend_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
ANTHROPIC_API_KEY=your_anthropic_key
ENCRYPTION_KEY=64_char_hex_string
OPENAI_API_KEY=your_openai_key        # optional, for RAG
SUPABASE_URL=your_supabase_url        # optional, for RAG
SUPABASE_SERVICE_KEY=your_supabase_key # optional, for RAG
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=your_admin_email
```

**`client/.env`**
```env
VITE_API_URL=http://localhost:8000
```

### Installation

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Seed initial data (admin user, pages, etc.)
cd server && node src/seed.js

# Start backend (with memory flag for RAG operations)
cd server && node --max-old-space-size=4096 node_modules/.bin/nodemon src/index.js

# Start frontend
cd client && npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:8000/api/v1

---

## User Roles

| Role | Dashboard | Access |
|---|---|---|
| `admin` | `/admin` | Full platform control |
| `team` | `/team` | Assigned projects, team tools |
| `user` | `/user-dashboard` | Own projects, jobs, billing |

---

## Default Admin Credentials
> Run `node src/seed.js` in the server directory — credentials are printed to the console on first run.

---

## License

This project is proprietary. All rights reserved © Nabeel Javed.
