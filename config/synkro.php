<?php

return [

    /*
    |--------------------------------------------------------------------|
    | Account deletion grace period
    |--------------------------------------------------------------------|
    |
    | When a user confirms account deletion, the account is soft-deleted
    | rather than removed outright. It can be self-restored (by logging
    | back in with the same credentials) for this many days afterwards.
    | Once the window passes, the accounts:purge-deleted scheduled command
    | permanently deletes it and everything is gone for good.
    |
    */

    'account_deletion_grace_days' => (int) env('ACCOUNT_DELETION_GRACE_DAYS', 7),

    /*
    |--------------------------------------------------------------------|
    | Project & task trash grace period
    |--------------------------------------------------------------------|
    |
    | Deleting a project (once its email-confirmed deletion request lands)
    | or a task soft-deletes it into the trash rather than removing it
    | outright. Owners/managers can restore it or permanently delete it
    | from the Trash page during this window. Once it passes, the
    | projects:purge-deleted / tasks:purge-deleted scheduled commands
    | permanently delete it and everything is gone for good.
    |
    */

    'project_deletion_grace_days' => (int) env('PROJECT_DELETION_GRACE_DAYS', 7),
    'task_deletion_grace_days' => (int) env('TASK_DELETION_GRACE_DAYS', 7),

    /*
    |--------------------------------------------------------------------|
    | Display name change cooldown
    |--------------------------------------------------------------------|
    |
    | Users can only change their display name this many days apart.
    | Enforced in AccountUpdateRequest and surfaced to project owners/
    | managers via the project.member_name_changed notification so a
    | sudden name change doesn't read as a different, unfamiliar person.
    |
    */

    'name_change_cooldown_days' => (int) env('NAME_CHANGE_COOLDOWN_DAYS', 7),

];
