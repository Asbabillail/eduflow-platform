# EduFlow Platform

School Administration SaaS — Fee Quotation & Admission Engine

---

## What this is

EduFlow is a multi-tenant school administration platform built for international and private schools in KSA and the GCC. It handles fee quotations, discount approvals, PDF generation, and school configuration — configured per institution with no code changes required.

---

## Quick Setup (Do this once)

### Step 1 — Create a Supabase project

1. Go to **supabase.com** → Create account → New project
2. Choose a strong database password (save it somewhere safe)
3. Region: **Europe West** (closest to KSA with lowest latency)
4. Wait for it to provision (about 2 minutes)

### Step 2 — Run the database migrations

In Supabase Dashboard → **SQL Editor** → run each file in order:

```
supabase/migrations/001_schema.sql    ← Run first
supabase/migrations/002_rls.sql       ← Run second
supabase/migrations/003_auth_hook.sql ← Run third
supabase/migrations/004_demo_seed.sql ← Run fourth (loads demo school)
```

Copy each file's content, paste into SQL Editor, click **Run**.

### Step 3 — Enable the Auth Hook

In Supabase Dashboard:
1. Go to **Authentication → Hooks**
2. Find **Custom Access Token**
3. Click Enable
4. Select function: `public.custom_access_token_hook`
5. Save

This is what puts the `tenant_id` and `role` into each user's login token.

### Step 4 — Get your API keys

In Supabase Dashboard → **Project Settings → API**:
- Copy `Project URL`
- Copy `anon / public` key
- Copy `service_role` key (keep this secret — never put in browser)

### Step 5 — Set up the Next.js project

```bash
# Clone the repo (or open in GitHub Codespaces)
git clone https://github.com/YOUR_USERNAME/eduflow-platform.git
cd eduflow-platform

# Install dependencies
npm install

# Install shadcn/ui
npx shadcn@latest init
# When asked: TypeScript=yes, Tailwind=yes, App Router=yes, default import alias

# Copy environment file
cp .env.example .env.local

# Fill in your Supabase keys in .env.local
```

Edit `.env.local` and add your Supabase URL and keys.

### Step 6 — Create the demo user

In Supabase Dashboard → **Authentication → Users** → **Add User**:
- Email: `demo@yourdomain.com` (use whatever email you want to demo with)
- Auto Confirm User: YES

Then in **SQL Editor**, run:
```sql
-- Replace the values below with your actual data
-- First find the tenant_id for al-andalus:
SELECT id FROM tenants WHERE slug = 'al-andalus';

-- Then insert the user (replace the UUIDs):
INSERT INTO tenant_users (tenant_id, auth_user_id, role, full_name, email)
VALUES (
  'PASTE_TENANT_ID_HERE',
  'PASTE_AUTH_USER_ID_HERE',
  'tenant_admin',
  'Demo Administrator',
  'demo@yourdomain.com'
);
```

### Step 7 — Run locally

```bash
npm run dev
```

Open **http://localhost:3000**

Enter your demo email → receive OTP in your inbox → log in → you'll land at the Al Andalus demo school dashboard.

### Step 8 — Deploy to Vercel

1. Push the repo to GitHub
2. Go to **vercel.com** → Import project → Select your repo
3. Add all environment variables from `.env.local`
4. Deploy

Your live URL will be something like `https://eduflow-platform.vercel.app`

---

## Running tests

```bash
npm run test        # Watch mode
npm run test:run    # Run once
```

---

## Project structure

```
src/
├── app/
│   ├── (auth)/login/         Login page (email OTP)
│   └── [tenant]/(app)/       School app (dashboard, quotations, settings)
├── lib/
│   ├── supabase/             Database client (browser + server)
│   └── fee-engine/           Fee calculation (pure TypeScript, tested)
├── components/               UI components
└── types/                    TypeScript types
supabase/migrations/          Database SQL files
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14, TypeScript |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth, email OTP |
| Storage | Supabase Storage |
| PDF | Puppeteer + @sparticuz/chromium |
| Email | Resend |
| Hosting | Vercel |
| i18n | next-intl (Arabic + English) |
| UI | shadcn/ui + Tailwind CSS |

---

*Internal documentation only. Not for external distribution.*

<!-- deploy trigger -->
