<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;

/**
 * Resolves a rough "City, Region, Country" location from an IP address for
 * login logs/alerts. Best-effort only:
 * - Private/loopback/reserved IPs (localhost, LAN, 10.x, 192.168.x, etc) can't
 *   be geolocated at all, so those return null rather than a wrong guess.
 * - Any lookup failure (offline, rate limited, slow) also returns null with a
 *   short timeout, so a flaky geolocation service never delays or breaks login.
 */
class GeoLocator
{
    public static function locate(?string $ip): ?string
    {
        if (! $ip || self::isPrivateOrReserved($ip)) {
            return null;
        }

        try {
            $response = Http::timeout(2)->get("http://ip-api.com/json/{$ip}", [
                'fields' => 'status,city,regionName,country',
            ]);

            if (! $response->ok()) {
                return null;
            }

            $data = $response->json();
            if (($data['status'] ?? null) !== 'success') {
                return null;
            }

            $parts = collect([$data['city'] ?? null, $data['regionName'] ?? null, $data['country'] ?? null])
                ->filter()
                ->values();

            return $parts->isNotEmpty() ? $parts->implode(', ') : null;
        } catch (\Throwable $e) {
            report($e);
            return null;
        }
    }

    private static function isPrivateOrReserved(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
    }
}
