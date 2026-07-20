<?php

namespace App\Support;

use App\Mail\SynkroNotificationMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class NotificationMailer
{
    public static function send(User $user, string $key, string $subject, array $lines, ?string $actionUrl = null, ?string $actionText = null, ?array $highlight = null, ?string $footerNote = null): void
    {
        if (! EmailPreferences::wants($user, $key)) {
            return;
        }

        try {
            Mail::to($user->email)->queue(
                new SynkroNotificationMail($user->name, $subject, $lines, $actionUrl, $actionText, $highlight, $footerNote)
            );
        } catch (\Throwable $e) {
            report($e);
        }
    }
}