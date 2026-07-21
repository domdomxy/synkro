<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ProjectNoteController extends Controller
{
    // Turns a plain array of item strings into the {id, text, done} shape we store.
    private function buildItems(array $texts): array
    {
        return collect($texts)
            ->map(fn ($text) => trim($text))
            ->filter(fn ($text) => $text !== '')
            ->values()
            ->map(fn ($text) => ['id' => (string) Str::random(8), 'text' => $text, 'done' => false])
            ->all();
    }

    public function store(Request $request, Project $project)
    {
        abort_unless($project->isMember(Auth::user()), 403);

        $validated = $request->validate([
            'title' => 'nullable|string|max:100',
            'items' => 'required|array|min:1',
            'items.*' => 'required|string|max:300',
        ]);

        ProjectNote::create([
            'title' => $validated['title'] ?? null,
            'content' => $this->buildItems($validated['items']),
            'project_id' => $project->id,
            'user_id' => Auth::id(),
        ]);

        return back()->with('success', 'Checklist added.');
    }

    // Full edit: title plus the list of items. Items carrying an existing id keep
    // their done state; items with no id (freshly added in the edit form) start undone.
    public function update(Request $request, ProjectNote $note)
    {
        abort_unless($note->user_id === Auth::id(), 403);

        $validated = $request->validate([
            'title' => 'nullable|string|max:100',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|string',
            'items.*.text' => 'required|string|max:300',
        ]);

        $existingById = collect($note->content)->keyBy('id');

        $items = collect($validated['items'])
            ->map(function ($item) use ($existingById) {
                $text = trim($item['text']);
                $existing = $item['id'] ? $existingById->get($item['id']) : null;
                return [
                    'id' => $existing['id'] ?? (string) Str::random(8),
                    'text' => $text,
                    'done' => $existing['done'] ?? false,
                ];
            })
            ->filter(fn ($item) => $item['text'] !== '')
            ->values()
            ->all();

        $note->update(['title' => $validated['title'] ?? null, 'content' => $items]);

        return back()->with('success', 'Checklist updated.');
    }

    public function destroy(ProjectNote $note)
    {
        abort_unless($note->user_id === Auth::id(), 403);
        $note->delete();
        return back()->with('success', 'Checklist deleted.');
    }

    public function clearAll(Project $project)
    {
        $project->notes()->where('user_id', Auth::id())->delete();
        return back()->with('success', 'All checklists cleared.');
    }

    public function toggleItem(ProjectNote $note, string $itemId)
    {
        abort_unless($note->user_id === Auth::id(), 403);

        $items = collect($note->content)->map(function ($item) use ($itemId) {
            if ($item['id'] === $itemId) {
                $item['done'] = !$item['done'];
            }
            return $item;
        })->all();

        $note->update(['content' => $items]);

        return back()->with('success', null);
    }

    public function addItem(Request $request, ProjectNote $note)
    {
        abort_unless($note->user_id === Auth::id(), 403);

        $validated = $request->validate(['text' => 'required|string|max:300']);

        $items = $note->content;
        $items[] = ['id' => (string) Str::random(8), 'text' => trim($validated['text']), 'done' => false];
        $note->update(['content' => $items]);

        return back();
    }

    public function removeItem(ProjectNote $note, string $itemId)
    {
        abort_unless($note->user_id === Auth::id(), 403);

        $items = collect($note->content)->reject(fn ($item) => $item['id'] === $itemId)->values()->all();
        $note->update(['content' => $items]);

        return back();
    }

    public function clearCompletedItems(ProjectNote $note)
    {
        abort_unless($note->user_id === Auth::id(), 403);

        $items = collect($note->content)->reject(fn ($item) => $item['done'])->values()->all();
        $note->update(['content' => $items]);

        return back();
    }
}
