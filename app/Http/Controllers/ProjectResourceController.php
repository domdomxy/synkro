<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectActivityLog;
use App\Models\ProjectResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProjectResourceController extends Controller
{
    public function index(Project $project)
    {
        $this->authorize('view', $project);

        return Inertia::render('Projects/Resources', [
            'project' => $project,
            'resources' => $project->resources()->with('uploader')->get(),
            'canManage' => Auth::user()->can('manageResources', $project),
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('manageResources', $project);

        $validated = $request->validate([
            'name' => 'nullable|string|max:150',
            'description' => 'nullable|string|max:1000',
            'file' => 'required|file|max:51200',
        ], [
            'file.max' => 'That file exceeds the 50MB size limit.',
        ]);

        $file = $request->file('file');

        $resource = $project->resources()->create([
            'user_id' => Auth::id(),
            'name' => $validated['name'] ?: $file->getClientOriginalName(),
            'description' => $validated['description'] ?? null,
            'original_name' => $file->getClientOriginalName(),
            'path' => $file->store('project-resources', 'public'),
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
        ]);

        ProjectActivityLog::log($project, 'resource_added', ['name' => $resource->name]);

        return back()->with('success', 'File added.');
    }

    public function update(Request $request, ProjectResource $resource)
    {
        $project = $resource->project;
        $this->authorize('manageResources', $project);

        $validated = $request->validate([
            'name' => 'nullable|string|max:150',
            'description' => 'nullable|string|max:1000',
            'file' => 'nullable|file|max:51200',
        ], [
            'file.max' => 'That file exceeds the 50MB size limit.',
        ]);

        $oldName = $resource->name;

        $updates = [
            'name' => $validated['name'] ?: $resource->name,
            'description' => $validated['description'] ?? null,
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');

            if ($resource->path) {
                Storage::disk('public')->delete($resource->path);
            }

            $updates['original_name'] = $file->getClientOriginalName();
            $updates['path'] = $file->store('project-resources', 'public');
            $updates['mime_type'] = $file->getClientMimeType();
            $updates['size'] = $file->getSize();

            // A bare rename shouldn't silently keep the old filename as the display name.
            if (empty($validated['name'])) {
                $updates['name'] = $file->getClientOriginalName();
            }
        }

        $resource->update($updates);

        ProjectActivityLog::log($project, 'resource_updated', [
            'old_name' => $oldName,
            'name' => $resource->name,
        ]);

        return back()->with('success', 'File updated.');
    }

    public function destroy(ProjectResource $resource)
    {
        $project = $resource->project;
        $this->authorize('manageResources', $project);

        if ($resource->path) {
            Storage::disk('public')->delete($resource->path);
        }

        $name = $resource->name;
        $resource->delete();

        ProjectActivityLog::log($project, 'resource_removed', ['name' => $name]);

        return back()->with('success', 'File removed.');
    }
}
