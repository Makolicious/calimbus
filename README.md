# Calendar Kanban

A web application that displays your Google Calendar events and Google Tasks in a Kanban-style board with custom columns. Drag and drop items between columns to organize your workflow visually.

## Features

- **Google Calendar Integration**: View all your calendar events
- **Google Tasks Integration**: See your tasks alongside calendar events
- **Custom Columns**: Create, edit, and delete your own workflow categories
- **Drag & Drop**: Easily move items between columns
- **Visual Organization**: Column assignments are for visual organization only (doesn't modify your Google Calendar)
- **Cloud Sync**: Your column configuration syncs across devices via Supabase

## Prerequisites

- Node.js 18+ installed
- A Google Cloud account
- A Supabase account

## Setup Instructions

### 1. Install Dependencies

```bash
cd google-calendar-kanban
npm install
```

### 2. Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Enable the following APIs:
   - Google Calendar API
   - Google Tasks API
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > OAuth client ID**
6. Select **Web application**
7. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
8. Copy the **Client ID** and **Client Secret**

### 3. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once created, go to **Project Settings > API**
3. Copy the **Project URL**, **anon public key**, and **service_role key**
4. Go to **SQL Editor** and run the migration script from `supabase/migrations/001_initial_schema.sql`

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your credentials in `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=any_random_string_for_encryption
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click **Sign in with Google** on the landing page
2. Authorize the app to access your calendar and tasks
3. Your events and tasks will appear in the Kanban board
4. Drag items between columns to organize them
5. Click the **...** menu on columns to edit or delete them
6. Click **Add Column** to create new categories

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **NextAuth.js** (Google OAuth)
- **@hello-pangea/dnd** (Drag and Drop)
- **Supabase** (PostgreSQL database)
- **Google APIs** (Calendar & Tasks)

## Important Notes

- Moving items between columns is for **visual organization only** - it does NOT modify your Google Calendar events or tasks
- The app only requests **read-only** access to your calendar and tasks
- Column assignments are stored in Supabase and sync across devices
