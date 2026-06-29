<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ImageController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,gif,webp|max:8192',
        ]);

        $path = $request->file('image')->store('examples', 'public');

        return response()->json(['url' => Storage::url($path)]);
    }
}
