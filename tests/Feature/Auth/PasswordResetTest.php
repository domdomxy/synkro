<?php

namespace Tests\Feature\Auth;

use App\Mail\SynkroNotificationMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_password_link_screen_can_be_rendered(): void
    {
        $response = $this->get('/forgot-password');

        $response->assertStatus(200);
    }

    public function test_reset_password_link_can_be_requested(): void
    {
        Mail::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        Mail::assertQueued(SynkroNotificationMail::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_reset_password_screen_can_be_rendered(): void
    {
        Mail::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        Mail::assertQueued(SynkroNotificationMail::class, function ($mail) {
            $response = $this->get('/reset-password/'.$this->extractToken($mail));

            $response->assertStatus(200);

            return true;
        });
    }

    public function test_password_can_be_reset_with_valid_token(): void
    {
        Mail::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        Mail::assertQueued(SynkroNotificationMail::class, function ($mail) use ($user) {
            $response = $this->post('/reset-password', [
                'token' => $this->extractToken($mail),
                'email' => $user->email,
                'password' => 'password',
                'password_confirmation' => 'password',
            ]);

            $response
                ->assertSessionHasNoErrors()
                ->assertRedirect(route('login'));

            return true;
        });
    }

    /**
     * The branded mail (unlike the default ResetPassword notification) doesn't expose
     * ->token directly, so pull it back out of the reset URL the mailable was built with.
     */
    private function extractToken(SynkroNotificationMail $mail): string
    {
        $path = parse_url($mail->actionUrl, PHP_URL_PATH);

        return basename($path);
    }
}
