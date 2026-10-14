<?php

namespace App\Http\Controllers;

use App\Models\NotebookProject;
use App\Models\ProjectFolder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NotebookProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $projects = $request->user()->notebookProjects()
            ->withCount([
                'tasks as tasks_count' => fn ($q) => $q->where('status', '!=', 'cancelled'),
                'tasks as done_tasks_count' => fn ($q) => $q->where('status', 'done'),
                'links',
                'files',
            ])
            ->orderByDesc('is_pinned')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($projects);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request, false);

        if (! isset($data['name']) || trim($data['name']) === '') {
            $data['name'] = NotebookProject::UNTITLED;
        }

        $project = $request->user()->notebookProjects()->create($data);

        return response()->json($project->fresh(), 201);
    }

    public function show(Request $request, NotebookProject $notebookProject): JsonResponse
    {
        $this->authorize('view', $notebookProject);

        ProjectFolder::ensureSystem($notebookProject);

        $notebookProject->loadCount([
            'tasks as tasks_count' => fn ($q) => $q->where('status', '!=', 'cancelled'),
            'tasks as done_tasks_count' => fn ($q) => $q->where('status', 'done'),
            'links',
            'files',
        ]);
        $notebookProject->load([
            'milestones' => fn ($q) => $q->withCount([
                'tasks as tasks_count' => fn ($t) => $t->where('status', '!=', 'cancelled'),
                'tasks as done_tasks_count' => fn ($t) => $t->where('status', 'done'),
            ]),
            'tasks',
            'links',
            'files',
            'folders',
        ]);

        return response()->json($notebookProject);
    }

    public function update(Request $request, NotebookProject $notebookProject): JsonResponse
    {
        $this->authorize('update', $notebookProject);

        $data = $this->validated($request, true, $notebookProject);

        if (array_key_exists('name', $data) && trim((string) $data['name']) === '') {
            $data['name'] = NotebookProject::UNTITLED;
        }

        $notebookProject->update($data);

        return response()->json($notebookProject->fresh());
    }

    public function destroy(Request $request, NotebookProject $notebookProject): JsonResponse
    {
        $this->authorize('delete', $notebookProject);

        $notebookProject->delete();

        return response()->json(null, 204);
    }

    private function validated(Request $request, bool $partial, ?NotebookProject $project = null): array
    {
        $startDate = $request->input('start_date', $project?->start_date?->toDateString());

        return $request->validate([
            'name' => 'sometimes|nullable|string|max:255',
            'description' => 'sometimes|nullable|string|max:20000',
            'status' => ['sometimes', Rule::in(NotebookProject::STATUSES)],
            'priority' => ['sometimes', Rule::in(NotebookProject::PRIORITIES)],
            'local_path' => 'sometimes|nullable|string|max:1024',
            'repository_url' => ['sometimes', 'nullable', 'string', 'max:2048', 'url:http,https'],
            'technologies' => 'sometimes|nullable|array|max:30',
            'technologies.*' => 'string|max:50',
            'start_date' => 'sometimes|nullable|date',
            'deadline' => array_filter([
                'sometimes', 'nullable', 'date',
                $startDate ? 'after_or_equal:'.$startDate : null,
            ]),
            'is_pinned' => 'sometimes|boolean',
        ]);
    }
}
