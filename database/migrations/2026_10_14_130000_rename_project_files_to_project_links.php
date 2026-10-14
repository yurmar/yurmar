<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Ссылки и локальные пути живут отдельно от загружаемых файлов:
    // прежняя таблица project_files становится project_links.
    public function up(): void
    {
        Schema::rename('project_files', 'project_links');
    }

    public function down(): void
    {
        Schema::rename('project_links', 'project_files');
    }
};
