<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\NotebookProject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotebookProjectNoteController extends Controller
{
    public function index(Request $request, NotebookProject $notebookProject): JsonResponse
    {
        $this->authorize('view', $notebookProject);

        return response()->json($notebookProject->notes()->orderByDesc('notes.updated_at')->get());
    }

    public function attach(Request $request, NotebookProject $notebookProject, Note $note): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        $this->authorize('update', $note);

        // Идемпотентно: повторная привязка ничего не меняет.
        $notebookProject->notes()->syncWithoutDetaching([$note->id => ['created_at' => now()]]);

        return response()->json($notebookProject->notes()->where('notes.id', $note->id)->first(), 201);
    }

    public function detach(Request $request, NotebookProject $notebookProject, Note $note): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        $this->authorize('update', $note);

        // Только связь: сама запись остаётся.
        $notebookProject->notes()->detach($note->id);

        return response()->json(null, 204);
    }

    public function projectsForNote(Request $request, Note $note): JsonResponse
    {
        $this->authorize('update', $note);

        return response()->json($note->notebookProjects()->orderBy('notebook_projects.name')->get());
    }
}
