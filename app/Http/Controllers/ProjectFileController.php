<?php

namespace App\Http\Controllers;

use App\Models\NotebookProject;
use App\Models\ProjectFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProjectFileController extends Controller
{
    public function store(Request $request, NotebookProject $notebookProject): JsonResponse
    {
        $this->authorize('update', $notebookProject);

        $data = $request->validate($this->rules(true));
        $data = $this->normalize($data, null);
        $data['sort_order'] = ((int) $notebookProject->files()->max('sort_order')) + 1;

        $file = $notebookProject->files()->create($data);

        return response()->json($file->fresh(), 201);
    }

    public function update(Request $request, NotebookProject $notebookProject, ProjectFile $projectFile): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        abort_unless($projectFile->notebook_project_id === $notebookProject->id, 404);

        $data = $request->validate($this->rules(false));
        $data = $this->normalize($data, $projectFile);

        $projectFile->update($data);

        return response()->json($projectFile->fresh());
    }

    public function destroy(Request $request, NotebookProject $notebookProject, ProjectFile $projectFile): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        abort_unless($projectFile->notebook_project_id === $notebookProject->id, 404);

        $projectFile->delete();

        return response()->json(null, 204);
    }

    private function rules(bool $creating): array
    {
        $presence = $creating ? 'required' : 'sometimes';

        return [
            'name' => [$presence, 'nullable', 'string', 'max:255'],
            'type' => [$presence, Rule::in(ProjectFile::TYPES)],
            'path' => 'sometimes|nullable|string|max:1024',
            'url' => ['sometimes', 'nullable', 'string', 'max:2048', 'url:http,https'],
            'description' => 'sometimes|nullable|string|max:5000',
            'category' => ['sometimes', 'nullable', Rule::in(ProjectFile::CATEGORIES)],
            'tags' => 'sometimes|nullable|array|max:20',
            'tags.*' => 'string|max:30',
        ];
    }

    /**
     * Приводит запись к согласованному виду: для local_path нужен path (url обнуляется),
     * для url — url (path обнуляется). Работает и для частичных обновлений.
     */
    private function normalize(array $data, ?ProjectFile $existing): array
    {
        $type = $data['type'] ?? $existing?->type;
        $path = array_key_exists('path', $data) ? $data['path'] : $existing?->path;
        $url = array_key_exists('url', $data) ? $data['url'] : $existing?->url;

        if ($type === 'local_path') {
            if (trim((string) $path) === '') {
                throw ValidationException::withMessages(['path' => 'Укажите путь.']);
            }
            $data['path'] = trim($path);
            $data['url'] = null;
        } else {
            if (trim((string) $url) === '') {
                throw ValidationException::withMessages(['url' => 'Укажите ссылку.']);
            }
            $data['url'] = trim($url);
            $data['path'] = null;
        }

        if (array_key_exists('name', $data) || $existing === null) {
            $name = trim((string) ($data['name'] ?? ''));
            $data['name'] = $name === '' ? 'Без названия' : $name;
        }

        return $data;
    }
}
