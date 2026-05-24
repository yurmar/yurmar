<?php

namespace App\Http\Controllers;

use App\Models\Technology;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TechnologyController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Technology::orderBy('sort_order')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'color' => 'nullable|string|max:20',
            'category' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer',
        ]);

        return response()->json(Technology::create($data), 201);
    }

    public function update(Request $request, Technology $technology): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'color' => 'nullable|string|max:20',
            'category' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer',
        ]);

        $technology->update($data);

        return response()->json($technology);
    }

    public function destroy(Technology $technology): JsonResponse
    {
        $technology->delete();

        return response()->json(null, 204);
    }
}
