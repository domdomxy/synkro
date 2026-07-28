# Email verification & password reset: link → code

Drop these files into your Synkro checkout at the matching paths (they overwrite
the existing files, plus two new components and two new migrations).

## What changed

**Email verification** (`/verify-email`)
- No more "click the link" email. `sendEmailVerificationNotification()` now
  generates a 6-digit code, hashes it, stores it on the user with a
  10-minute expiry, and emails the plaintext code in the existing branded
  mail template.
- `POST /email/verify` (was `GET /verify-email/{id}/{hash}`, signed) now
  checks the typed code against the hash, with a 5-attempt lockout and
  expiry check.
- Resend button now shows a visible 20s cooldown before it's usable again.

**Password reset** (`/forgot-password` → `/reset-password`)
- `POST /forgot-password` now emails a 6-digit code instead of a signed
  reset link, and redirects to `/reset-password?email=...` (no token in the
  URL — the code is what proves inbox ownership).
- `/reset-password` now shows the email, a 6-digit code input, and the new
  password fields on one screen, with the same 20s resend cooldown and a
  5-attempt lockout.
- The `password_reset_tokens` table gained `attempts` and `expires_at`
  columns (migration included); the `token` column now stores a hashed
  6-digit code instead of a long opaque token.
- Reset code lifetime dropped from 60 to 15 minutes (`config/auth.php`).

**Shared UI**
- `Components/Auth/OtpInput.jsx` — 6-box code entry. Typing auto-advances;
  Backspace/arrow keys navigate; pasting (Ctrl/Cmd+V) into any box fills all
  boxes at once; there's also an explicit "paste from clipboard" button
  where the Clipboard API is available.
- `Components/Auth/ResendCodeButton.jsx` — resend control with a visible
  countdown (timer text + progress bar), disabled until it reaches zero.

## Steps to apply

1. Copy these files into your working copy (overwriting the existing ones).
2. Run the two new migrations:
   ```
   php artisan migrate
   ```
3. No `.env` changes needed — this reuses your existing mail configuration.

## Files included

- `database/migrations/2026_07_28_000003_add_verification_code_to_users_table.php` (new)
- `database/migrations/2026_07_28_000004_add_code_fields_to_password_reset_tokens_table.php` (new)
- `app/Models/User.php`
- `app/Http/Controllers/Auth/EmailVerificationNotificationController.php`
- `app/Http/Controllers/Auth/VerifyEmailController.php`
- `app/Http/Controllers/Auth/PasswordResetLinkController.php`
- `app/Http/Controllers/Auth/NewPasswordController.php`
- `routes/auth.php`
- `config/auth.php`
- `resources/views/emails/notification.blade.php`
- `resources/js/Components/Auth/OtpInput.jsx` (new)
- `resources/js/Components/Auth/ResendCodeButton.jsx` (new)
- `resources/js/Pages/Auth/VerifyEmail.jsx`
- `resources/js/Pages/Auth/ForgotPassword.jsx`
- `resources/js/Pages/Auth/ResetPassword.jsx`
- `tests/Feature/Auth/EmailVerificationTest.php`
- `tests/Feature/Auth/PasswordResetTest.php`

All PHP files pass `php -l`; all JSX files pass a Babel (React + env preset)
parse check.
