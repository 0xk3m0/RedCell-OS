# 🔴 RedCell OS v4

## Quick Start
```bash
cd rc4
npm install
cp .env.example .env
npm start
# → http://localhost:3000
```

## New in v4
- **Dashboard**: Weekly focus chart, daily note, energy with mood
- **Settings**: 6 full sections (Profile · Appearance · Focus · Account · Stats · Danger Zone)
- **Accent colors**: Live preview, stored in DB, applied on login
- **Habits**: Color-coded, edit support, reorder
- **Focus**: Mood tracking per session
- **Review**: Mood field, load past weeks
- **Projects**: Priority, dates, notes, auto-progress from tasks
- **Roadmap**: Full map/group/item CRUD, resources, labs, subtopics
- **Notes**: Sub-pages, custom categories (add/edit/delete), breadcrumb
- **DB**: daily_notes, mood fields, avatar_letter, bio, timezone, accent_color

## Stack
Node.js · Express · SQLite (`sqlite3`) · bcryptjs · express-session · Vanilla JS
Fonts: Plus Jakarta Sans · Nunito · Fira Code
