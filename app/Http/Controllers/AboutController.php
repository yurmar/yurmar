<?php

namespace App\Http\Controllers;

use App\Models\AboutBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AboutController extends Controller
{
    public function show(): JsonResponse
    {
        $about = AboutBlock::first();

        return response()->json($about);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'description' => 'nullable|string',
            'short_facts' => 'nullable|array',
            'skills_frontend' => 'nullable|array',
            'skills_backend' => 'nullable|array',
            'skills_devops' => 'nullable|array',
            'skills_design' => 'nullable|array',
        ]);

        $about = AboutBlock::firstOrNew([]);
        $about->fill($data)->save();

        return response()->json($about);
    }
}
