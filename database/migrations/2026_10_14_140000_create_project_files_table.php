<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Файловое хранилище проекта: файлы лежат на сервере (приватный диск).
    public function up(): void
    {
        Schema::create('project_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notebook_project_id')->constrained('notebook_projects')->cascadeOnDelete();
            $table->string('name');
            $table->string('original_name');
            $table->string('path', 512);
            $table->string('mime_type', 255)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->string('category', 20)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('notebook_project_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_files');
    }
};
