<?php

namespace App\Support;

class NotificationPreferences
{
    public static function catalog(): array
    {
        return [
            'assignments' => 'Task assignments, updates, and reminders',
            'reviews' => 'Review requests and decisions',
            'membership' => 'Project membership changes',
        ];
    }

    public static function defaults(): array
    {
        return array_fill_keys(array_keys(self::catalog()), true);
    }

    public static function wants(?\App\Models\User $user, string $category): bool
    {
        if (! $user) return true;
        $prefs = $user->notification_preferences ?? [];
        return $prefs[$category] ?? self::defaults()[$category] ?? true;
    }
}