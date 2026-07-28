<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_verification_screen_can_be_rendered(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->get('/verify-email');

        $response->assertStatus(200);
    }

    public function test_email_can_be_verified_with_correct_code(): void
    {
        $user = User::factory()->unverified()->create([
            'email_verification_code' => Hash::make('123456'),
            'email_verification_code_expires_at' => now()->addMinutes(10),
        ]);

        Event::fake();

        $response = $this->actingAs($user)->post('/email/verify', ['code' => '123456']);

        Event::assertDispatched(Verified::class);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $response->assertRedirect(route('projects.index', absolute: false).'?verified=1');
    }

    public function test_email_is_not_verified_with_incorrect_code(): void
    {
        $user = User::factory()->unverified()->create([
            'email_verification_code' => Hash::make('123456'),
            'email_verification_code_expires_at' => now()->addMinutes(10),
        ]);

        $this->actingAs($user)->post('/email/verify', ['code' => '000000']);

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
        $this->assertSame(1, $user->fresh()->email_verification_attempts);
    }

    public function test_email_is_not_verified_with_expired_code(): void
    {
        $user = User::factory()->unverified()->create([
            'email_verification_code' => Hash::make('123456'),
            'email_verification_code_expires_at' => now()->subMinute(),
        ]);

        $response = $this->actingAs($user)->post('/email/verify', ['code' => '123456']);

        $response->assertSessionHasErrors('code');
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }
}
