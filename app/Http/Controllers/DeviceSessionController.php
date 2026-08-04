<?php

namespace App\Http\Controllers;

use App\Events\DeviceDisconnected;
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
 * ever hearing back from the server. Since that alone leaves an already-open
 * tab on the disconnected device looking fully signed in (its websocket
 * connection doesn't know its session was just deleted), both actions below
 * also broadcast a DeviceDisconnected event so that exact device can react
 * immediately instead of waiting on its next request to fail - see
 * DeviceDisconnectedListener.jsx.
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

        try {
            broadcast(new DeviceDisconnected(Auth::id(), sessionId: $session));
        } catch (\Throwable $e) {
            report($e);
        }

        return back()->with('success', 'Device disconnected.');
    }

    /**
     * Disconnects every session except the one making this request - a "log
     * out everywhere else" shortcut instead of disconnecting devices one by one.
     */
    public function disconnectOthers(Request $request)
    {
        $currentSessionId = $request->session()->getId();

        $disconnected = DB::table('sessions')
            ->where('user_id', Auth::id())
            ->where('id', '!=', $currentSessionId)
            ->delete();

        if (! $disconnected) {
            return back()->with('success', 'No other devices were connected.');
        }

        try {
            broadcast(new DeviceDisconnected(Auth::id(), exceptSessionId: $currentSessionId));
        } catch (\Throwable $e) {
            report($e);
        }

        return back()->with('success', $disconnected === 1
            ? '1 other device disconnected.'
            : "{$disconnected} other devices disconnected.");
    }
}
