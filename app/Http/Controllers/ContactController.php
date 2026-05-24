<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function show(): JsonResponse
    {
        $contact = Contact::first();

        return response()->json($contact);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'description' => 'nullable|string',
            'telegram_url' => 'nullable|string',
            'max_url' => 'nullable|string',
            'email' => 'nullable|email',
            'form_title' => 'nullable|string|max:255',
        ]);

        $contact = Contact::firstOrNew([]);
        $contact->fill($data)->save();

        return response()->json($contact);
    }
}
