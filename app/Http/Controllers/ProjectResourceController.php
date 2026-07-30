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
            'resources' => $project->resources()->with('uploader')->latest()->get(),
            'canManage' => Auth::user()->can('manageResources', $project),
        ]);
    }

    /**
     * Adds one or more resources at once - any mix of uploaded files and
     * pasted links - mirroring the batch file/link submission UX used for
     * task deliverables.
     */
    public function store(Request $request, Project $project)
    {
        $this->authorize('manageResources', $project);

        $validated = $request->validate([
            'files' => 'nullable|array',
            'files.*' => 'file|max:51200',
            // Parallel array to `files` (matched by index) so each file in the
            // batch can carry its own optional description.
            'file_descriptions' => 'nullable|array',
            'file_descriptions.*' => 'nullable|string|max:1000',
            'links' => 'nullable|array',
            'links.*.url' => 'required|url',
            'links.*.title' => 'nullable|string|max:150',
            'links.*.description' => 'nullable|string|max:1000',
        ], [
            'files.*.max' => 'One or more files exceed the 50MB size limit and were not added.',
            'links.*.url.required' => 'Each link needs a URL.',
            'links.*.url.url' => 'One or more links are not valid URLs.',
        ]);

        if (empty($validated['files']) && empty($validated['links'])) {
            return back()->withErrors(['files' => 'Add at least one file or link.']);
        }

        $addedNames = [];

        foreach ($request->file('files', []) as $index => $file) {
            $resource = $project->resources()->create([
                'user_id' => Auth::id(),
                'type' => 'file',
                'name' => $file->getClientOriginalName(),
                'description' => $validated['file_descriptions'][$index] ?? null,
                'original_name' => $file->getClientOriginalName(),
                'path' => $file->store('project-resources', 'public'),
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ]);

            $addedNames[] = $resource->name;
        }

        foreach ($validated['links'] ?? [] as $link) {
            $resource = $project->resources()->create([
                'user_id' => Auth::id(),
                'type' => 'link',
                'name' => $link['title'] ?: $link['url'],
                'description' => $link['description'] ?? null,
                'url' => $link['url'],
            ]);

            $addedNames[] = $resource->name;
        }

        foreach ($addedNames as $name) {
            ProjectActivityLog::log($project, 'resource_added', ['name' => $name]);
        }

        $message = count($addedNames) > 1
            ? count($addedNames).' resources added.'
            : 'Resource added.';

        return back()->with('success', $message);
    }

    public function update(Request $request, ProjectResource $resource)
    {
        $project = $resource->project;
        $this->authorize('manageResources', $project);

        $oldName = $resource->name;

        if ($resource->type === 'link') {
            $validated = $request->validate([
                'name' => 'nullable|string|max:150',
                'description' => 'nullable|string|max:1000',
                'url' => 'required|url',
            ]);

            $resource->update([
                'name' => $validated['name'] ?: $resource->name,
                'description' => $validated['description'] ?? null,
                'url' => $validated['url'],
            ]);
        } else {
            $validated = $request->validate([
                'name' => 'nullable|string|max:150',
                'description' => 'nullable|string|max:1000',
                'file' => 'nullable|file|max:51200',
            ], [
                'file.max' => 'That file exceeds the 50MB size limit.',
            ]);

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
        }

        ProjectActivityLog::log($project, 'resource_updated', [
            'old_name' => $oldName,
            'name' => $resource->name,
        ]);

        return back()->with('success', 'Resource updated.');
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

        return back()->with('success', 'Resource removed.');
    }
}
