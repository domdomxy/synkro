<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback_categories', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // stable identifier stored on feedbacks.category, never changes after creation
            $table->string('label');
            $table->string('icon')->default('dot'); // key into the frontend CategoryIcon preset list
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Seed the categories that used to be hardcoded (feedback.category enum) so
        // existing feedback rows keep matching a real category after this migration.
        $now = now();
        DB::table('feedback_categories')->insert([
            ['key' => 'bug', 'label' => 'Bug Report', 'icon' => 'bug', 'sort_order' => 0, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'help', 'label' => 'Help Request', 'icon' => 'help', 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'report', 'label' => 'Report User/Content', 'icon' => 'flag', 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'question', 'label' => 'Question', 'icon' => 'question', 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'suggestion', 'label' => 'Suggestion', 'icon' => 'lightbulb', 'sort_order' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'other', 'label' => 'Other', 'icon' => 'dot', 'sort_order' => 5, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_categories');
    }
};
