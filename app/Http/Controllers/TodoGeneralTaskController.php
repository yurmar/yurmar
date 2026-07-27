<?php

namespace App\Http\Controllers;

use App\Models\TodoDay;
use App\Models\TodoTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TodoGeneralTaskController extends Controller
{
    public function index(): JsonResponse
    {
        $tasks = TodoTask::whereNull('todo_day_id')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json($tasks);
    }

    public function store(Request $request): JsonResponse
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

        $nextOrder = TodoTask::whereNull('todo_day_id')->max('sort_order') + 1;

        foreach ($lines as $i => $title) {
            TodoTask::create(['todo_day_id' => null, 'title' => $title, 'sort_order' => $nextOrder + $i]);
        }

        return response()->json(
            TodoTask::whereNull('todo_day_id')->orderBy('sort_order')->orderBy('id')->get(),
            201
        );
    }

    public function update(Request $request, TodoTask $todoTask): JsonResponse
    {
        abort_unless($todoTask->todo_day_id === null, 404);

        $data = $request->validate([
            'title' => 'sometimes|string|max:500',
            'is_done' => 'sometimes|boolean',
            'is_priority' => 'sometimes|boolean',
        ]);

        $todoTask->update($data);

        return response()->json($todoTask);
    }

    public function move(Request $request, TodoTask $todoTask): JsonResponse
    {
        abort_unless($todoTask->todo_day_id === null, 404);

        $data = $request->validate([
            'date' => 'required|date',
        ]);

        $targetDay = TodoDay::firstOrCreate(['date' => $data['date']]);

        $todoTask->update([
            'todo_day_id' => $targetDay->id,
            'sort_order' => $targetDay->tasks()->max('sort_order') + 1,
        ]);

        return response()->json($todoTask);
    }

    public function destroy(TodoTask $todoTask): JsonResponse
    {
        abort_unless($todoTask->todo_day_id === null, 404);

        $todoTask->delete();

        return response()->json(null, 204);
    }
}
