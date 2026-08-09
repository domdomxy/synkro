<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_account_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/account');

        $response->assertOk();
    }

    public function test_account_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/account', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/account');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/account', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/account');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_request_account_deletion(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/account', [
                'password' => 'password',
            ]);

        // Requesting deletion only starts the process - it emails a
        // confirmation link (see AccountController::requestDeletion) and
        // leaves the account and session untouched until that link is
        // clicked, so nothing here is deleted or logged out yet.
        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/account');

        $this->assertAuthenticatedAs($user);

        $user->refresh();
        $this->assertNotNull($user->deletion_requested_at);
        $this->assertFalse($user->trashed());
    }

    public function test_correct_password_must_be_provided_to_request_account_deletion(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/account')
            ->delete('/account', [
                'password' => 'wrong-password',
            ]);

        // requestDeletion() validates via validateWithBag('userDeletion', ...),
        // so the error lands in the "userDeletion" bag rather than the
        // default one.
        $response
            ->assertSessionHasErrorsIn('userDeletion', 'password')
            ->assertRedirect('/account');

        $this->assertNull($user->fresh()->deletion_requested_at);
    }

    public function test_confirming_deletion_link_soft_deletes_the_account_and_starts_the_grace_period(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['deletion_requested_at' => now()])->save();

        $confirmUrl = URL::temporarySignedRoute(
            'account.destroy.confirm',
            now()->addMinutes(60),
            ['user' => $user->getKey()]
        );

        $response = $this->actingAs($user)->get($confirmUrl);

        $response->assertRedirect('/login');

        $this->assertGuest();

        $user->refresh();
        $this->assertTrue($user->trashed());
        $this->assertNotNull($user->deletionGraceEndsAt());
        $this->assertTrue($user->deletionGraceEndsAt()->isFuture());
    }
}
