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

];
