<?php

namespace App\Http\Controllers;

use App\Models\ExampleFolder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExampleFolderController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(ExampleFolder::orderBy('sort_order')->get());
    }

    public function show(ExampleFolder $exampleFolder): JsonResponse
    {
        return response()->json($exampleFolder->load('examples'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'description'     => 'nullable|string',
            'icon'            => 'nullable|string|max:100',
            'color'           => 'nullable|string|max:50',
            'screenshot_path' => 'nullable|string',
            'url'             => 'nullable|string',
            'sort_order'      => 'nullable|integer',
        ]);

        return response()->json(ExampleFolder::create($data), 201);
    }

    public function update(Request $request, ExampleFolder $exampleFolder): JsonResponse
    {
        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'description'     => 'nullable|string',
            'icon'            => 'nullable|string|max:100',
            'color'           => 'nullable|string|max:50',
            'screenshot_path' => 'nullable|string',
            'url'             => 'nullable|string',
            'sort_order'      => 'nullable|integer',
        ]);

        $exampleFolder->update($data);

        return response()->json($exampleFolder);
    }

    public function destroy(ExampleFolder $exampleFolder): JsonResponse
    {
        $exampleFolder->delete();

        return response()->json(null, 204);
    }
}
