<?php

namespace App\Http\Controllers;

use App\Models\TodoDay;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TodoDayController extends Controller
{
    public function index(): JsonResponse
    {
        $days = TodoDay::withCount([
            'tasks',
            'tasks as done_tasks_count' => fn ($q) => $q->where('is_done', true),
        ])->orderByDesc('date')->get();

        return response()->json($days);
    }

    public function show(TodoDay $todoDay): JsonResponse
    {
        return response()->json($todoDay->load('tasks'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'tasks' => 'required|string',
        ]);

        $lines = collect(preg_split('/\r\n|\r|\n/', $data['tasks']))
            ->map(fn ($line) => trim($line))
            ->filter()
            ->values();

        if ($lines->isEmpty()) {
            return response()->json(['message' => 'Добавьте хотя бы одно задание'], 422);
        }

        $day = TodoDay::firstOrCreate(['date' => $data['date']]);
        $nextOrder = $day->tasks()->max('sort_order') + 1;

        foreach ($lines as $i => $title) {
            $day->tasks()->create(['title' => $title, 'sort_order' => $nextOrder + $i]);
        }

        return response()->json($day->load('tasks'), 201);
    }

    public function destroy(TodoDay $todoDay): JsonResponse
    {
        $todoDay->delete();

        return response()->json(null, 204);
    }
}
