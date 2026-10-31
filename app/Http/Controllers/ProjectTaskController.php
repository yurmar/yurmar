<?php

namespace App\Http\Controllers;

use App\Models\NotebookProject;
use App\Models\ProjectTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Services\ProjectJournal;

class ProjectTaskController extends Controller
{
    public function store(Request $request, NotebookProject $notebookProject): JsonResponse
    {
        $this->authorize('update', $notebookProject);

        $data = $this->validated($request, $notebookProject);
        $data['title'] = $this->title($data['title'] ?? null);
        $data['sort_order'] = ((int) $notebookProject->tasks()->max('sort_order')) + 1;

        if (($data['status'] ?? null) === 'done') {
            $data['completed_at'] = now();
        }

        $task = $notebookProject->tasks()->create($data);
        ProjectJournal::created($notebookProject, 'task', $task);

        return response()->json($task->fresh(), 201);
    }

    public function update(Request $request, NotebookProject $notebookProject, ProjectTask $projectTask): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        $this->ensureBelongs($notebookProject, $projectTask);

        $data = $this->validated($request, $notebookProject);

        if (array_key_exists('title', $data)) {
            $data['title'] = $this->title($data['title']);
        }

        if (array_key_exists('status', $data)) {
            $data['completed_at'] = $data['status'] === 'done'
                ? ($projectTask->completed_at ?? now())
                : null;
        }

        $original = $projectTask->getRawOriginal();
        $projectTask->update($data);
        ProjectJournal::updated($notebookProject, 'task', $projectTask, $original);

        return response()->json($projectTask->fresh());
    }

    public function destroy(Request $request, NotebookProject $notebookProject, ProjectTask $projectTask): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        $this->ensureBelongs($notebookProject, $projectTask);

        ProjectJournal::deleted($notebookProject, 'task', $projectTask);
        $projectTask->delete();

        return response()->json(null, 204);
    }

    public function reorder(Request $request, NotebookProject $notebookProject): JsonResponse
    {
        $this->authorize('update', $notebookProject);

        $data = $request->validate([
            'ids' => 'required|array|min:1|max:500',
            'ids.*' => [
                'integer',
                'distinct',
                Rule::exists('project_tasks', 'id')->where('notebook_project_id', $notebookProject->id),
            ],
        ]);

        DB::transaction(function () use ($data) {
            foreach (array_values($data['ids']) as $index => $id) {
                ProjectTask::whereKey($id)->update(['sort_order' => $index]);
            }
        });

        ProjectJournal::reordered($notebookProject, 'task');

        return response()->json($notebookProject->tasks()->get());
    }

    private function ensureBelongs(NotebookProject $project, ProjectTask $task): void
    {
        abort_unless($task->notebook_project_id === $project->id, 404);
    }

    private function title(?string $title): string
    {
        $title = trim((string) $title);

        return $title === '' ? 'Без названия' : $title;
    }

    private function validated(Request $request, NotebookProject $project): array
    {
        return $request->validate([
            'title' => 'sometimes|nullable|string|max:255',
            'description' => 'sometimes|nullable|string|max:5000',
            'status' => ['sometimes', Rule::in(ProjectTask::STATUSES)],
            'priority' => ['sometimes', Rule::in(NotebookProject::PRIORITIES)],
            'due_date' => 'sometimes|nullable|date',
            'milestone_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('project_milestones', 'id')->where('notebook_project_id', $project->id),
            ],
            'note_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('notes', 'id')->where('user_id', $request->user()->id)->whereNull('deleted_at'),
            ],
            'reference_url' => ['sometimes', 'nullable', 'string', 'max:2048', 'url:http,https'],
        ]);
    }
}
