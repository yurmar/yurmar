<?php

namespace App\Http\Controllers;

use App\Models\TodoDay;
use App\Models\TodoTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TodoTaskController extends Controller
{
    public function store(Request $request, TodoDay $todoDay): JsonResponse
    {
        $data = $request->validate([
            'tasks' => 'required|string',
        ]);

        $lines = collect(preg_split('/\r\n|\r|\n/', $data['tasks']))
            ->map(fn ($line) => trim($line))
            ->filter()
            ->values();

        if ($lines->isEmpty()) {
            return response()->json(['message' => 'Добавьте хотя бы одно задание'], 422);
        }

        $nextOrder = $todoDay->tasks()->max('sort_order') + 1;

        foreach ($lines as $i => $title) {
            $todoDay->tasks()->create(['title' => $title, 'sort_order' => $nextOrder + $i]);
        }

        return response()->json($todoDay->load('tasks'), 201);
    }

    public function update(Request $request, TodoDay $todoDay, TodoTask $todoTask): JsonResponse
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:500',
            'is_done' => 'sometimes|boolean',
        ]);

        $todoTask->update($data);

        return response()->json($todoTask);
    }

    public function move(Request $request, TodoDay $todoDay, TodoTask $todoTask): JsonResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
        ]);

        $targetDay = TodoDay::firstOrCreate(['date' => $data['date']]);

        if ($targetDay->id !== $todoDay->id) {
            $todoTask->update([
                'todo_day_id' => $targetDay->id,
                'sort_order' => $targetDay->tasks()->max('sort_order') + 1,
            ]);
        }

        return response()->json($todoDay->load('tasks'));
    }

    public function destroy(TodoDay $todoDay, TodoTask $todoTask): JsonResponse
    {
        $todoTask->delete();

        return response()->json(null, 204);
    }
}
