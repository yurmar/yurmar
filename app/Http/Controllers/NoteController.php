<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json($request->user()->notes()->orderByDesc('updated_at')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $note = $request->user()->notes()->create(['title' => '', 'content' => null]);

        return response()->json($note, 201);
    }

    public function update(Request $request, Note $note): JsonResponse
    {
        $this->authorize('update', $note);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|nullable|string',
        ]);

        if (array_key_exists('title', $data) && trim($data['title']) === '') {
            $data['title'] = 'Без названия';
        }

        $note->update($data);

        return response()->json($note);
    }

    public function destroy(Request $request, Note $note): JsonResponse
    {
        $this->authorize('delete', $note);

        $note->delete();

        return response()->json(null, 204);
    }

    public function trashed(Request $request): JsonResponse
    {
        return response()->json($request->user()->notes()->onlyTrashed()->orderByDesc('deleted_at')->get());
    }

    public function restore(Request $request, int $note): JsonResponse
    {
        $note = $request->user()->notes()->onlyTrashed()->findOrFail($note);
        $this->authorize('restore', $note);
        $note->restore();

        return response()->json($note);
    }

    public function forceDestroy(Request $request, int $note): JsonResponse
    {
        $note = $request->user()->notes()->onlyTrashed()->findOrFail($note);
        $this->authorize('forceDelete', $note);
        $note->forceDelete();

        return response()->json(null, 204);
    }
}
