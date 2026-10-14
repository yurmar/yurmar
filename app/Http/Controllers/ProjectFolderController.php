<?php

namespace App\Http\Controllers;

use App\Models\NotebookProject;
use App\Models\ProjectFile;
use App\Models\ProjectFolder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProjectFolderController extends Controller
{
    public function store(Request $request, NotebookProject $notebookProject): JsonResponse
    {
        $this->authorize('update', $notebookProject);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => [
                'sometimes', 'nullable', 'integer',
                Rule::exists('project_folders', 'id')->where('notebook_project_id', $notebookProject->id),
            ],
        ]);

        $folder = $notebookProject->folders()->create([
            'name' => $this->cleanName($data['name']),
            'parent_id' => $data['parent_id'] ?? null,
        ]);

        return response()->json($folder->fresh(), 201);
    }

    public function update(Request $request, NotebookProject $notebookProject, ProjectFolder $projectFolder): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        abort_unless($projectFolder->notebook_project_id === $notebookProject->id, 404);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'parent_id' => [
                'sometimes', 'nullable', 'integer',
                Rule::exists('project_folders', 'id')->where('notebook_project_id', $notebookProject->id),
            ],
        ]);

        if (array_key_exists('name', $data)) {
            $name = $this->cleanName($data['name']);
            if ($name === '') {
                unset($data['name']);
            } else {
                $data['name'] = $name;
            }
        }

        // Папку нельзя переместить в саму себя или в свою вложенную.
        if (! empty($data['parent_id']) && in_array($data['parent_id'], $projectFolder->descendantIds(), true)) {
            throw ValidationException::withMessages(['parent_id' => 'Нельзя переместить папку внутрь самой себя.']);
        }

        $projectFolder->update($data);

        return response()->json($projectFolder->fresh());
    }

    public function destroy(Request $request, NotebookProject $notebookProject, ProjectFolder $projectFolder): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        abort_unless($projectFolder->notebook_project_id === $notebookProject->id, 404);

        // Файлы внутри (в том числе во вложенных папках) удаляются и с диска.
        // Строки удаляем явно, не полагаясь на каскад FK (не везде он создаётся одинаково).
        $ids = $projectFolder->descendantIds();
        $files = ProjectFile::whereIn('folder_id', $ids);
        Storage::disk(ProjectFile::DISK)->delete($files->pluck('path')->all());

        DB::transaction(function () use ($files, $ids) {
            $files->delete();
            ProjectFolder::whereIn('id', $ids)->delete();
        });

        return response()->json(null, 204);
    }

    private function cleanName(string $name): string
    {
        $name = preg_replace('/[\x00-\x1F\x7F\/\\\\]/u', '', $name) ?? '';

        return Str::limit(trim($name), 255, '');
    }
}
