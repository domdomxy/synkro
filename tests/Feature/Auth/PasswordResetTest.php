<?php

namespace Tests\Feature\Auth;

use App\Mail\SynkroNotificationMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_password_request_screen_can_be_rendered(): void
    {
        $response = $this->get('/forgot-password');

        $response->assertStatus(200);
    }

    public function test_reset_password_code_can_be_requested(): void
    {
        Mail::fake();

        $user = User::factory()->create();

        $response = $this->post('/forgot-password', ['email' => $user->email]);

        Mail::assertQueued(SynkroNotificationMail::class, fn ($mail) => $mail->hasTo($user->email));
        $response->assertRedirect(route('password.reset', ['email' => $user->email]));
    }

    public function test_reset_password_screen_can_be_rendered(): void
    {
        Mail::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        $response = $this->get('/reset-password?email='.urlencode($user->email));

        $response->assertStatus(200);
    }

    public function test_password_can_be_reset_with_valid_code(): void
    {
        Mail::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        $code = $this->extractCode($user->email);

        $response = $this->post('/reset-password', [
            'email' => $user->email,
            'code' => $code,
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('login'));
    }

    public function test_password_is_not_reset_with_incorrect_code(): void
    {
        Mail::fake();

        $user = User::factory()->create();

        $this->post('/forgot-password', ['email' => $user->email]);

        $response = $this->post('/reset-password', [
            'email' => $user->email,
            'code' => '000000',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('code');
    }

    /**
     * The code is hashed before it's stored, so tests generate one directly
     * and stub it in rather than trying to read it back out of the mail.
     */
    private function extractCode(string $email): string
    {
        $code = '654321';

        DB::table('password_reset_tokens')->where('email', $email)->update([
            'token' => bcrypt($code),
        ]);

        return $code;
    }
}
