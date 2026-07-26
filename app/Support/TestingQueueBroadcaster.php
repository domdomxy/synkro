<?php

namespace App\Support;

use App\Events\TestingQueueUpdated;
use App\Models\Project;
use App\Models\Task;

/**
 * Call this after any change that can add or remove a task from the testing
 * queue (submitted for review, approved, rejected, deleted, or reset while
 * submitted/in review) so every owner/manager/tester on the project gets an
 * up-to-date badge count pushed to them immediately, rather than only seeing
 * it refresh on their next page load.
 */
class TestingQueueBroadcaster
{
    public static function notify(Project $project): void
    {
        $reviewers = $project->members()->wherePivotIn('role', ['owner', 'manager', 'tester'])->get();

        foreach ($reviewers as $reviewer) {
            $reviewerProjectIds = $reviewer->projects()
                ->wherePivotIn('role', ['owner', 'manager', 'tester'])
                ->pluck('projects.id');

            $count = Task::whereIn('project_id', $reviewerProjectIds)
                ->whereIn('status', ['submitted', 'in_review'])
                ->count();

            try {
                broadcast(new TestingQueueUpdated($reviewer->id, $count));
            } catch (\Throwable $e) {
                report($e);
            }
        }
    }
}
