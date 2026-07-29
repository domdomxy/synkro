<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

/**
 * Backs the "Trust ... links from now on" checkbox in ExternalLinkGuard and
 * the Settings > Trusted Sites list. Deliberately a plain JSON API (not an
 * Inertia response) - ExternalLinkGuard is mounted once outside Inertia's
 * page swapping (see resources/js/app.jsx), so it can't rely on Inertia
 * page props and instead talks to this endpoint directly via fetch (see
 * resources/js/utils/trustedHosts.js).
 *
 * Trusted hosts are stored on the account (users.trusted_link_hosts), not
 * the browser: a host trusted on one device/browser is trusted everywhere
 * the same account signs in, and never carries over to a different account
 * that happens to share a browser.
 */
class TrustedHostController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(['hosts' => $request->user()->trusted_link_hosts ?? []]);
    }

    public function store(Request $request, string $host)
    {
        $host = $this->normalize($host);

        $user = $request->user();
        $hosts = $user->trusted_link_hosts ?? [];

        if (! in_array($host, $hosts, true)) {
            $hosts[] = $host;
            $user->update(['trusted_link_hosts' => $hosts]);
        }

        return response()->json(['hosts' => $hosts]);
    }

    public function destroy(Request $request, string $host)
    {
        $host = $this->normalize($host);

        $user = $request->user();
        $hosts = array_values(array_diff($user->trusted_link_hosts ?? [], [$host]));
        $user->update(['trusted_link_hosts' => $hosts]);

        return response()->json(['hosts' => $hosts]);
    }

    public function destroyAll(Request $request)
    {
        $request->user()->update(['trusted_link_hosts' => []]);

        return response()->json(['hosts' => []]);
    }

    private function normalize(string $host): string
    {
        return strtolower(substr(trim($host), 0, 255));
    }
}
