<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Note::orderByDesc('updated_at')->get());
    }

    public function store(): JsonResponse
    {
        $note = Note::create(['title' => '', 'content' => null]);

        return response()->json($note, 201);
    }

    public function update(Request $request, Note $note): JsonResponse
    {
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

    public function destroy(Note $note): JsonResponse
    {
        $note->delete();

        return response()->json(null, 204);
    }

    public function trashed(): JsonResponse
    {
        return response()->json(Note::onlyTrashed()->orderByDesc('deleted_at')->get());
    }

    public function restore(int $note): JsonResponse
    {
        $note = Note::onlyTrashed()->findOrFail($note);
        $note->restore();

        return response()->json($note);
    }

    public function forceDestroy(int $note): JsonResponse
    {
        Note::onlyTrashed()->findOrFail($note)->forceDelete();

        return response()->json(null, 204);
    }
}
