<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class AccountUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
        ];
    }

    /**
     * Blocks the name change (leaving email free to update on its own) if the
     * user already changed their name within the cooldown window. Checked
     * here rather than in rules() so it only fires when the name is actually
     * being changed, not on every account save.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $user = $this->user();
            $newName = $this->input('name');

            if ($newName === null || $newName === $user->name || $user->canChangeName()) {
                return;
            }

            $availableAt = $user->nameChangeAvailableAt();
            $daysLeft = max(1, (int) ceil(now()->diffInHours($availableAt) / 24));

            $validator->errors()->add(
                'name',
                "You can change your name again in {$daysLeft} day(s), on {$availableAt->format('M j, Y')}."
            );
        });
    }
}
