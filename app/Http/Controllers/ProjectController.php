<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Project::orderBy('sort_order')->get());
    }

    public function show(Project $project): JsonResponse
    {
        return response()->json($project);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'stack' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'screenshot_path' => 'nullable|string',
            'url' => 'nullable|url',
            'is_featured' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        return response()->json(Project::create($data), 201);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'stack' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'screenshot_path' => 'nullable|string',
            'url' => 'nullable|url',
            'is_featured' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $project->update($data);

        return response()->json($project);
    }

    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return response()->json(null, 204);
    }
}
