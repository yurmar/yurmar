<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Service::orderBy('sort_order')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'icon' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
        ]);

        return response()->json(Service::create($data), 201);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'icon' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
        ]);

        $service->update($data);

        return response()->json($service);
    }

    public function destroy(Service $service): JsonResponse
    {
        $service->delete();

        return response()->json(null, 204);
    }
}
