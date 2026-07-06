<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feedback_responses', function (Blueprint $table) {
            $table->string('sender_type')->default('admin')->after('admin_id');
            $table->foreignId('admin_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('feedback_responses', function (Blueprint $table) {
            $table->dropColumn('sender_type');
            $table->foreignId('admin_id')->nullable(false)->change();
        });
    }
};