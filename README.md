# Synkro

Synkro is a role-based project management web app: projects, tasks, deliverables,
notifications, and a built-in support/appeal system, backed by an admin console for
oversight and moderation.

Built with Laravel 13, Inertia.js, and React.

## Features

**Projects & tasks**
- Role-based project membership - Owner, Manager, Member, Tester - with per-project permissions
- Task lifecycle: To Do → In Progress → Submitted → In Review → Done, with reopen/reject flow
- Kanban board with drag-and-drop (touch-friendly on mobile, with edge auto-scroll), restricted
  to the status transitions your workflow allows, plus a list view - pick whichever you prefer,
  per project, and it's remembered
- Task dependencies with cycle detection and "blocked by" indicators on the list view
- Per-task checklists with role-scoped permissions (who can add, remove, and check off items),
  separate from comments
- File and link deliverables per task, with type-aware icons and ZIP export of a project's
  submitted work
- A dedicated resources hub per project: files and links organized into folders, added one at a
  time or as a drag-and-drop batch
- Per-project notes and checklists, with checklist items that can sync live, two-way, into a
  member's personal Notes; comments support @mentions, bare-URL and markdown-style links, rich
  text with lists, and threaded replies
- Reminders (one-off or repeating) with countdown display, and a personal dashboard for setting them
- Pinning and archiving at both the project and note level (Projects list shows Active/Archived
  tabs with a live count per tab)
- Invite one or many members at once in a single request, all given the same role, plus
  ownership transfer - role changes and removal are hierarchy-aware: a manager can act on
  members and testers, but only the project owner can change or remove a manager (including
  a manager acting on themselves)
- Soft-deleted projects and tasks land in a recoverable Trash (in Settings) for a grace period
  before permanent deletion, with restore available the whole time

**Notifications & activity**
- In-app notification bell plus emailed notifications (queued), with per-notification-type
  preferences; repeated events on the same target (several comments on one task, say) pile
  into a single row instead of flooding the bell
- Optional real-time updates over WebSockets (Laravel Reverb) - live notifications, checklist and
  note sync, project updates, and admin alerts
- Personal activity feed and account activity log
- Logged-in devices panel: see every active session (browser, device, approximate location) and
  disconnect any of them remotely, or log out of all other devices at once
- Personal dashboard with task/project stats, an activity chart (day/week/month/custom range,
  switchable between area/bar/combo views), a session activity calendar, and a deadline calendar

**Support & moderation**
- Help & Feedback center: submit categorized tickets, track status by ID, threaded replies
- Suspension system with a user-facing appeal flow and admin review
- Admin console: manage users, feedback tickets, project logs, suspension logs, platform-wide
  analytics (including site-wide session activity), and read-only access to a user's own
  activity/login history for support investigations - every admin lookup and action is written
  to a permanent audit log

**Everywhere else**
- Light, dark, and true-black themes, switchable anytime
- Responsive layouts with touch-friendly interactions on mobile, including a swipe carousel on
  the project page and touch drag-and-drop on the kanban board
- Trusted-site external link confirmation: a warning before you leave Synkro through a link
  someone posted, remembered per host so you're only asked once

## Tech stack

- **Backend:** Laravel 13 (PHP 8.3+), Inertia.js, Laravel Reverb (WebSockets), Sanctum
- **Frontend:** React, Tailwind CSS, Recharts, Headless UI
- **Build tooling:** Vite

## Requirements

- PHP 8.3+
- Composer
- Node.js + npm
- A database supported by Laravel (SQLite by default, see `.env.example`)

## Getting started

```bash
git clone https://github.com/domdomxy/synkro.git
cd synkro

composer run setup
```

`composer run setup` installs PHP and JS dependencies, copies `.env.example` to `.env`,
generates the app key, runs migrations, and builds frontend assets.

### Demo data

To get something to click through instead of an empty database, seed it:

```bash
php artisan db:seed
```

This creates an admin account (`admin@synkro.test`) and 5 regular users, all with the
password `password`.

Then start everything (Laravel server, queue worker, log viewer, and Vite dev server) with:

```bash
composer run dev
```

The app will be available at the URL in `APP_URL` (`http://localhost:8000` by default).

### Notes on configuration

- **Queue worker:** notification emails are queued (`QUEUE_CONNECTION=database` by default), so
  a queue worker must be running for emails to actually send - `composer run dev` already
  includes one.
- **Mail:** defaults to the `log` driver, so outgoing emails are written to the log instead of
  sent. Configure a real mail driver in `.env` to send actual emails.
- **Real-time features:** `BROADCAST_CONNECTION` defaults to `log` (no live updates). To enable
  real-time notifications, live note/checklist sync, and project updates, configure Reverb
  credentials in `.env` and run:

  ```bash
  php artisan reverb:start
  ```
- **Trash and deletion grace periods:** how long a deleted account, project, or task stays
  recoverable before a scheduled command purges it for good is configurable via
  `ACCOUNT_DELETION_GRACE_DAYS`, `PROJECT_DELETION_GRACE_DAYS`, and `TASK_DELETION_GRACE_DAYS`
  (all default to 7 days) - see `config/synkro.php`.

### Troubleshooting

- **`npm install`/`npm run dev` fails with a Vite/plugin version mismatch:** this project pins
  `@vitejs/plugin-react` to a version compatible with Vite 8. If your local `node_modules` ends
  up with an older `@vitejs/plugin-react` (for example after a partial install or a stale lockfile),
  reinstall it explicitly:

  ```bash
  npm install @vitejs/plugin-react@latest --save-dev
  ```

## Testing

```bash
composer run test
```

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for an overview of the role/permission model,
task lifecycle, trash/soft-delete system, suspension/appeal flow, and notification system.
