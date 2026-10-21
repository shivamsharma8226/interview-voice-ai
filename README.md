# InterviewAI — AI-Powered Mock Interview Platform

**InterviewAI** is an AI-powered mock interview platform that conducts realistic technical, system design, full-stack, HR, and behavioral interviews based on a candidate's resume, technical skills, experience level, and target job role.

It features server-side resume intelligence (PDF/DOCX extraction), text-to-speech question playback, speech-to-text answers with an editable transcript buffer, real-time rubric-based evaluations, adaptive follow-up probing, and a 7-day personalized study curriculum.

---

## Architecture & Technology Stack

### Frontend (`client/`)
- **Framework**: Next.js 14 (App Router) with React 18 & TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom Dark Navy & Charcoal SaaS theme (`#060913`, `#0b1120`, `#0f172a`, `#1e293b`)
- **Icons**: Lucide React
- **Analytics & Charts**: Recharts (score progression area charts and competency bar graphs)
- **Voice System**: Web Speech API (`SpeechSynthesis` with voice selection + `SpeechRecognition` with live streaming transcript buffer)

### Backend (`server/`)
- **Runtime**: Node.js v24 + Express.js with TypeScript
- **Database**: MongoDB v8 with Mongoose ODM
- **Authentication**: JWT authentication with bcryptjs password hashing and user isolation
- **Resume Parsing**: `pdf-parse` (PDF) and `mammoth` (DOCX) with strict MIME validation and prompt injection neutralization
- **Validation**: Zod schema validation across all request payloads and AI responses
- **Security**: Helmet, CORS origin restriction, rate limiting (`express-rate-limit`), and safe error handling

### AI Intelligence Layer (`server/src/services/aiService.ts`)
- **Dual-Engine Architecture**:
  1. **Intelligent Local Engine** (active by default): High-fidelity AST/ontology extraction of 200+ industry skills, section parsing, rubric-based grading, adaptive follow-up triggering, and personalized 7-day study plans. Completely free, deterministic, and requires zero external API keys.
  2. **Cloud LLM Adapter**: Configurable integration for Google Gemini (`gemini-1.5-flash`, etc.) and OpenAI-compatible endpoints (`gpt-4o-mini`, Groq, Ollama) via standard environment variables.
- **Strict Anti-Hallucination & Anti-Injection**: Resumes are treated as untrusted input; embedded prompt overrides are automatically flagged and stripped.

---

## Directory Structure

```text
/home/czm023/Shivam/Self/Voice/
├── package.json              # Root workspace scripts & concurrently launcher
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules for node_modules, build artifacts, env
├── README.md                 # Complete system documentation
│
├── server/                   # Backend Express & TypeScript Application
│   ├── src/
│   │   ├── config/           # Environment validation (env.ts) and DB connection (db.ts)
│   │   ├── models/           # Mongoose schemas: User, Resume, Interview, Question, Answer
│   │   ├── controllers/      # AuthController, ResumeController, InterviewController
│   │   ├── services/         # AIService (dual-engine), ResumeParserService
│   │   ├── middleware/       # Auth (JWT), Upload (Multer PDF/DOCX), Rate Limiting
│   │   ├── routes/           # REST endpoints: auth, resumes, interviews, ai, voice
│   │   ├── types/            # Zod schemas and TypeScript interfaces
│   │   ├── app.ts            # Express application setup
│   │   └── server.ts         # Server entrypoint with DB connection
│   ├── tests/
│   │   └── api.test.ts       # 23 automated integration tests (Supertest + Vitest)
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
└── client/                   # Frontend Next.js 14 App Router Application
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx             # Public landing page with interactive preview
    │   │   ├── login/page.tsx       # Sign in page
    │   │   ├── register/page.tsx    # Sign up page
    │   │   ├── dashboard/page.tsx   # Dashboard with metrics and Recharts progress graphs
    │   │   ├── resumes/page.tsx     # Resume upload, profile viewer & inline editor
    │   │   ├── interviews/
    │   │   │   ├── new/page.tsx     # Interview setup & category configuration
    │   │   │   ├── [id]/page.tsx    # Live interview room (voice + text + timer)
    │   │   │   └── [id]/report/     # Comprehensive performance report & 7-day study plan
    │   │   └── history/page.tsx     # Historical sessions list, filters, and report viewer
    │   ├── components/
    │   │   ├── Navbar.tsx           # Responsive navigation with live AI status pill
    │   │   └── AudioWaveform.tsx    # Real-time animated audio visualizer
    │   ├── lib/
    │   │   ├── api.ts               # Typed REST API client with JWT handling
    │   │   ├── authContext.tsx      # React authentication state provider
    │   │   ├── speech.ts            # Web Speech API TTS and STT controller
    │   │   └── types.ts             # Shared frontend TypeScript interfaces
    │   └── styles/
    │       └── globals.css          # Dark Navy design system tokens & print styles
    ├── package.json
    ├── tailwind.config.ts
    ├── next.config.mjs
    └── tsconfig.json
```

---

## Setup & Running Instructions

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24.21.0)
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI running on port `27017`

### 2. Install Dependencies
Run in the root directory:
```bash
# Install root devDependencies (concurrently)
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 3. Environment Configuration
Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```
Default configuration values in `server/.env`:
```ini
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/interviewai
JWT_SECRET=super_secret_jwt_key_interviewai_local_dev_1234567890
JWT_EXPIRES_IN=7d
LLM_PROVIDER=local
LLM_API_KEY=
LLM_MODEL=gemini-1.5-flash
```

### 4. Run Both Servers in Development
From the root workspace directory:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000/api`
- **Frontend App**: `http://localhost:3000`

Or run them individually in separate terminals:
```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev:client
```

---

## Automated Test Suite

Run the automated integration and unit test suite:
```bash
npm run test
```
The test suite (`server/tests/api.test.ts`) verifies:
- User registration, duplicate email prevention, and credential login
- Password hashing and JWT generation
- Prompt injection neutralization and resume text sanitization
- Structured candidate profile extraction
- Cross-user data isolation (User B cannot access User A's resumes or sessions)
- Interview creation with custom parameters (role, category, difficulty)
- Rubric concealment during in-progress interviews (realistic mode)
- Live answer evaluation against technical rubrics
- Adaptive follow-up probing when candidate responses lack edge-case depth
- Duplicate answer submission prevention (409 Conflict)
- Pause and resume state transitions
- Session finalization and calculation of overall score out of 100
- 7-day personalized study plan and competency breakdown generation
- Weak areas retry drill creation
- Health and status endpoints

**Result: 23 passing tests (100% pass rate).**

---

## Production Build Verification

Build both applications for production:
```bash
# Build backend TypeScript
npm run build:server

# Build frontend Next.js App Router
npm run build:client
```
Both builds compile with 0 errors.

---

## Deploy to production

Recommended setup: deploy the Express API to Railway, the Next.js client to Vercel, and use MongoDB Atlas for the database.

### 1. Create the MongoDB Atlas database

Create an Atlas cluster, create a database user, and copy its connection string. Put that value in `MONGODB_URI`. In Atlas Network Access, allow your Railway service to connect (for initial setup, `0.0.0.0/0` is the simple option; restrict it later if you have fixed egress addresses).

### 2. Deploy the backend on Railway

- Create a new Railway project from this repository.
- Set the service root directory to `server`.
- Set Build Command to `npm run build` and Start Command to `npm run start`.
- Add: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (a long random value), `JWT_EXPIRES_IN=7d`, and any AI or voice-provider variables you use.
- Generate a public Railway domain and copy it, for example `https://your-api.up.railway.app`.

### 3. Deploy the frontend on Vercel

- Import the same repository into Vercel.
- Set Root Directory to `client`.
- Vercel will detect Next.js; keep Build Command as `npm run build`.
- Add `BACKEND_URL=https://your-api.up.railway.app`. This project uses it to proxy `/api/*` requests; without it production would incorrectly point to localhost.
- If you use server voice features, also add `NEXT_PUBLIC_WS_URL=wss://your-api.up.railway.app`.
- Deploy and copy the Vercel URL, for example `https://your-app.vercel.app`.

### 4. Connect both services

In Railway, set `FRONTEND_URL` to the exact Vercel URL and redeploy the API. Then open `https://your-api.up.railway.app/api/health`; it should show `database: connected`. Finally, register a new user, upload a small PDF, and start a practice session from the Vercel site.

Never commit `.env` files, database passwords, JWT secrets, or provider keys. Add them only through Railway and Vercel environment-variable settings.

---

## AI Provider Configuration

### 1. Local Engine (Default)
No configuration required! The local engine provides deterministic, rubric-based evaluation and follow-up generation out-of-the-box.

### 2. Google Gemini
Set the following in `server/.env`:
```ini
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-1.5-flash
```

### 3. OpenAI or Groq Compatible Endpoint
```ini
LLM_PROVIDER=openai
LLM_API_KEY=your_openai_or_groq_key_here
LLM_MODEL=gpt-4o-mini
# Optional custom base URL:
# OPENAI_BASE_URL=https://api.groq.com/openai/v1
```

If an external API key fails or expires, the system returns a descriptive `502 Bad Gateway` error explaining that the AI provider call failed, rather than silently fabricating responses.

---

## Voice Interaction Guide

- **Text-to-Speech (Interviewer Questions)**: Handled by the browser's `window.speechSynthesis` API with natural voice selection. Users can mute, unmute, or replay any question.
- **Speech-to-Text (Candidate Answers)**: Handled by the browser's `SpeechRecognition` API. When the candidate clicks the glowing microphone button, their speech streams live into an editable transcript textarea.
- **Editable Transcript**: The candidate can review and correct any words before clicking "Submit Answer".
- **Text-Only Fallback**: Users without a microphone can switch to text mode at any time.

---

## REST API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`)
- `POST /api/auth/login` — Sign in and receive JWT token
- `POST /api/auth/logout` — Sign out
- `GET /api/auth/me` — Retrieve current authenticated user profile

### Resumes
- `POST /api/resumes` — Upload and analyze resume (`multipart/form-data`, file field: `resume`)
- `GET /api/resumes` — List all resumes for the authenticated user
- `GET /api/resumes/:id` — Retrieve resume details and parsed profile
- `PATCH /api/resumes/:id/profile` — Update candidate profile corrections
- `DELETE /api/resumes/:id` — Delete resume

### Interviews
- `POST /api/interviews` — Create a new interview session and generate questions
- `GET /api/interviews` — List interviews with pagination and category/status filtering
- `GET /api/interviews/:id` — Get interview session (answers/rubrics redacted during in-progress mode)
- `POST /api/interviews/:id/start` — Start interview (state -> `asking`)
- `POST /api/interviews/:id/answers` — Submit answer (`questionId`, `transcript`, `durationSeconds`)
- `POST /api/interviews/:id/pause` — Pause interview
- `POST /api/interviews/:id/resume` — Resume interview
- `POST /api/interviews/:id/complete` — Conclude interview early and generate report
- `GET /api/interviews/:id/report` — Retrieve comprehensive performance report
- `POST /api/interviews/:id/retry-weak-questions` — Create targeted drill session for weak areas
- `DELETE /api/interviews/:id` — Delete session and child records

### AI & Voice Status
- `GET /api/ai/status` — Get active LLM provider, model, and local engine status
- `POST /api/ai/test-connection` — Test connection to external AI provider
- `GET /api/voice/status` — Check speech recognition and synthesis readiness
- `GET /api/health` — System uptime and database connection status
