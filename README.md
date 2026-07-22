# Synkro

Synkro is a role-based project management web app: projects, tasks, deliverables,
notifications, and a built-in support/appeal system, backed by an admin console for
oversight and moderation.

Built with Laravel 13, Inertia.js, and React.

## Features

**Projects & tasks**
- Role-based project membership — Owner, Manager, Member, Tester — with per-project permissions
- Task lifecycle: To Do → In Progress → Submitted → In Review → Done, with reopen/reject flow
- File and link deliverables per task, with ZIP export of a project's submitted work
- Per-project notes/checklists, comments, pinning, and archiving
- Member invitations and ownership transfer

**Notifications & activity**
- In-app notification bell plus emailed notifications (queued), with per-notification-type
  preferences
- Optional real-time updates over WebSockets (Laravel Reverb) — live notifications, project
  updates, and admin alerts
- Personal activity feed, login history, and account activity log
- Personal dashboard with task/project stats and an activity chart (day/week/month/custom range)

**Support & moderation**
- Help & Feedback center: submit tickets, track status by ID, threaded replies
- Suspension system with a user-facing appeal flow and admin review
- Admin console: manage users, feedback tickets, project logs, suspension logs, and
  platform-wide analytics

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

Then start everything (Laravel server, queue worker, log viewer, and Vite dev server) with:

```bash
composer run dev
```

The app will be available at the URL in `APP_URL` (`http://localhost:8000` by default).

### Notes on configuration

- **Queue worker:** notification emails are queued (`QUEUE_CONNECTION=database` by default), so
  a queue worker must be running for emails to actually send — `composer run dev` already
  includes one.
- **Mail:** defaults to the `log` driver, so outgoing emails are written to the log instead of
  sent. Configure a real mail driver in `.env` to send actual emails.
- **Real-time features:** `BROADCAST_CONNECTION` defaults to `log` (no live updates). To enable
  real-time notifications and project updates, configure Reverb credentials in `.env` and run:

  ```bash
  php artisan reverb:start
  ```

## Testing

```bash
composer run test
```

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
