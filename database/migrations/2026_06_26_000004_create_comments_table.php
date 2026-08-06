<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade');

            // Nullable + set-null-on-delete: purging an account (User::forceDelete())
            // shouldn't take every comment they'd ever left with it - including ones
            // sitting on a still-frozen (pending_resolution) task that another member
            // may still need the context of. The frontend falls back to "Deleted user"
            // for a null comment->user.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Nullable + set-null-on-delete: if the comment being replied to is
            // later deleted, the reply itself is left standing (comments are
            // otherwise never cascade-deleted just because another comment on
            // the same task disappears) - it just becomes a reply to nothing,
            // which the frontend renders as "Replying to a deleted comment".
            $table->foreignId('parent_id')->nullable()->constrained('comments')->nullOnDelete();

            $table->text('body');

            // Comments with replies are never hard-deleted - the row has to stay
            // so its children keep a valid parent_id and their place in the tree.
            // Deleting one of those instead stamps deleted_at and blanks the body,
            // and the frontend renders it as a "[original comment was deleted]"
            // tombstone. A comment with no replies still gets a real hard delete
            // (see CommentController::destroy), so this column stays null for the
            // vast majority of rows.
            $table->timestamp('deleted_at')->nullable();

            $table->boolean('is_feedback')->default(false); // flagged as tester/reviewer feedback

            // is_rejection means "a reviewer sent this back during review" (in_review -> in_progress).
            // is_reopened means "this task was already done, and got sent back after the fact"
            // (done -> in_progress). Kept as separate flags (rather than sharing one) so a review
            // rejection and a post-completion reopen don't show up identically in the UI - they're
            // different points in the task's lifecycle worth telling apart.
            $table->boolean('is_rejection')->default(false);
            $table->boolean('is_reopened')->default(false);

            $table->timestamp('edited_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
