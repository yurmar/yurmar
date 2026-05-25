<?php

namespace App\Http\Controllers;

use App\Mail\BriefOrderReceived;
use App\Models\BriefOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class BriefOrderController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'contact_person'         => 'required|string|max:500',
            'company_name'           => 'required|string|max:500',
            'company_activity'       => 'required|string',
            'products_info'          => 'required|string',
            'site_sections'          => 'required|string',
            'brand_style'            => 'required|string',
            'current_site'           => 'nullable|string|max:500',
            'current_site_assessment'=> 'nullable|string',
            'competitors'            => 'nullable|string',
            'proposed_domain'        => 'nullable|string|max:500',
            'site_types'             => 'required|array|min:1',
            'site_type_other'        => 'nullable|string|max:500',
            'site_tasks'             => 'required|array|min:1',
            'site_tasks_other'       => 'nullable|string|max:500',
            'site_functionality'     => 'nullable|array',
            'site_functionality_other' => 'nullable|string|max:500',
            'target_audience'        => 'required|string',
            'language_versions'      => 'required|string|max:500',
            'design_impression'      => 'required|string',
            'color_scheme'           => 'required|string|max:500',
            'content_placement'      => 'required|string|max:500',
            'liked_sites'            => 'nullable|string',
            'disliked_sites'         => 'nullable|string',
            'has_advertising'        => 'required|string|max:100',
            'advertising_details'    => 'nullable|string',
            'hosting_type'           => 'required|string|max:200',
            'tech_support'           => 'required|string',
            'content_filling'        => 'required|string|max:200',
            'additional_wishes'      => 'nullable|string',
        ]);

        $data['site_functionality'] ??= [];

        $order = BriefOrder::create($data);

        try {
            $to = env('MAIL_NOTIFICATION_TO', 'yurmarchuk@gmail.com');
            Mail::to($to)->send(new BriefOrderReceived($order));
        } catch (\Throwable) {
            // Письмо не критично — заказ уже сохранён
        }

        return response()->json(['message' => 'Запрос успешно отправлен', 'id' => $order->id], 201);
    }

    public function index()
    {
        $orders = BriefOrder::latest()->get();
        return response()->json($orders);
    }

    public function show(BriefOrder $briefOrder)
    {
        return response()->json($briefOrder);
    }
}
