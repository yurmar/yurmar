<?php

namespace App\Http\Controllers;

use App\Models\TodoDay;
use App\Models\TodoList;
use App\Models\TodoTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TodoListTaskController extends Controller
{
    public function store(Request $request, TodoList $todoList): JsonResponse
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

        $nextOrder = $todoList->tasks()->max('sort_order') + 1;

        foreach ($lines as $i => $title) {
            $todoList->tasks()->create(['title' => $title, 'sort_order' => $nextOrder + $i]);
        }

        return response()->json($todoList->load('tasks'), 201);
    }

    public function update(Request $request, TodoList $todoList, TodoTask $todoTask): JsonResponse
    {
        abort_unless($todoTask->todo_list_id === $todoList->id, 404);

        $data = $request->validate([
            'title' => 'sometimes|string|max:500',
            'is_done' => 'sometimes|boolean',
            'is_priority' => 'sometimes|boolean',
        ]);

        $todoTask->update($data);

        return response()->json($todoTask);
    }

    public function move(Request $request, TodoList $todoList, TodoTask $todoTask): JsonResponse
    {
        abort_unless($todoTask->todo_list_id === $todoList->id, 404);

        $data = $request->validate([
            'date' => 'required|date',
        ]);

        $targetDay = TodoDay::firstOrCreate(['date' => $data['date']]);

        $todoTask->update([
            'todo_day_id' => $targetDay->id,
            'todo_list_id' => null,
            'sort_order' => $targetDay->tasks()->max('sort_order') + 1,
        ]);

        return response()->json($todoTask);
    }

    public function destroy(TodoList $todoList, TodoTask $todoTask): JsonResponse
    {
        abort_unless($todoTask->todo_list_id === $todoList->id, 404);

        $todoTask->delete();

        return response()->json(null, 204);
    }
}
