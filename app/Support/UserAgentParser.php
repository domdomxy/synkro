<?php

namespace App\Support;

/**
 * Minimal User-Agent parser used to label login activity (browser/device/OS)
 * in the account activity log and the login-alert email. Deliberately
 * regex/string-match based rather than a Composer package (Packagist isn't
 * reachable from this environment), and only needs to be "close enough" for
 * a human reading a log row, not exhaustive UA-sniffing.
 */
class UserAgentParser
{
    public static function parse(?string $userAgent): array
    {
        $ua = $userAgent ?? '';

        return [
            'browser' => self::browser($ua),
            'device' => self::device($ua),
            'os' => self::os($ua),
        ];
    }

    private static function browser(string $ua): string
    {
        return match (true) {
            $ua === '' => 'Unknown Browser',
            str_contains($ua, 'Edg/') => 'Edge',
            str_contains($ua, 'OPR/') || str_contains($ua, 'Opera') => 'Opera',
            str_contains($ua, 'Firefox/') => 'Firefox',
            str_contains($ua, 'CriOS/') => 'Chrome', // Chrome on iOS still identifies as Safari otherwise
            str_contains($ua, 'Chrome/') => 'Chrome',
            str_contains($ua, 'Safari/') => 'Safari',
            default => 'Unknown Browser',
        };
    }

    private static function device(string $ua): string
    {
        if ($ua === '') {
            return 'Unknown Device';
        }

        // Android tablets drop the "Mobile" token that Android phones include.
        if (str_contains($ua, 'iPad') || (str_contains($ua, 'Android') && ! str_contains($ua, 'Mobile'))) {
            return 'Tablet';
        }

        if (str_contains($ua, 'iPhone') || str_contains($ua, 'Android') || str_contains($ua, 'Mobile')) {
            return 'Mobile';
        }

        return 'Desktop';
    }

    private static function os(string $ua): string
    {
        return match (true) {
            str_contains($ua, 'Windows') => 'Windows',
            str_contains($ua, 'Mac OS X') || str_contains($ua, 'Macintosh') => 'macOS',
            str_contains($ua, 'iPhone') || str_contains($ua, 'iPad') => 'iOS',
            str_contains($ua, 'Android') => 'Android',
            str_contains($ua, 'Linux') => 'Linux',
            default => 'Unknown OS',
        };
    }
}
