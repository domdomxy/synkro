<?php

use App\Models\Project;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('project.{project}', function ($user, Project $project) {
    return $project->isMember($user);
});

Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('admin-alerts', function ($user) {
    // Was a literal role==='admin' check, which excluded superadmins even
    // though they're treated as admins everywhere else (see User::isAdmin()).
    // AuthenticatedLayout subscribes to this channel as PRIVATE for any
    // isAdminRole user (admin OR superadmin) on every mount - i.e. on every
    // page navigation - so a superadmin's subscription was silently denied
    // here on every single page load. That denied background request then
    // fell through the JSON-request guard in bootstrap/app.php's exception
    // handler (it doesn't send the same Accept header a normal page request
    // does) and got a generic 403 -> redirect()->back()->withErrors(...),
    // which flashes straight into the session and surfaces as a "You don't
    // have permission to do that." toast on the very next real page visit.
    return $user->isAdmin();
});
