<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TestingController extends Controller
{
    /**
     * Testing queue: every task awaiting or currently under review, across every
     * project where this user holds a role that can review (owner, manager, or
     * tester - see TaskPolicy::review). Mirrors Tasks/Index (which is scoped to
     * "assigned to me") but scoped to "I can test this" instead.
     */
    public function index()
    {
        $user = Auth::user();

        $reviewerProjectIds = $user->projects()
            ->wherePivotIn('role', ['owner', 'manager', 'tester'])
            ->pluck('projects.id');

        $tasks = Task::whereIn('project_id', $reviewerProjectIds)
            ->whereIn('status', ['submitted', 'in_review'])
            ->with(['project', 'assignee'])
            ->withCount(['comments', 'deliverables'])
            ->orderByRaw("CASE WHEN status = 'in_review' THEN 0 ELSE 1 END")
            // "submitted" tasks are waiting on submitted_at; "in_review" tasks are
            // waiting on review_started_at - order by whichever one actually applies.
            ->orderByRaw("COALESCE(review_started_at, submitted_at)")
            ->get();

        return Inertia::render('Testing/Index', [
            'tasks' => $tasks,
        ]);
    }
}
