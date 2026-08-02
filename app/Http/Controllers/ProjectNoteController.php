<?php

namespace App\Http\Controllers;

use App\Events\TaskChanged;
use App\Models\Project;
use App\Models\ProjectNote;
use App\Models\TaskChecklistItem;
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
            ->map(fn ($text) => ['id' => (string) Str::random(8), 'text' => $text, 'done' => false, 'checklist_item_id' => null])
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
                    'checklist_item_id' => $existing['checklist_item_id'] ?? null,
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

        $linkedChecklistItemId = null;
        $newDone = null;

        $items = collect($note->content)->map(function ($item) use ($itemId, &$linkedChecklistItemId, &$newDone) {
            if ($item['id'] === $itemId) {
                $item['done'] = !$item['done'];
                $newDone = $item['done'];
                $linkedChecklistItemId = $item['checklist_item_id'] ?? null;
            }
            return $item;
        })->all();

        $note->update(['content' => $items]);

        // This item started life as a copy of a task checklist item (see
        // TaskChecklistItemController::addToNotes) - keep the two checkboxes
        // mirrored instead of letting them drift apart, and let other project
        // viewers see the checklist update live the same way a direct toggle
        // on the task itself would (TaskChecklistItemController::update).
        if ($linkedChecklistItemId) {
            $checklistItem = TaskChecklistItem::find($linkedChecklistItemId);

            // Re-check assignee-ship rather than trusting the stored link: the
            // task could have been reassigned since this note item was added,
            // and checking a checklist item done/undone is the current
            // assignee's call alone (see TaskChecklistItemController::update).
            if ($checklistItem && $checklistItem->task && $checklistItem->task->assigned_to === Auth::id()) {
                $checklistItem->update(['done' => $newDone]);

                try {
                    broadcast(TaskChanged::for($checklistItem->task))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        }

        return back()->with('success', null);
    }

    public function addItem(Request $request, ProjectNote $note)
    {
        abort_unless($note->user_id === Auth::id(), 403);

        $validated = $request->validate(['text' => 'required|string|max:300']);

        $items = $note->content;
        $items[] = ['id' => (string) Str::random(8), 'text' => trim($validated['text']), 'done' => false, 'checklist_item_id' => null];
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
