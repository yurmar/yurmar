<?php

namespace App\Http\Controllers;

use App\Models\TodoList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TodoListController extends Controller
{
    public function index(): JsonResponse
    {
        $lists = TodoList::withCount([
            'tasks',
            'tasks as done_tasks_count' => fn ($q) => $q->where('is_done', true),
        ])->orderBy('name')->get();

        return response()->json($lists);
    }

    public function show(TodoList $todoList): JsonResponse
    {
        return response()->json($todoList->load('tasks'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'tasks' => 'nullable|string',
        ]);

        $list = TodoList::create(['name' => $data['name']]);

        $lines = collect(preg_split('/\r\n|\r|\n/', $data['tasks'] ?? ''))
            ->map(fn ($line) => trim($line))
            ->filter()
            ->values();

        foreach ($lines as $i => $title) {
            $list->tasks()->create(['title' => $title, 'sort_order' => $i]);
        }

        return response()->json($list->load('tasks'), 201);
    }

    public function update(Request $request, TodoList $todoList): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $todoList->update($data);

        return response()->json($todoList);
    }

    public function destroy(TodoList $todoList): JsonResponse
    {
        $todoList->delete();

        return response()->json(null, 204);
    }
}
