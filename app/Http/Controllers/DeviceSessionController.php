<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Action endpoints for the "Logged in devices" section of Settings (see
 * DeviceSessionsSection.jsx and SettingsController::edit(), which supplies
 * the listing itself via App\Support\DeviceSessionData).
 *
 * Disconnecting a device is nothing more than deleting its row from Laravel's
 * own `sessions` table (SESSION_DRIVER=database) - that session id stops
 * validating on its very next request, signing that browser out without it
 * ever hearing back from the server.
 */
class DeviceSessionController extends Controller
{
    /**
     * Disconnects a single other device. Scoped to the current user's own
     * sessions via the `user_id` match, so one user can never disconnect
     * another's session even by guessing/replaying a session id.
     */
    public function disconnect(Request $request, string $session)
    {
        if ($session === $request->session()->getId()) {
            return back()->withErrors(['error' => "You can't disconnect the device you're currently using - log out instead."]);
        }

        $deleted = DB::table('sessions')
            ->where('id', $session)
            ->where('user_id', Auth::id())
            ->delete();

        if (! $deleted) {
            return back()->withErrors(['error' => 'That device is already disconnected.']);
        }

        return back()->with('success', 'Device disconnected.');
    }

    /**
     * Disconnects every session except the one making this request - a "log
     * out everywhere else" shortcut instead of disconnecting devices one by one.
     */
    public function disconnectOthers(Request $request)
    {
        $disconnected = DB::table('sessions')
            ->where('user_id', Auth::id())
            ->where('id', '!=', $request->session()->getId())
            ->delete();

        if (! $disconnected) {
            return back()->with('success', 'No other devices were connected.');
        }

        return back()->with('success', $disconnected === 1
            ? '1 other device disconnected.'
            : "{$disconnected} other devices disconnected.");
    }
}
