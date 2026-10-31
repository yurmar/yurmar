<?php

namespace App\Http\Controllers;

use App\Models\NotebookProject;
use App\Models\ProjectLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Services\ProjectJournal;

class ProjectLinkController extends Controller
{
    public function store(Request $request, NotebookProject $notebookProject): JsonResponse
    {
        $this->authorize('update', $notebookProject);

        $data = $request->validate($this->rules(true));
        $data = $this->normalize($data, null);
        $data['sort_order'] = ((int) $notebookProject->links()->max('sort_order')) + 1;

        $link = $notebookProject->links()->create($data);
        ProjectJournal::created($notebookProject, 'link', $link);

        return response()->json($link->fresh(), 201);
    }

    public function update(Request $request, NotebookProject $notebookProject, ProjectLink $projectLink): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        abort_unless($projectLink->notebook_project_id === $notebookProject->id, 404);

        $data = $request->validate($this->rules(false));
        $data = $this->normalize($data, $projectLink);

        $original = $projectLink->getRawOriginal();
        $projectLink->update($data);
        ProjectJournal::updated($notebookProject, 'link', $projectLink, $original);

        return response()->json($projectLink->fresh());
    }

    public function destroy(Request $request, NotebookProject $notebookProject, ProjectLink $projectLink): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        abort_unless($projectLink->notebook_project_id === $notebookProject->id, 404);

        ProjectJournal::deleted($notebookProject, 'link', $projectLink);
        $projectLink->delete();

        return response()->json(null, 204);
    }

    private function rules(bool $creating): array
    {
        $presence = $creating ? 'required' : 'sometimes';

        return [
            'name' => [$presence, 'nullable', 'string', 'max:255'],
            'type' => [$presence, Rule::in(ProjectLink::TYPES)],
            'path' => 'sometimes|nullable|string|max:1024',
            'url' => ['sometimes', 'nullable', 'string', 'max:2048', 'url:http,https'],
            'description' => 'sometimes|nullable|string|max:5000',
            'category' => ['sometimes', 'nullable', Rule::in(ProjectLink::CATEGORIES)],
            'tags' => 'sometimes|nullable|array|max:20',
            'tags.*' => 'string|max:30',
        ];
    }

    /**
     * Приводит запись к согласованному виду: для local_path нужен path (url обнуляется),
     * для url — url (path обнуляется). При создании значение обязательно; при правке его
     * можно временно очистить (смена типа, ввод «с нуля») — поле остаётся пустым.
     */
    private function normalize(array $data, ?ProjectLink $existing): array
    {
        $type = $data['type'] ?? $existing?->type;
        $path = array_key_exists('path', $data) ? $data['path'] : $existing?->path;
        $url = array_key_exists('url', $data) ? $data['url'] : $existing?->url;

        if ($type === 'local_path') {
            if ($existing === null && trim((string) $path) === '') {
                throw ValidationException::withMessages(['path' => 'Укажите путь.']);
            }
            $data['path'] = trim((string) $path) === '' ? null : trim((string) $path);
            $data['url'] = null;
        } else {
            if ($existing === null && trim((string) $url) === '') {
                throw ValidationException::withMessages(['url' => 'Укажите ссылку.']);
            }
            $data['url'] = trim((string) $url) === '' ? null : trim((string) $url);
            $data['path'] = null;
        }

        if (array_key_exists('name', $data) || $existing === null) {
            $name = trim((string) ($data['name'] ?? ''));
            $data['name'] = $name === '' ? 'Без названия' : $name;
        }

        return $data;
    }
}
