<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectNoteController extends Controller
{
    public function store(Request $request, Project $project)
    {
        abort_unless($project->isMember(Auth::user()), 403);

        $validated = $request->validate([
            'title' => 'nullable|string|max:100',
            'content' => 'required|string|max:5000',
        ]);

        ProjectNote::create([
            ...$validated,
            'project_id' => $project->id,
            'user_id' => Auth::id(),
        ]);

        return back()->with('success', 'Note added.');
    }

    public function update(Request $request, ProjectNote $note)
    {
        abort_unless($note->user_id === Auth::id(), 403);

        $validated = $request->validate([
            'title' => 'nullable|string|max:100',
            'content' => 'required|string|max:5000',
        ]);

        $note->update($validated);

        return back()->with('success', 'Note updated.');
    }

    public function destroy(ProjectNote $note)
    {
        abort_unless($note->user_id === Auth::id(), 403);
        $note->delete();
        return back()->with('success', 'Note deleted.');
    }

    public function clearAll(Project $project)
    {
        $project->notes()->where('user_id', Auth::id())->delete();
        return back()->with('success', 'All notes cleared.');
    }
}