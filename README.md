# Todo Tracker

A minimalist todo list application with multi-device sync, built with React and Supabase.

## Features

- ✅ **Quick Todo Management**: Add and check off tasks quickly
- 📅 **Timestamp Tracking**: Every action is timestamped
- ⏱️ **Days on List**: Shows how long each item has been on your list
- 🔄 **Periodic Tasks**: Auto-regenerate daily, weekly, monthly, or custom recurring tasks
- 💤 **Snooze Functionality**: Snooze tasks for 1-7 days
- 👤 **User Authentication**: Google OAuth login
- 📋 **Multiple Lists**: Create and manage separate todo lists
- 📱 **Multi-device Sync**: Access from laptop and mobile devices
- 🎨 **Minimalist Design**: Clean, distraction-free interface

## Setup

### Prerequisites

1. Create a [Supabase](https://supabase.com) account and project
2. Set up Google OAuth in your Supabase project

### Database Setup

1. In your Supabase project dashboard, go to the SQL editor
2. Run the SQL commands from `schema.sql` to create the database tables and functions

### Google OAuth Setup

1. Go to your Supabase project dashboard → Authentication → Providers
2. Enable Google provider
3. Follow the instructions to set up OAuth with Google Cloud Console
4. Add your domain (both localhost for development and your production domain) to the authorized domains

### Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Supabase project details:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Deployment

The app is ready to deploy to Vercel:

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add your environment variables in Vercel's dashboard
4. Deploy!

## How It Works

### Periodic Tasks

When you mark a periodic task as complete, the system automatically creates a new instance of that task with a future creation date based on the period you specified. The completed task remains visible but grayed out at the top of the completed section.

### Days on List Counter

The "days on list" counter resets to 0 when you uncheck a completed item, giving you a fresh start to work on that task.

### Snoozing

Snoozed tasks are hidden from the main list and appear in a separate "Snoozed" section. They automatically become visible again when the snooze period expires.

## Tech Stack

- **Frontend**: React with Vite
- **Backend**: Supabase (PostgreSQL + real-time + auth)
- **Styling**: CSS (no frameworks)
- **Hosting**: Vercel
- **Authentication**: Google OAuth via Supabase

## Cost

- **Supabase**: Free tier (up to 50MB database, 2GB bandwidth)
- **Vercel**: Free tier (100GB bandwidth, unlimited deployments)
- **Total cost**: $0 for personal use

Perfect for small teams or personal use!
