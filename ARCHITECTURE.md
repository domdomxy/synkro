# Architecture

A short orientation to how Synkro is put together, for anyone (including future you,
before a defense) picking the project back up.

## Stack

- **Backend:** Laravel 13 (PHP 8.3+), server-rendered routing via Inertia.js (no separate
  REST/JSON API layer - controllers return Inertia responses directly).
- **Frontend:** React function components, Tailwind CSS, Recharts for charts.
- **Real-time:** Laravel Reverb (self-hosted WebSockets, not a third-party service) +
  `@laravel/echo-react`, gated behind `BROADCAST_CONNECTION` - defaults to `log` (off) so
  the app runs fully synchronously with no extra services required.
- **Async work:** queued jobs (`QUEUE_CONNECTION=database` by default) for notification
  emails, so a queue worker must be running for those to actually send.

## Roles: two separate systems, don't confuse them

- **Platform role** - `users.role` (`user` | `admin` | `superadmin`). `User::isAdmin()`
  returns true for both `admin` and `superadmin`, since a superadmin carries every admin
  permission plus a few of its own - so anywhere "is this user an admin" gates something
  (route middleware, UI nav, feedback/appeal handling), `admin` and `superadmin` are
  treated identically. `admin` and `superadmin` both gate access to `/admin/*` routes
  (`auth` + `admin` middleware) and the shared admin-only actions: moderation (suspend/
  lift-suspension), responding to feedback tickets, and reviewing suspension appeals -
  none of that is superadmin-gated. On top of all of that, `superadmin` (`User::
  isSuperAdmin()`, `EnsureUserIsSuperAdmin` middleware) exclusively gets: deleting user
  accounts (single or bulk, gracefully or permanently - `AdminController::destroy()` /
  `destroyBulk()`), limited editing of another user's core info (`AdminController::
  updateUser()`), and promoting/demoting a user between `user`/`admin`/`superadmin`
  (`toggleRole()`/`toggleSuperAdmin()`). High-impact superadmin actions (permanent user
  deletion, role changes) require a fresh emailed confirmation code first
  (`sendConfirmationCode()`, `User::verifyAdminConfirmationCode()`).
- **Project role** - stored on the `project_user` pivot table (`owner` | `manager` |
  `member` | `tester`), scoped per project. A user can be a `manager` on one project and
  a `member` on another. `Project::roleFor($user)` is the lookup used everywhere
  permission checks happen.

Authorization for project/task actions goes through Laravel Policies
(`app/Policies/{Project,Task,Comment}Policy.php`), not ad hoc `if` checks scattered in
controllers. E.g. `TaskPolicy::review()` allows `owner`, `manager`, or `tester` - but
`update()` also allows the task's own assignee, and `manageChecklist()` allows
`owner`/`manager` (any checklist item) or `tester` (only items they added themselves) -
the assignee's only checklist permission is toggling an item done, enforced in the
controller rather than the policy. When adding a new project-scoped action, add a policy
method rather than inlining the role check in the controller.

Within the `manager` role there's a further hierarchy check that's *not* expressed as a
policy, since it's about standing over a specific target member rather than gating an
action on the project as a whole:
`ProjectMemberController::assertCanActOnMember()` blocks a `manager` from changing the
role of or removing another `manager` - including themselves. Only the `owner` has that
authority. `manageMembers` (the policy gate) still applies first to confirm the actor is
an `owner`/`manager` at all; this second check runs after it, scoped to the specific
target user, and 403s if the actor doesn't have standing. The member-invite endpoint
(`ProjectMemberController::store`) accepts a batch of emails in one request rather than
one per call, sending an invitation to each and skipping (with a message, not a hard
failure) anyone already a member or already invited.

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

## Trash: two separate systems, don't confuse them

Projects, tasks, and user accounts all use `SoftDeletes` rather than being removed
outright, but "trash" refers to two distinct things depending on who's deleting what:

- **User-facing Trash (Settings)** - where a signed-in user finds their own deleted, or
  still-existing but managed/owned, projects and tasks. Deleting a project (once its
  email-confirmed deletion request lands) or a task soft-deletes it. `Project::booted()`
  cascades trashing/restoring to its own tasks (matched by shared `deleted_at` timestamp,
  so an independently-trashed task isn't auto-restored along with its project);
  `Task::project()` uses `withTrashed()` so a cascade-trashed task can still resolve its
  project. `App\Support\TrashData` builds the listing shown in the Trash section of
  Settings (projects the user owns, tasks in projects they manage); `TrashController`
  handles restore/permanent-delete actions - there's no longer a standalone `/trash`
  page, it was folded into Settings so deleted items are managed in one place.
- **Superadmin user deletion** - a completely separate flow from the Trash above:
  superadmin-only, lives in `Admin/Users.jsx`/`AdminController::destroy()`/
  `destroyBulk()`, and is how a superadmin gracefully (soft-delete, same grace-period
  mechanism as self-deletion) or permanently (immediate, unrecoverable,
  confirmation-code-gated) removes *another* user's account. It has no dedicated listing
  page of its own - gracefully-deleted users just show as trashed inline in the Users
  table (badge/tooltip) until their grace period lapses or they're restored.
- A user's own account: requesting deletion soft-deletes it (`deletion_requested_at` +
  `SoftDeletes`). Restoring is a self-service, email-code-verified flow
  (`AccountController::sendRestoreCode()`/`restore()`) - not a plain login - and it works
  the same way whether the account was soft-deleted by the user themselves or gracefully
  deleted by a superadmin, as long as the grace period hasn't lapsed and it wasn't a
  permanent deletion.
- All three grace periods are configurable (`config/synkro.php`,
  `ACCOUNT_DELETION_GRACE_DAYS` / `PROJECT_DELETION_GRACE_DAYS` /
  `TASK_DELETION_GRACE_DAYS`, default 7 days each).
- Scheduled commands (`accounts:purge-deleted`, `projects:purge-deleted`,
  `tasks:purge-deleted`) permanently purge anything past its grace period. Task purging
  skips tasks whose project is also trashed, since the project purge's cascading foreign
  key handles those.
- Restore and deletion both broadcast live and write an in-app notification, matching
  the pattern used everywhere else in the app.

## Suspension & appeal flow

1. Admin suspends a user (`AdminController`) - either permanently or with a
   `suspended_until` timestamp and a reason.
2. `LiftExpiredSuspensions` (scheduled command) automatically clears expired timed
   suspensions; `AuthenticatedSessionController` also does a just-in-time check on login
   attempts as a belt-and-braces fallback.
3. A suspended user hitting `/login` is shown the suspension notice instead of signing
   in, and can submit an appeal (`SuspensionAppealController`) - rate-limited to one
   per 6 hours per account.
4. Admins review appeals under `/admin/appeals`; a decision either lifts the suspension
   or leaves it in place. The appeal/suspension history shown to the user
   (`Auth/AppealHistory.jsx`) redacts which admin acted, showing generic "Synkro
   support" attribution instead - admin-only pages like `Admin/Appeals.jsx` still show
   real admin names to admins.
5. If a user is suspended while already logged in, `SuspensionListener` (frontend)
   listens on their private `user.{id}` channel for a `.suspended` broadcast and forces
   an immediate logout - no need to wait for their next request to notice.

## Sessions and device management

Rather than a historical login log, the self-service side (Settings > Logged in
devices) is a live view of a user's actual active sessions, built directly on Laravel's
own `sessions` table (`SESSION_DRIVER=database`):

- `App\Support\DeviceSessionData` parses each session row's user agent
  (`UserAgentParser`) and geolocates its IP (`GeoLocator`), filters out anything past
  `session.lifetime` (already dead, just not garbage-collected yet), and flags whichever
  row matches the current request as `is_current`.
- `DeviceSessionController::disconnect()`/`disconnectOthers()` disconnect a session by
  deleting its row - the browser holding that session is invalidated on its next
  request. A user can't disconnect their own current session this way (they're pointed
  at logout instead).
- The admin side keeps a real historical log for support/audit purposes
  (`AdminController::userLoginHistory`, rendered by `Admin/UserLoginHistory.jsx`, a fork
  of the old self-service login-history page) - viewing it doesn't notify the user (that
  would be noise for routine lookups) but every view still writes an `AdminLog` entry,
  same as any other admin action.
- `App\Support\SessionActivity` (`countsByDay()`, `monthPairRange()`) backs the session
  activity calendar shown on both the personal dashboard (per-user) and the admin
  dashboard (site-wide, alongside Tasks by Status).

## Notifications

Two independent channels, both respecting the same per-user preferences
(`NotificationPreferences` / `EmailPreferences` in `app/Support`):

- **In-app:** `UserNotification` rows, surfaced via the notification bell
  (`NotificationController`), optionally pushed live over the user's private channel
  when broadcasting is enabled.
- **Email:** queued via `NotificationMailer`, only sent if the user hasn't opted out of
  that notification type.

Repeated events on the same target don't flood the bell with near-duplicates -
`NotificationPiler::pile()` folds a new event into an existing unread row (matched on
`user_id` + `type` + `group_key`) instead of inserting a new one, bumping `pile_count`
and rewriting the message (e.g. "You have 5 new comments on ..."). Once a pile is read,
the group is closed and the next matching event starts a fresh row. For comment-based
types (`task_commented`, `task_mentioned`, `comment_replied`), each contributing comment
id is tracked in `source_ids`, so deleting one comment out of several piled together
(`CommentController::purgeCommentNotifications()`) shrinks the pile by exactly one and
retargets the message/url, rather than only being able to remove the whole notification.

## Directory map (non-obvious parts)

- `app/Support/` - small focused helper classes rather than fat traits: `Linkifier`
  (turns URLs in free text into links), `NoteFormatter`, `GeoLocator` +
  `UserAgentParser` + `DeviceTimezone` (used for account activity/device sessions to
  show "signed in from Chrome on Windows, Tunis" style entries), `TrashData` and
  `DeviceSessionData` (build the Settings > Trash / Logged in devices listings),
  `SessionActivity` (shared day-count logic behind both session activity calendars),
  `AdminAlerts` (the live "Needs Attention" counts on the admin dashboard).
- `app/Events/` - one class per broadcastable domain event (comment posted, invitation
  accepted, appeal created, project/task restored, etc.), consumed by
  `routes/channels.php`'s channel authorization callbacks.
- `resources/js/Pages/Admin/` - admin-only Inertia pages; everything else under
  `resources/js/Pages/` is reachable by regular users (subject to policies).
- `resources/js/Components/Settings*.jsx`/`AccountPanel.jsx` plus
  `hooks/useRouteOverlay.jsx` - Settings, Account, and Support open as overlay panels on
  top of whatever page you were on (fetched manually via Inertia's X-Inertia protocol)
  rather than navigating away and unmounting the background page. Coordination state
  lives at module scope in the hook, not component state, since `AuthenticatedLayout`
  remounts on every top-level page swap.

## Known rough edges

- `AdminController` and `TaskController` have grown large (currently a little over 1,400
  and 1,300 lines respectively) by doing most of their domain's work in one place. Not
  broken, but a good first refactor target - see the per-resource split already started
  with `Admin/FeedbackAdminController` and `Admin/FeedbackCategoryController`.
- Test coverage is currently limited to Breeze's default auth scaffolding plus a small
  profile test - the policies, task lifecycle, trash/restore flow, and suspension/appeal
  flow described above have no automated tests yet.
