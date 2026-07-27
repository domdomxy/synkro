<?php

namespace App\Support;

use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Collection;

class MentionParser
{
    /**
     * Role tokens that can be @mentioned, beyond a project's real pivot roles.
     * 'everyone' pings every member of the project regardless of their role.
     */
    public const ROLE_TOKENS = ['owner', 'manager', 'tester', 'member', 'everyone'];

    /**
     * Matches the mention token inserted by MentionTextarea.jsx: @[Label](user:ID)
     * or @[Label](role:token). The label is display-only (kept in sync with the
     * user's name / role at insert time) — resolution below is always driven by
     * the id/token in parens, never the label text, so a stale label after a
     * rename can't point at the wrong person.
     */
    private const PATTERN = '/@\[([^\]]+)\]\((user:(\d+)|role:([a-z]+))\)/';

    /**
     * Extracts raw mention targets from a comment body: user ids explicitly
     * mentioned, and role tokens (including 'everyone') mentioned.
     *
     * @return array{userIds: array<int>, roles: array<string>}
     */
    public static function extract(string $body): array
    {
        if (! preg_match_all(self::PATTERN, $body, $matches, PREG_SET_ORDER)) {
            return ['userIds' => [], 'roles' => []];
        }

        $userIds = [];
        $roles = [];

        foreach ($matches as $match) {
            if ($match[3] !== '') {
                $userIds[] = (int) $match[3];
            } elseif (in_array($match[4], self::ROLE_TOKENS, true)) {
                $roles[] = $match[4];
            }
        }

        return [
            'userIds' => array_values(array_unique($userIds)),
            'roles' => array_values(array_unique($roles)),
        ];
    }

    /**
     * Resolves a parsed mention set into actual recipient Users for the given
     * project: mentioned users (if still members) plus members matching any
     * mentioned role (or every member, for 'everyone'). The comment's own
     * author is excluded — mentioning yourself shouldn't notify yourself.
     *
     * @param array{userIds: array<int>, roles: array<string>} $mentions
     * @return Collection<int, User>
     */
    public static function resolveRecipients(Project $project, array $mentions, int $excludeUserId): Collection
    {
        $members = $project->members;

        $recipients = $members->whereIn('id', $mentions['userIds']);

        if (in_array('everyone', $mentions['roles'], true)) {
            $recipients = $recipients->merge($members);
        } else {
            foreach ($mentions['roles'] as $role) {
                $recipients = $recipients->merge($members->filter(fn ($m) => $m->pivot->role === $role));
            }
        }

        return $recipients->unique('id')->reject(fn ($m) => (int) $m->id === $excludeUserId)->values();
    }
}
