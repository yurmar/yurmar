<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notebook_project_id')->constrained('notebook_projects')->cascadeOnDelete();
            $table->string('name');
            $table->string('type', 20);
            $table->string('path', 1024)->nullable();
            $table->string('url', 2048)->nullable();
            $table->text('description')->nullable();
            $table->string('category', 20)->nullable();
            $table->json('tags')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['notebook_project_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_files');
    }
};
