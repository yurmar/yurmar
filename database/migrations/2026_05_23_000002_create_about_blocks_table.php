<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('about_blocks', function (Blueprint $table) {
            $table->id();
            $table->text('description')->nullable();
            $table->json('short_facts')->nullable();
            $table->json('skills_frontend')->nullable();
            $table->json('skills_backend')->nullable();
            $table->json('skills_devops')->nullable();
            $table->json('skills_design')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('about_blocks');
    }
};
