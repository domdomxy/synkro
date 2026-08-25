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
  submitted work - text and code files preview in place with syntax highlighting (covering
  most common languages) and in-file search, including files inside a previewed ZIP, read-only
- A dedicated resources hub per project: files and links organized into folders, added one at a
  time or as a drag-and-drop batch
- Per-project notes and checklists, with checklist items that can sync live, two-way, into a
  member's personal Notes, a one-click "clear completed" to sweep checked-off items from a note;
  comments support @mentions (mentioning "everyone" is owner/manager-only), bare-URL and
  markdown-style links, rich text with lists, threaded replies, and author-only editing (marked
  "edited", logged to the project's activity log)
- Due dates with automatic overdue alerts, plus a per-task deadline reminder that the task's
  owner or manager can configure (how long before the due date the assignee is notified) -
  editable at any time, but locked once the task is done or its due date has passed unless
  the due date is also being changed
- Reminders (one-off or repeating) with countdown display, and a personal dashboard for setting them
- Pinning and archiving at the project, task, and note level - a pinned task rises to the top of
  its project's list and of your My Tasks page alike; both the Projects list and My Tasks list
  show Active/Archived tabs with a live count per tab (archiving a task only affects your own
  My Tasks view - it stays visible and unchanged for everyone else it's assigned to)
- Invite one or many members at once in a single request, with a live name/email search that
  autocompletes against existing users as you type, all given the same role, cancel a
  pending invitation at any time, plus ownership transfer (owner-only, gated by a 6-digit code
  emailed to the current owner before it takes effect) - role changes and removal are
  hierarchy-aware: a manager can act on members and testers, but only the project owner can
  change or remove a manager (including a manager acting on themselves)
- Soft-deleted projects and tasks land in a recoverable Trash (in Settings) for a grace period
  before permanent deletion, with restore available the whole time
- Testing Queue: a cross-project view of every task awaiting or under review, for anyone who can
  review it (owner, manager, or tester on that project) - separate from the per-project Kanban
  board, and sorted by wait time with in-review tasks first
- My Tasks: a personal, cross-project list of every task assigned to you, sorted by due date with
  pinned tasks first - search by task or project name, filter by status or priority, switch
  between grid and list views (remembered per browser), and archive tasks you don't need to see
  day-to-day into their own Active/Archived tab, same as Projects
- Multi-select bulk actions on the project task list (delete, change status, change priority,
  reassign, change or clear the due date), restricted to owners/managers
- When a member is removed, leaves, deactivates, or deletes their account, their unfinished tasks
  are unassigned and reset to To Do, but tasks that were done, submitted, or in review are frozen
  instead so nothing gets silently reassigned or lost - a manager then explicitly keeps or resets
  each frozen task

**Notifications & activity**
- In-app notification bell plus emailed notifications (queued), with per-notification-type
  preferences; repeated events on the same target (several comments on one task, say) pile
  into a single row instead of flooding the bell
- Optional real-time updates over WebSockets (Laravel Reverb) - live notifications, checklist and
  note sync, project updates, and admin alerts
- Notifications can be muted per project or per task (in-app, email, or both), independent of the
  global per-notification-type preferences above
- Personal activity feed and account activity log
- Logged-in devices panel: see every active session (browser, device, approximate location) and
  disconnect any of them remotely, or log out of all other devices at once
- Personal dashboard with task/project stats, an animated task-status donut chart, an activity
  chart (day/week/month/custom range, switchable between area/bar/combo views) whose legend
  doubles as a series filter - click one entry to isolate it, click more to compare several
  side by side - a session activity calendar, and a deadline calendar
- A "My Notes" dashboard widget: every checklist you've synced into your personal Notes,
  grouped by project, checkable right from the dashboard without opening the Notes panel
- Due Soon panel on the dashboard with its own independent date-range filter (today/week/month/
  custom), so narrowing upcoming due tasks doesn't disturb the Activity chart's range

**Support & moderation**
- Help & Feedback center: submit categorized tickets (with up to 5 image attachments, viewable
  full-size in a lightbox), track status by ID, threaded replies once support has responded - the
  submitter can close or reopen their own ticket at any point, and a ticket with no activity for
  24 hours after a support reply auto-closes (reopenable from the tracking page) - admins can
  create, edit, and remove the categories tickets are filed under
- Suspension system with a user-facing appeal flow and admin review
- Admin console: manage users, feedback tickets, project logs, suspension logs, platform-wide
  analytics (including site-wide session activity), and read-only access to a user's own
  activity/login history for support investigations - every admin lookup and action is written
  to a permanent audit log

**Account**
- Upload a profile avatar, cropping it in-browser before it's saved
- Deactivate your account instead of deleting it: your unfinished tasks are unassigned (finished
  or in-flight ones are frozen for a manager to resolve, same as removal), your projects' owners
  and managers are notified, and logging back in reactivates the account automatically
- Admins can issue a temporary password for a user; the next login is locked to a "set a new
  password" screen until they change it, and the temporary password itself expires after 24 hours
- Trying to log into a deleted-but-not-yet-purged account is met with a 6-digit-code restore
  prompt right on the login page, instead of a dead-end "incorrect credentials" error

**Everywhere else**
- Light, dark, and true-black themes, switchable anytime
- Responsive layouts with touch-friendly interactions on mobile, including a swipe carousel on
  the project page and touch drag-and-drop on the kanban board
- Trusted-site external link confirmation: a warning before you leave Synkro through a link
  someone posted, remembered per host so you're only asked once
- A search box in Settings and Account jumps straight to the field you need - it matches on
  each section's actual field names, not just the section titles, so searching "password" finds
  the right panel even though no section is titled that
- Live assistance on email and password fields: a typo hint on email inputs (catching common
  misspellings like a dropped or swapped letter in "gmail.com"), and a real-time match indicator
  on password confirmation fields

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

This creates an admin account (`admin@synkro.test`), a superadmin account
(`superadmin@synkro.test`), and 5 regular users, all with the password `password`.

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
- **Name change cooldown:** how many days must pass between a user changing their display name
  is configurable via `NAME_CHANGE_COOLDOWN_DAYS` (defaults to 7 days) - see `config/synkro.php`.
  A changed display name also notifies the owners/managers of that user's projects, so a sudden
  name change doesn't read as an unfamiliar member.

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
