<?php

namespace App\Http\Controllers;

use App\Models\HeroBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HeroController extends Controller
{
    public function show(): JsonResponse
    {
        $hero = HeroBlock::first();

        return response()->json($hero);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'photo_path' => 'nullable|string',
            'name' => 'required|string|max:255',
            'specialization' => 'required|string|max:255',
            'offer_text' => 'nullable|string',
            'resume_path' => 'nullable|string',
            'btn_portfolio' => 'nullable|string|max:100',
            'btn_contact' => 'nullable|string|max:100',
            'btn_resume' => 'nullable|string|max:100',
        ]);

        $hero = HeroBlock::firstOrNew([]);
        $hero->fill($data)->save();

        return response()->json($hero);
    }
}
