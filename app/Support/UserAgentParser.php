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
            // Only ever populated for Android — see androidModel() below for why every
            // other platform (including all desktop OSes) intentionally can't have this.
            'model' => self::androidModel($ua),
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

    /**
     * Android is the *only* platform where a specific hardware model (e.g. "Pixel 7",
     * "SM-G991B") is realistically obtainable at all, because Android is also the only
     * platform whose browsers still put it directly in the User-Agent string by default —
     * e.g. "...(Linux; Android 13; Pixel 7) AppleWebKit/...". There is deliberately no
     * equivalent for any other platform:
     *   - Desktop browsers (Windows/macOS/Linux) have never included a hardware model in
     *     the User-Agent, and there is no browser API — old or new — that exposes one to a
     *     website. It isn't a gap in this parser; browser vendors treat "what specific PC
     *     or laptop is this" as fingerprinting-sensitive information and refuse to hand it
     *     to any site, full stop.
     *   - iOS/iPadOS deliberately generalize to just "iPhone" / "iPad" for the same reason,
     *     even though Android takes the opposite stance.
     *   - Even Chrome's newer User-Agent Client Hints (Sec-CH-UA-Model) — the modern,
     *     opt-in replacement for reading this out of the UA string — are spec'd to only
     *     ever return a value on mobile; desktop requests get an empty string by design.
     * So "Dell G15 3350"-style desktop model names can't be added here or anywhere else in
     * the stack; this method exists to capture the one case that's actually possible.
     */
    private static function androidModel(string $ua): ?string
    {
        if (! str_contains($ua, 'Android') || ! preg_match('/Android\s+[\d.]+;\s*([^;)]+)\)/', $ua, $matches)) {
            return null;
        }

        // Strip a trailing "Build/XXXXX" suffix some manufacturers append after the model.
        $model = trim(preg_replace('/\s+Build\/.*/', '', $matches[1]));

        // Generic placeholder tokens some UAs carry instead of a real model name.
        if ($model === '' || in_array($model, ['K', 'wv'], true)) {
            return null;
        }

        return $model;
    }
}
