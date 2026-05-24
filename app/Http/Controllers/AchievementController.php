<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AchievementController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Achievement::orderBy('sort_order')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'count' => 'required|string|max:50',
            'label' => 'required|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);

        return response()->json(Achievement::create($data), 201);
    }

    public function update(Request $request, Achievement $achievement): JsonResponse
    {
        $data = $request->validate([
            'count' => 'required|string|max:50',
            'label' => 'required|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);

        $achievement->update($data);

        return response()->json($achievement);
    }

    public function destroy(Achievement $achievement): JsonResponse
    {
        $achievement->delete();

        return response()->json(null, 204);
    }
}
