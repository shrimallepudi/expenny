# Expensa — Expense & Budget Tracker

A full-stack Next.js app with Supabase backend, email/password auth, and per-user data isolation.

---

## Step 1 — Create a Supabase Project

1. Go to **https://supabase.com** and sign up (free).
2. Click **"New Project"**.
3. Fill in:
   - **Name**: `expensa` (or anything you like)
   - **Database Password**: choose a strong password and save it
   - **Region**: pick the one closest to you (e.g. South Asia for India)
4. Click **"Create new project"** and wait ~2 minutes for it to spin up.

---

## Step 2 — Run the Database Migration

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar.
2. Click **"New Query"**.
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project.
4. Copy the entire contents and paste into the SQL editor.
5. Click **"Run"** (or press Ctrl+Enter).

You should see "Success. No rows returned." — your tables are ready.

---

## Step 3 — Get Your API Keys

1. In your Supabase dashboard, go to **Settings → API** (left sidebar).
2. Copy these two values:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon / public key** — a long JWT string

---

## Step 4 — Configure Environment Variables

Open the `.env.local` file in this project and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 5 — Enable Email Auth in Supabase

1. In Supabase dashboard → **Authentication → Providers**.
2. Make sure **Email** is enabled (it is by default).
3. Optional: under **Authentication → Email Templates**, customise the confirmation email.
4. Optional: to skip email confirmation during development, go to **Authentication → Settings** and turn off "Enable email confirmations".

---

## Step 6 — Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:3000** — you'll be redirected to the login page. Create an account and start tracking!

---

## Step 7 — Deploy to Vercel (Recommended)

Vercel is the easiest way to host a Next.js app — free tier is generous.

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, then set environment variables:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Redeploy with env vars
vercel --prod
```

### Option B: Deploy via GitHub (Recommended)

1. Push this project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/expensa.git
   git push -u origin main
   ```

2. Go to **https://vercel.com** → **"New Project"** → Import your GitHub repo.

3. In the "Environment Variables" section during setup, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key

4. Click **"Deploy"**. Vercel gives you a free `your-app.vercel.app` URL.

---

## Step 8 — Configure Auth Redirect URL (for production)

Once deployed, tell Supabase where to redirect after email confirmation:

1. Supabase dashboard → **Authentication → URL Configuration**.
2. Under **"Redirect URLs"**, add your production URL:
   ```
   https://your-app.vercel.app/auth/callback
   ```
3. Also update **"Site URL"** to `https://your-app.vercel.app`.

---

## Other Hosting Options

### Netlify
```bash
npm run build
# Deploy the `.next` folder via Netlify dashboard or CLI
# Set env vars in Netlify → Site Settings → Environment Variables
```

### Self-hosted VPS (Ubuntu/Debian)
```bash
# On your server
git clone https://github.com/YOUR_USERNAME/expensa.git
cd expensa
npm install
npm run build

# Set env vars
cp .env.local.example .env.local
nano .env.local   # fill in your values

# Run with PM2 (keeps it alive)
npm install -g pm2
pm2 start npm --name expensa -- start
pm2 save
pm2 startup
```

Use Nginx as a reverse proxy pointing to port 3000.

---

## Project Structure

```
expensa/
├── src/
│   ├── app/
│   │   ├── layout.js           # Root layout
│   │   ├── page.js             # Main app page (server component)
│   │   ├── login/page.js       # Login / signup / forgot password
│   │   └── auth/callback/      # Supabase auth callback
│   ├── components/
│   │   ├── AppShell.js         # Main client shell with all state
│   │   ├── SheetListing.js     # Monthly sheet list view
│   │   ├── SheetGrid.js        # Excel-like day grid
│   │   ├── BudgetPlanner.js    # Budget planning tab
│   │   ├── CalendarView.js     # Year calendar view
│   │   ├── MasterSettings.js   # Category management
│   │   └── ui.js               # Shared UI primitives
│   ├── lib/
│   │   ├── constants.js        # Design tokens, category data
│   │   ├── db.js               # All Supabase data access functions
│   │   └── supabase/
│   │       ├── client.js       # Browser Supabase client
│   │       └── server.js       # Server Supabase client
│   ├── middleware.js            # Auth guard (redirects to /login)
│   └── styles/globals.css      # Global CSS
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Run this in Supabase SQL Editor
├── .env.local                  # Your secrets (never commit this)
├── next.config.js
└── package.json
```

---

## Security Notes

- Row Level Security (RLS) is enabled — each user can only read/write their own data.
- The `.env.local` file is in `.gitignore` — never commit your keys.
- The `anon` key is safe to expose in the browser (Supabase RLS enforces access control).

---

## Need Help?

- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Vercel docs: https://vercel.com/docs
