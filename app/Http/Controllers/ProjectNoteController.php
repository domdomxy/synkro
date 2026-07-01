<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectNoteController extends Controller
{
    public function update(Request $request, Project $project)
    {
        if (! $project->isMember(Auth::user())) {
            abort(403);
        }

        $validated = $request->validate([
            'content' => 'nullable|string|max:5000',
        ]);

        ProjectNote::updateOrCreate(
            ['project_id' => $project->id, 'user_id' => Auth::id()],
            ['content' => $validated['content'] ?? '']
        );

        return back()->with('success', 'Note saved.');
    }
}