<?php

namespace App\Support;

use App\Models\UserNotification;

class NotificationPiler
{
    /**
     * Create a notification, or - if an unread one with the same
     * (user_id, type, group_key) already exists - fold this event into it
     * instead of inserting a new row. Prevents a burst of near-identical
     * notifications (5 comments on one task, 5 replies to one comment) from
     * showing up as 5 separate bell entries; they collapse into a single
     * "You have 5 new ..." row that keeps bumping to the top and incrementing
     * its count as more events arrive, until it's read.
     *
     * Once marked read, the group is "closed" - the next matching event
     * starts a fresh row rather than reopening the old one, so someone who
     * dismisses a pile and then gets one more comment sees a clean single
     * notification instead of a stale count picking back up.
     *
     * $attributes must include user_id, type, causer_id, url, group_key.
     * $singleMessage is used verbatim the first time (pile_count === 1).
     * $pileMessage is called with the new pile_count (>= 2) to build the
     * folded wording, e.g. fn ($n) => "You have {$n} new comments on ...".
     *
     * Returns ['notification' => UserNotification, 'is_new' => bool] -
     * is_new is false when an existing row was folded into, which callers
     * use to avoid double-counting the unread badge for the same group.
     */
    public static function pile(array $attributes, string $singleMessage, callable $pileMessage): array
    {
        $existing = UserNotification::where('user_id', $attributes['user_id'])
            ->where('type', $attributes['type'])
            ->where('group_key', $attributes['group_key'])
            ->whereNull('read_at')
            ->first();

        if ($existing) {
            $existing->pile_count += 1;
            $existing->causer_id = $attributes['causer_id'];
            $existing->url = $attributes['url'];
            $existing->message = $pileMessage($existing->pile_count);
            $existing->touch();
            $existing->save();

            return ['notification' => $existing, 'is_new' => false];
        }

        $notification = UserNotification::create($attributes + [
            'message' => $singleMessage,
            'pile_count' => 1,
        ]);

        return ['notification' => $notification, 'is_new' => true];
    }
}
