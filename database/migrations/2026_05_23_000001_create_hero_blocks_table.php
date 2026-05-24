<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_blocks', function (Blueprint $table) {
            $table->id();
            $table->string('photo_path')->nullable();
            $table->string('name')->default('Юрий Марчук');
            $table->string('specialization')->default('Fullstack Web Developer');
            $table->text('offer_text')->nullable();
            $table->string('resume_path')->nullable();
            $table->string('btn_portfolio')->default('Смотреть портфолио');
            $table->string('btn_contact')->default('Связаться');
            $table->string('btn_resume')->default('Скачать резюме PDF');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_blocks');
    }
};
