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
            $table->unsignedBigInteger('notebook_project_id');
            $table->string('name');
            $table->string('original_name');
            $table->string('path', 512);
            $table->string('mime_type', 255)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->string('category', 20)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            // Имя FK задано явно: после переименования project_files → project_links
            // прежнее project_files_notebook_project_id_foreign остаётся занятым (MySQL).
            $table->foreign('notebook_project_id', 'fk_storage_files_project')
                ->references('id')->on('notebook_projects')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_files');
    }
};
