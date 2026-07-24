# Architecture

A short orientation to how Synkro is put together, for anyone (including future you,
before a defense) picking the project back up.

## Stack

- **Backend:** Laravel 13 (PHP 8.3+), server-rendered routing via Inertia.js (no separate
  REST/JSON API layer — controllers return Inertia responses directly).
- **Frontend:** React function components, Tailwind CSS, Recharts for charts.
- **Real-time:** Laravel Reverb (self-hosted WebSockets) + `laravel-echo-react`, gated
  behind `BROADCAST_CONNECTION` — defaults to `log` (off) so the app runs fully
  synchronously with no extra services required.
- **Async work:** queued jobs (`QUEUE_CONNECTION=database` by default) for notification
  emails, so a queue worker must be running for those to actually send.

## Roles: two separate systems, don't confuse them

- **Platform role** — `users.role` (`admin` | regular). Only gates access to `/admin/*`
  routes (`auth` + `admin` middleware) and admin-only actions (moderation, feedback
  management, suspension enforcement).
- **Project role** — stored on the `project_user` pivot table (`owner` | `manager` |
  `member` | `tester`), scoped per project. A user can be a `manager` on one project and
  a `member` on another. `Project::roleFor($user)` is the lookup used everywhere
  permission checks happen.

Authorization for project/task actions goes through Laravel Policies
(`app/Policies/{Project,Task,Comment}Policy.php`), not ad hoc `if` checks scattered in
controllers. E.g. `TaskPolicy::review()` allows `owner`, `manager`, or `tester` — but
`update()` also allows the task's own assignee. When adding a new project-scoped action,
add a policy method rather than inlining the role check in the controller.

## Task lifecycle

```
To Do → In Progress → Submitted → In Review → Done
                          ↑___________|
                      (reject/reopen loop)
```

A `tester` (or `owner`/`manager`) reviews a `Submitted` task and either approves it
(→ `Done`) or rejects it, which reopens it for further work. Deliverables (files or
links) attach to a task via `TaskDeliverable`; a project's submitted deliverables can be
bulk-exported as a ZIP.

## Suspension & appeal flow

1. Admin suspends a user (`AdminController`) — either permanently or with a
   `suspended_until` timestamp and a reason.
2. `LiftExpiredSuspensions` (scheduled command) automatically clears expired timed
   suspensions; `AuthenticatedSessionController` also does a just-in-time check on login
   attempts as a belt-and-braces fallback.
3. A suspended user hitting `/login` is shown the suspension notice instead of signing
   in, and can submit an appeal (`SuspensionAppealController`) — rate-limited to one
   per 6 hours per account.
4. Admins review appeals under `/admin/appeals`; a decision either lifts the suspension
   or leaves it in place.
5. If a user is suspended while already logged in, `SuspensionListener` (frontend)
   listens on their private `user.{id}` channel for a `.suspended` broadcast and forces
   an immediate logout — no need to wait for their next request to notice.

## Notifications

Two independent channels, both respecting the same per-user preferences
(`NotificationPreferences` / `EmailPreferences` in `app/Support`):

- **In-app:** `UserNotification` rows, surfaced via the notification bell
  (`NotificationController`), optionally pushed live over the user's private channel
  when broadcasting is enabled.
- **Email:** queued via `NotificationMailer`, only sent if the user hasn't opted out of
  that notification type.

## Directory map (non-obvious parts)

- `app/Support/` — small focused helper classes rather than fat traits: `Linkifier`
  (turns URLs in free text into links), `NoteFormatter`, `GeoLocator` +
  `UserAgentParser` + `DeviceTimezone` (used for the login-history/activity log to show
  "signed in from Chrome on Windows, Tunis" style entries).
- `app/Events/` — one class per broadcastable domain event (comment posted, invitation
  accepted, appeal created, etc.), consumed by `routes/channels.php`'s channel
  authorization callbacks.
- `resources/js/Pages/Admin/` — admin-only Inertia pages; everything else under
  `resources/js/Pages/` is reachable by regular users (subject to policies).

## Known rough edges

- `AdminController` and `TaskController` have grown large (~790 and ~680 lines) by doing
  most of their domain's work in one place. Not broken, but a good first refactor
  target — see the per-resource split already started with
  `Admin/FeedbackAdminController` and `Admin/FeedbackCategoryController`.
- Test coverage is currently limited to Breeze's default auth scaffolding plus a small
  profile test — the policies, task lifecycle, and suspension/appeal flow described
  above have no automated tests yet.
