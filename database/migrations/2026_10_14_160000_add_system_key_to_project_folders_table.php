<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Системные папки по типу файла (Изображения, Видео, …) — создаются автоматически.
    public function up(): void
    {
        Schema::table('project_folders', function (Blueprint $table) {
            $table->string('system_key', 20)->nullable()->after('name');
            $table->index(['notebook_project_id', 'system_key'], 'idx_folders_project_system');
        });
    }

    public function down(): void
    {
        Schema::table('project_folders', function (Blueprint $table) {
            $table->dropIndex('idx_folders_project_system');
            $table->dropColumn('system_key');
        });
    }
};
