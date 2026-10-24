# Deployment & Development Guide

This guide covers local environment setup, database migrations, email configuration, testing, and Vercel serverless deployment for PaisaWise.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or later (Tested on Node v20 & v24).
- **npm**: v9.0.0 or higher.
- **Git**: Installed and configured.
- **FFmpeg** *(Optional for video recording pipeline)*: Gyan full build build 9.0.2+.

---

## 2. Local Development Setup

### Clone Repository & Install Dependencies
```bash
git clone https://github.com/Sushant-shringi/Paisawise.git
cd "D:\PERSONAL FINANCE MANAGEMENT PLATFORM"
npm install
```

### Environment Configuration
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

#### Complete Environment Variable Reference:
```env
# Frontend Supabase Client
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
VITE_APP_URL=http://localhost:5173

# Backend Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsIn...

# Gmail SMTP Email OTP Relay
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-google-app-password
SMTP_FROM="PaisaWise Security <your-email@gmail.com>"

# Google Sheets Client ID (Optional for OAuth GIS)
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

---

## 3. Dual Database Architecture

PaisaWise implements a polymorphic database adapter (`server/db.ts`):

1. **Production Mode (Supabase PostgreSQL):**  
   When `DATABASE_URL` is provided, PaisaWise initializes a connection pool via `pg.Pool` targeting Supabase PostgreSQL in the `ap-south-1` (Mumbai) region with SSL encryption.
2. **Local Fallback Mode (`node:sqlite`):**  
   If no PostgreSQL connection is detected, PaisaWise automatically initializes an in-memory SQLite database (`node:sqlite`), creates all tables, and seeds initial data so the application is immediately testable without external cloud accounts.

---

## 4. Gmail SMTP Setup for Live Email OTP

To enable real 6-digit verification codes sent to users' inboxes:
1. Log in to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Enable **2-Step Verification**.
3. Under **App passwords**, create a new app password named `PaisaWise`.
4. Copy the 16-character generated string into `SMTP_PASS` in `.env`.
5. Ensure `SMTP_USER` is your full Gmail address and `SMTP_PORT=465`.

---

## 5. Running the Application Locally

Start both the Vite frontend and Express server concurrently:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`

---

## 6. Testing

Run automated Vitest test suites:
```bash
npm run test
```
All unit tests verify:
- Currency formatting (₹ Lakhs and Crores).
- Precision math rounding (`roundMoney`).
- Google Sheets deduplication algorithms.
- Authentication validation.

---

## 7. Production Build & Vercel Deployment

### Build Verification
```bash
npm run build
```
This script executes:
1. `tsc -b`: Validates TypeScript across all components.
2. `vite build`: Compiles production frontend assets into `dist/`.
3. `npm run build:server`: Bundles `server/api.ts` into `api/index.js` via `esbuild`.

### Deploy to Vercel
```bash
npx vercel --prod
```

### Vercel Routing Configuration (`vercel.json`)
```json
{
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```
All `/api/*` calls are routed to the Express serverless function in `api/index.js`, while all client routes resolve to the Single Page Application (`index.html`).
