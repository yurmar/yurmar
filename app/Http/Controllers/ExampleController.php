<?php

namespace App\Http\Controllers;

use App\Models\Example;
use App\Models\ExampleFolder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExampleController extends Controller
{
    public function index(ExampleFolder $exampleFolder): JsonResponse
    {
        return response()->json($exampleFolder->examples);
    }

    public function store(Request $request, ExampleFolder $exampleFolder): JsonResponse
    {
        $data = $request->validate([
            'title'           => 'required|string|max:255',
            'description'     => 'nullable|string',
            'screenshot_path' => 'nullable|string',
            'url'             => 'nullable|url',
            'tags'            => 'nullable|string|max:255',
            'sort_order'      => 'nullable|integer',
        ]);

        $example = $exampleFolder->examples()->create($data);

        return response()->json($example, 201);
    }

    public function update(Request $request, ExampleFolder $exampleFolder, Example $example): JsonResponse
    {
        $data = $request->validate([
            'title'           => 'required|string|max:255',
            'description'     => 'nullable|string',
            'screenshot_path' => 'nullable|string',
            'url'             => 'nullable|url',
            'tags'            => 'nullable|string|max:255',
            'sort_order'      => 'nullable|integer',
        ]);

        $example->update($data);

        return response()->json($example);
    }

    public function destroy(ExampleFolder $exampleFolder, Example $example): JsonResponse
    {
        $example->delete();

        return response()->json(null, 204);
    }
}
