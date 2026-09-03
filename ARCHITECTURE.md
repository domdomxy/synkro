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
  (`sendConfirmationCode()`, `User::verifyAdminConfirmationCode()`). The same step-up code
  mechanism (`User::sendAdminConfirmationCodeNotification()`/`verifyAdminConfirmationCode()` -
  not actually admin-only, just named for their first use case) is reused outside the admin
  system entirely for `ProjectController::transferOwnership()`: handing off a project is just as
  hard to undo as anything superadmin-gated, so a project owner has to enter a code emailed to
  them before the transfer goes through.
- **Project role** - stored on the `project_user` pivot table (`owner` | `manager` |
  `member` | `tester`), scoped per project. A user can be a `manager` on one project and
  a `member` on another. `Project::roleFor($user)` is the lookup used everywhere
  permission checks happen.

Authorization for project/task actions goes through Laravel Policies
(`app/Policies/{Project,Task,Comment}Policy.php`), not ad hoc `if` checks scattered in
controllers. E.g. `TaskPolicy::review()` allows `owner`, `manager`, or `tester` - but
`update()` also allows the task's own assignee (it gates the narrower assignee-facing actions -
starting a task, submitting it, managing its own deliverables - not full editing of the task
itself, which is `edit()`, owner/manager only: `TaskController::update()` used to authorize
against `update` too, letting an assignee rewrite a task's title/description or reassign it
through the raw PATCH endpoint even though the UI never offered that form - it now checks
`edit` instead), and `manageChecklist()` allows
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

`TaskController::bulkUpdate()` lets an owner/manager act on several tasks from the project task
list at once (delete, change status, change priority, reassign, change or clear the due date)
rather than one at a time. Status changes made this way bypass the guided start/submit/review
flow, but still set the same `submitted_at`/`review_started_at` timestamps that flow would, so
the Testing Queue's ordering stays correct for tasks touched in bulk. A bulk due-date change
resets `overdue_notified_at`/`reminder_notified_at` the same way a single-task edit does (see
Deadline reminders below), and clearing the due date altogether also clears
`reminder_offset_minutes`, since a reminder needs a due date to count back from.

## Deadline reminders vs. personal reminders

Two different mechanisms, easy to conflate since both end in a notification:

- **Personal reminders** (`Reminder` model) are user-created and self-contained - a
  user sets `remind_at` for themselves, optionally repeating (daily/weekly/monthly).
  Fully independent of tasks. `SendDueReminders` (scheduled every minute) fires them.
- **Task deadline reminders** are owner/manager-configured, per task, and automatic:
  `Task::reminder_offset_minutes` is how long before `due_date` the assignee should be
  notified (null = no reminder). `SendTaskDeadlineReminders` (scheduled every 15
  minutes, same cadence as the overdue-alert command below) fires once the offset
  window is reached, tracked via `reminder_notified_at` (cleared whenever
  `due_date` or `reminder_offset_minutes` changes, so a rescheduled or re-configured
  task gets a fresh chance to fire) - the same pattern `overdue_notified_at` already
  used for `SendOverdueTaskAlerts`.
  - Editable at any time by whoever can already edit the task (owner/manager - see
    `TaskPolicy::edit()`), via the existing due-date edit form. Frozen once the task
    is `done` or its `due_date` has passed, unless `due_date` is being changed in the
    same request - see `Task::reminderIsLocked()`, checked both server-side
    (`TaskController::update()`) and client-side (`TaskRow.jsx`, so the field
    visibly disables rather than just rejecting on save).
  - Changing it doesn't get its own notification type or appear on the task card -
    it's folded into the existing `task_updated` notification/activity-log/email path
    that every other content edit (title, description, due date, priority) already
    goes through, so the assignee is told a task they're on was updated (with the
    change visible in its history) without adding new UI surface for one more field.
  - The reminder firing itself is a separate notification type (`task_reminder`,
    category `task.reminder` in `NotificationPreferences`/`EmailPreferences`) from the
    change-of-setting notification above and from `task_overdue` - a task can
    reasonably trigger both a deadline reminder and, later, an overdue alert.

## Task freeze/resolve: what happens to a task when its assignee is gone

Member removal (`ProjectMemberController::freezeOrReset()`), leaving a project, account
deactivation (`AccountController::deactivate()`), and account deletion (`AccountDeletion`) all
run the same split on that user's assigned tasks, since walking away from a project mid-task is
the same problem in every case:

- Tasks not yet in `done`/`submitted`/`in_review` are safe to reset: `assigned_to` is cleared and
  `status` goes back to `todo`. Any comments the departing user left on those tasks are deleted
  along with the reset.
- Tasks already `done`, `submitted`, or `in_review` are not touched automatically, since silently
  reassigning or resetting finished or in-flight work would be destructive. Instead they're
  flagged `pending_resolution = true` and left exactly as they were.

A manager resolves a frozen task via `TaskController::resolvePending()`: **keep** just clears the
flag and leaves the task's state as-is, **reset** deletes its deliverables and comments and puts
it back to `todo`, unassigned. Frozen tasks feed the "Needs Attention" count in
`App\Support\AdminAlerts` and are flagged inline in `TaskRow.jsx` for whoever can manage the
project.

## Testing Queue: reviewing across projects, not within one

`TestingController::index()` (`/testing`, `Testing/Index.jsx`) is a separate page from the
per-project Kanban board: it lists every task that's `submitted` or `in_review` across *every*
project where the current user holds a role that can review (`owner`, `manager`, or `tester`,
matching `TaskPolicy::review()`). `in_review` tasks are ordered first, then by however long each
task has been waiting (`COALESCE(review_started_at, submitted_at)`). Where the Kanban board
answers "what's the state of this project," the Testing Queue answers "what's waiting on me to
review, anywhere."

## My Tasks: personal, not per-project

`TaskController::index()` (`/tasks`, `Tasks/Index.jsx`) is a third, easily-conflated list
alongside the per-project Kanban board and the Testing Queue: it shows only tasks
`assigned_to` the current user, across every project they belong to, ordered by `due_date`
(nulls last). It's the assignee's own view ("what do I have to do"), where the Testing Queue
is the reviewer's ("what's waiting on me to review") and the Kanban board is the
project's ("what's the state of this project"). Pinning (`pinnedTasks()`, a per-user pivot,
`TaskController::pin()`/`unpin()`) sorts a task to the top of both this page and its
project's own task list - it's independent of, and works the same way as, the existing
project- and note-level pinning.

Archiving works the same way, via its own per-user pivot: `archivedTasks()`
(`archived_tasks` table, `TaskController::archive()`/`unarchive()`). Same shape as
project archiving (`project_user.archived`) and the same not-a-team-setting rule applies -
archiving a task only removes it from *your* My Tasks list; everyone else it's assigned to
(there's only ever one assignee, but managers/owners still see it in the project) sees no
change at all. `TaskController::index()` reads an `archived` query param the same way
`ProjectController::index()` does, filters the assigned-task set against the current user's
`archivedTasks()` ids, and returns `showingArchived`/`activeCount`/`archivedCount` so
`Tasks/Index.jsx` can render the same Active/Archived tab pattern as `Projects/Index.jsx`.
Unlike project archiving, task archiving has no bearing on notifications or membership -
it's purely a list-visibility toggle.

## Dashboard: clickable legend as a comparison filter

`ClickableLegend` (used by `ActivityChart` on both the personal and admin dashboards) turns a
recharts legend into a series filter rather than a static key: no selection shows every series;
clicking one isolates it; clicking additional entries adds them so several series render side by
side for comparison; clicking a selected entry again removes it, and once nothing is selected
every series reappears. Selection state (`selectedKeys`) lives in the page component, not the
chart, so it survives a chart-type switch (area/bar/combo).

## Dashboard: two independent date-range filters

The personal dashboard (`DashboardController::index()`, `Dashboard.jsx`) has two separate
date-range controls that are easy to conflate since they look alike: the Activity chart's
range (`range`/`from`/`to` query params, backward-looking, sliced into buckets by `buckets()`)
and the Due Soon panel's range (`due_range`/`due_from`/`due_to`, forward-looking, resolved by
`dueSoonWindow()` into a single `[start, end]` window used to filter tasks by `due_date`).
`ChartControlsMenu` and `DueSoonFilterMenu` both render via the shared `RangeButtons`
component (parameterized with `rangeParam`/`fromParam`/`toParam` so each writes its own query
params) and each passes the other's active params through as `extraParams`, so switching one
filter's range doesn't reset the other's.

## Project search: one bar, two different behaviors

The search bar on the project page (`Projects/Show.jsx`, built on `KeywordSearchBar.jsx`) handles
two distinct kinds of input, not one:

- **Plain typed text** (no keyword) is a live "type to search" query matched across the project's
  tasks, comments, members, resources, and deliverables. Results render in `SearchResultsPanel.jsx`,
  which takes over the right-hand column (where `NotesPanel` normally sits) grouped by type with
  an icon per group, and reverts to `NotesPanel` the instant the query is cleared - modeled on
  Discord's in-server search-results pane rather than a small dropdown list.
- **A filter keyword** (`status:`, `priority:`, `assignee:`, `comments:`, `deliverables:`,
  `resources:`) locks into a solid tag inside the bar itself and opens a value picker; picking or
  typing a value turns it into a removable applied-filter pill, narrowing the task list (or, for
  `resources:`, the Resources panel) instead of populating the results panel. `status`/`priority`/
  `assignee` are fixed-option selects; `comments` is free text matched against comment bodies;
  `deliverables` and `resources` combine an optional type chip with free text matched against
  name. Backspace on an empty bar pops the most recent tag or pill.

A green completion bar (`TaskStatusBar.jsx`) sits above the task list/board, independent of the
search bar - just a done/total count and percentage, not a per-status breakdown.

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
  at logout instead). Both confirmation dialogs (`DeviceSessionsSection.jsx`) include a
  "change your password" link in case the session wasn't theirs; when rendered inside the
  Settings overlay it hops straight to the Account panel's password section via
  `overlayActions.switchToAccount('update-password')` (see the overlay-panel note in the
  Directory map below), falling back to a normal page visit otherwise.
- The admin side keeps a real historical log for support/audit purposes
  (`AdminController::userLoginHistory`, rendered by `Admin/UserLoginHistory.jsx`, a fork
  of the old self-service login-history page) - viewing it doesn't notify the user (that
  would be noise for routine lookups) but every view still writes an `AdminLog` entry,
  same as any other admin action.
- `App\Support\SessionActivity` (`countsByDay()`, `monthPairRange()`) backs the session
  activity calendar shown on both the personal dashboard (per-user) and the admin
  dashboard (site-wide, alongside Tasks by Status).

## Verification codes: one pattern, five separate flows

Synkro never uses Laravel's default signed-link verification - everywhere a person needs to
prove they control an inbox or step up for a sensitive action, it's the same emailed 6-digit
code pattern (short, typeable, hashed at rest, expiring, attempt-limited), implemented
independently five times rather than as one shared class:

- **Email verification** (`VerifyEmailController`) - code + `email_verification_code_expires_at`
  on the `users` row, 5 wrong attempts before a fresh code is required, resend
  throttled `6,1` at the route.
- **Password reset** (`PasswordResetLinkController`/`NewPasswordController`) - bypasses
  Laravel's Password broker entirely; code hashed into `password_reset_tokens.token`,
  expiry from `config('auth.passwords....expire')` (15 minutes by default), 5 attempts.
- **Account restore** (soft-deleted account logging back in) - see Login below, 6-digit code,
  no separate request needed.
- **Admin/owner step-up confirmation** (`User::sendAdminConfirmationCodeNotification()`/
  `verifyAdminConfirmationCode()`) - 10-minute expiry, `admin_confirmation_code_purpose` scopes
  a code to the one action it was issued for (`users.role_change`, `users.delete_permanent`,
  `projects.transfer_ownership`) so a code meant for one can't be replayed against another.
- **Account/project deletion confirmation** is the one exception to the code pattern - those use
  a Laravel signed URL emailed as a link instead, since the flow is a single click-through
  rather than something typed back into a form (see Trash above).

A new password is also gated client-side (`meetsMinimumStrength()`) at every point one is set
(registration, reset, forced change, and the logged-in change-password form) - the account must
reach at least "Good" strength before the form submits. The server only enforces Laravel's
baseline `Password::defaults()` rules, so this is a UX nudge, not a hard server-side minimum.

## Login: one page absorbs several account states

`AuthenticatedSessionController` treats a failed or blocked login as a chance to disambiguate
*why*, rather than always showing a generic error, and the same `Auth/Login.jsx` page renders
whichever state applies:

- **Soft-deleted but still restorable account:** since the global `SoftDeletes` scope hides a
  trashed user from the credentials query, a correct password against one always fails
  authentication first. `store()` catches that failure, checks by hand whether a trashed user with
  matching credentials exists and is still inside its grace period (`isRestorable()`), and if so
  immediately seeds a restore code (`sendAccountRestoreCodeNotification()`) and redirects back to
  `/login` with `pendingDeletion` data. The login page then swaps to a 6-digit-code restore form
  right there, no separate page or prior "forgot password"-style request needed.
- **Admin-issued temporary password, not yet expired:** a wrong password on an account with
  `must_change_password` still pending is almost always someone typing their old password, so
  instead of the generic credentials error the login page shows a "check your email for a
  temporary password" notice (`passwordReset` session data).
- **Admin-issued temporary password, expired:** `temp_password_expires_at` (24 hours from
  `AdminController::resetPassword()`) having passed gets its own distinct screen telling the user
  to contact an admin for a new one, rather than folding into the notice above.
- **Suspended account:** shown inline with the suspension reason, time remaining if temporary, and
  the appeal form itself embedded in the same screen (`SuspensionNotice`), rate-limited to one
  appeal per 6 hours - see the Suspension & appeal flow section above.

`AuthenticatedSessionController::suspendedLogout()` and `passwordResetLogout()` are what force a
signed-in user back to one of these screens the moment their session stops being valid (suspended
while logged in, or an admin resets their password while they're logged in) instead of just
logging them out silently.

## Account deactivation vs. deletion

Deactivation (`AccountController::deactivate()`) is a separate path from the delete-request flow
described under Trash above: it runs the same task freeze/reset split as member removal, notifies
the affected projects' owners/managers, and requires no grace period or restore code, since simply
logging back in reactivates the account. It's meant for "stepping away for a while," where
deletion is meant for "leaving for good."

## Admin-issued temporary passwords

`AdminController::resetPassword()` sets a random password on a user's account plus
`must_change_password` (and `temp_password_expires_at`). `EnsurePasswordIsChanged` middleware then
redirects every request other than the password-change routes themselves to
`Auth/ForcePasswordChange.jsx` until the user sets a new password, so there's no way to use the
temporary one past the first login.

## Feedback / support tickets

`Feedback` (`status`: `pending` | `reviewing` | `accepted` | `rejected` | `closed`) is open to
guests and registered users alike - there's no login requirement, only a name/email on the
ticket itself, matched against a registered account (if any) purely to decide whether an in-app
notification can also be pushed alongside the always-sent email. Submitters attach up to 5 images
per ticket (`FeedbackAttachment`, validated as `image|max:4096` each).

- A submitter can only reply once an admin has responded at least once (`FeedbackController::
  reply()`) - an unanswered ticket has nothing to reply to yet. Replies, closes, and reopens are
  all authenticated by `tracking_id` + `email` matching the ticket, not a session.
- The submitter can close (`close()`) or reopen a closed ticket (`reopen()`, back to `pending`)
  themselves at any time, independent of the admin-side status changes in
  `FeedbackAdminController::update()`.
- `feedback:close-inactive` (scheduled) auto-closes any ticket that's had no activity - no new
  reply from either side - for 24 hours *after* an admin has replied at least once
  (`CloseInactiveFeedback`). A never-answered ticket is a support backlog problem, not something
  that should vanish on the submitter, so it's excluded. The auto-close posts a system-authored
  `FeedbackResponse` (`sender_type: 'system'`) explaining why, same as an admin close would, and
  is reopenable the same way as any other closed ticket.
- Admins manage the categories tickets are filed under (`Admin\FeedbackCategoryController`) and
  reply to/change the status of tickets (`Admin\FeedbackAdminController::update()`), which always
  sends the submitter a single email combining the message and any status change together.

## Notifications

Two independent channels, both respecting the same per-user preferences
(`NotificationPreferences` / `EmailPreferences` in `app/Support`), plus a separate, narrower mute
layer on top: a user can mute a specific project (`project_user.mute_in_app`/`mute_email`) or a
specific task (`mutedTasks()` pivot, same two columns) for in-app, email, or both, independent of
their global per-type preferences. Type preferences decide *what* a user hears about across the
whole app; muting decides where they've asked to hear nothing regardless of type.

- **In-app:** `UserNotification` rows, surfaced via the notification bell
  (`NotificationController`), optionally pushed live over the user's private channel
  when broadcasting is enabled.
- **Email:** queued via `NotificationMailer`, only sent if the user hasn't opted out of
  that notification type.

Marking a notification read (a bell row click, or a toast click - see below) fires a
`NotificationRead` broadcast (`.notification.read`) on the user's private channel so any
other open tab or device updates its own bell badge/row without a reload, the same pattern
`NotificationDeleted`/`NotificationUpdated` already use for deletes and pile shrinks;
`NotificationController::markRead()` only fires it on a genuine unread -> read transition,
so re-marking an already-read row doesn't double-decrement another tab's unread count.

`NotificationToast.jsx` toasts are clickable, not just informational: each toast carries a
`url` (built per notification type, e.g. `/projects/{id}?task={id}` or with `&history=1` for
`task_updated`) and the underlying `notificationId`. Clicking a toast marks that notification
read and navigates to it, mirroring what a bell row click already does; the dismiss (X)
button stops propagation so dismissing doesn't also open it.

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
- `resources/js/Components/NavSearchInput.jsx` - the search box in the Settings/Account
  nav sidebars. Matches against each section's `terms` (the actual field/control names
  inside it, e.g. "Full name", "New Password"), not just the section's own label, so a
  section surfaces as a result whenever anything inside it matches.
- `resources/js/Components/CodeEditor.jsx` - a read-only CodeMirror instance with
  per-extension syntax highlighting (`LANGUAGE_BY_EXT`, covering most mainstream
  languages) and in-file search, used by `DeliverableViewer.jsx` and `ZipViewer.jsx` to
  preview text/code files - including files inside a previewed ZIP - without downloading
  them. Extensions with no language entry still open, just as plain text.
- `resources/js/Components/AvatarCropperModal.jsx` - the in-browser crop step between
  picking an image file and submitting it in `UpdateAvatarForm.jsx` (Account settings).
- `resources/js/Components/UserSearchInput.jsx` (backed by `UserSearchController::search()`)
  - the name/email autocomplete behind the project member-invite field; queries active users
    by name or email (2+ characters) and lets a picked result or free-typed address get queued
    into the batch invite.
- `resources/js/Components/ImageLightbox.jsx` - full-size viewer for feedback-ticket image
  attachments, used in `FeedbackPanel.jsx` and `Admin/Feedbacks.jsx`.
- `resources/js/Components/KeywordSearchBar.jsx` + `SearchResultsPanel.jsx` +
  `TaskStatusBar.jsx` - the project page's search bar, its live-match results panel, and the
  task-completion bar above the list - see Project search above.
- `resources/js/Components/TaskRow.jsx` - besides the task detail panel itself, owns the
  comment-thread UI: replies are grouped under their root comment (`buildCommentTree`) and
  start collapsed behind a "View replies" toggle, expanding only the thread(s) a user opens.
  Navigating to a specific comment (e.g. from a notification) walks up to that comment's root
  and force-expands it first, so the target has something to scroll to even if its thread was
  collapsed.
- `resources/js/Components/ConfirmDialog.jsx` + `hooks/useConfirm.jsx` - the shared
  confirmation dialog used across the app (project/task deletion, archiving, disconnecting a
  device, and more) instead of one-off modals per action; `confirm(message, options)` returns
  a promise resolved on confirm/cancel. An optional `skipKey` opts a specific caller into a
  "don't show this again" checkbox, persisted to `localStorage` under that key - scoped to
  whichever page passes it (e.g. `synkro:projects-archive-skip-confirm` and
  `synkro:tasks-archive-skip-confirm` are independent, so skipping one archive confirmation
  doesn't silence the other).

## Known rough edges

- `AdminController::destroyProject()` (routed as `DELETE /admin/projects/{project}`) intentionally
  aborts with a 403 rather than deleting anything - platform admins have no direct way to delete a
  project. That's deliberate: project deletion is owner-initiated and email-confirmed (see Trash
  above), and giving admins a silent bypass around that would undercut it. The route and controller
  method are kept as an explicit, documented no-op rather than removed, so this doesn't look like a
  bug if revisited later.
- `AdminController` and `TaskController` have grown large (currently around 1,500 lines
  each) by doing most of their domain's work in one place. Not
  broken, but a good first refactor target - see the per-resource split already started
  with `Admin/FeedbackAdminController` and `Admin/FeedbackCategoryController`.
- Test coverage is currently limited to Breeze's default auth scaffolding plus a small
  profile test - the policies, task lifecycle, trash/restore flow, and suspension/appeal
  flow described above have no automated tests yet.
