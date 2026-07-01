<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@synkro.test',
            'role' => 'admin',
        ]);

        User::factory(5)->create(); // regular test users
    }
}