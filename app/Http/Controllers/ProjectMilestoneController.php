<?php

namespace App\Http\Controllers;

use App\Models\NotebookProject;
use App\Models\ProjectMilestone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProjectMilestoneController extends Controller
{
    public function store(Request $request, NotebookProject $notebookProject): JsonResponse
    {
        $this->authorize('update', $notebookProject);

        $data = $this->validated($request);
        $data['title'] = $this->title($data['title'] ?? null);
        $data['sort_order'] = ((int) $notebookProject->milestones()->max('sort_order')) + 1;

        $milestone = $notebookProject->milestones()->create($data);

        return response()->json($milestone->fresh(), 201);
    }

    public function update(Request $request, NotebookProject $notebookProject, ProjectMilestone $projectMilestone): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        $this->ensureBelongs($notebookProject, $projectMilestone);

        $data = $this->validated($request, $projectMilestone);

        if (array_key_exists('title', $data)) {
            $data['title'] = $this->title($data['title']);
        }

        $projectMilestone->update($data);

        return response()->json($projectMilestone->fresh());
    }

    public function destroy(Request $request, NotebookProject $notebookProject, ProjectMilestone $projectMilestone): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        $this->ensureBelongs($notebookProject, $projectMilestone);

        // Задачи не удаляются: FK nullOnDelete переводит их в «Без этапа».
        $projectMilestone->delete();

        return response()->json(null, 204);
    }

    public function reorder(Request $request, NotebookProject $notebookProject): JsonResponse
    {
        $this->authorize('update', $notebookProject);

        $data = $request->validate([
            'ids' => 'required|array|min:1|max:200',
            'ids.*' => [
                'integer',
                'distinct',
                Rule::exists('project_milestones', 'id')->where('notebook_project_id', $notebookProject->id),
            ],
        ]);

        DB::transaction(function () use ($data) {
            foreach (array_values($data['ids']) as $index => $id) {
                ProjectMilestone::whereKey($id)->update(['sort_order' => $index]);
            }
        });

        return response()->json($notebookProject->milestones()->get());
    }

    private function ensureBelongs(NotebookProject $project, ProjectMilestone $milestone): void
    {
        abort_unless($milestone->notebook_project_id === $project->id, 404);
    }

    private function title(?string $title): string
    {
        $title = trim((string) $title);

        return $title === '' ? 'Без названия' : $title;
    }

    private function validated(Request $request, ?ProjectMilestone $milestone = null): array
    {
        $startDate = $request->input('start_date', $milestone?->start_date?->toDateString());

        return $request->validate([
            'title' => 'sometimes|nullable|string|max:255',
            'description' => 'sometimes|nullable|string|max:5000',
            'status' => ['sometimes', Rule::in(ProjectMilestone::STATUSES)],
            'start_date' => 'sometimes|nullable|date',
            'deadline' => array_filter([
                'sometimes', 'nullable', 'date',
                $startDate ? 'after_or_equal:'.$startDate : null,
            ]),
        ]);
    }
}
