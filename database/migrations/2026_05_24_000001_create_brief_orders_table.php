<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brief_orders', function (Blueprint $table) {
            $table->id();
            // Раздел 1: Информация о компании
            $table->string('contact_person');
            $table->string('company_name');
            $table->text('company_activity');
            $table->text('products_info');
            $table->text('site_sections');
            $table->text('brand_style');
            $table->string('current_site')->nullable();
            $table->text('current_site_assessment')->nullable();
            $table->text('competitors')->nullable();
            // Раздел 2: Цели разработки
            $table->string('proposed_domain')->nullable();
            $table->json('site_types');
            $table->json('site_tasks');
            $table->json('site_functionality');
            $table->text('target_audience');
            $table->string('language_versions');
            // Раздел 5: Дизайн
            $table->text('design_impression');
            $table->string('color_scheme');
            $table->string('content_placement');
            $table->text('liked_sites')->nullable();
            $table->text('disliked_sites')->nullable();
            // Раздел 7: Реклама
            $table->string('has_advertising');
            $table->text('advertising_details')->nullable();
            // Раздел 8: Дополнительно
            $table->string('hosting_type');
            $table->text('tech_support');
            $table->string('content_filling');
            $table->text('additional_wishes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brief_orders');
    }
};
