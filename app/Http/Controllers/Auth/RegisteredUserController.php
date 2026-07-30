<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AccountActivityLog;
use App\Models\User;
use App\Support\NotificationMailer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Verification is sent directly (not via `event(new Registered($user))`,
        // which would additionally trigger the framework's built-in Registered
        // listener and send a second code/email) so it's guaranteed to be sent
        // exactly once, synchronously, before the user is redirected to the
        // verify-email screen — see AppServiceProvider for why.
        $user->sendEmailVerificationNotification();

        NotificationMailer::send(
            $user,
            'account.welcome',
            'Welcome to Synkro!',
            [
                "Hi **{$user->name}**, your Synkro account has been created successfully.",
                'You can now create projects, manage tasks, and collaborate with your team.',
            ],
            url(route('projects.index', [], false)),
            'View Your Projects'
        );

        Auth::login($user);

        AccountActivityLog::log('account_created', [], $user->id);

        // Redirect to /dashboard (not /projects) so the 'verified' middleware gate applies
        // immediately, same as it does on every login after this one. Redirecting somewhere
        // ungated here was letting a brand-new unverified user use the app freely until their
        // next login, instead of hitting the verify-email screen right away.
        return redirect(route('dashboard', absolute: false))->with('status', 'verification-code-sent');
    }
}