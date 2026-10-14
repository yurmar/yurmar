<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Папки файлового хранилища проекта (вложенные). Имена FK заданы явно:
    // в MySQL они уникальны в пределах БД.
    public function up(): void
    {
        Schema::create('project_folders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('notebook_project_id');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('name');
            $table->timestamps();

            $table->foreign('notebook_project_id', 'fk_folders_project')
                ->references('id')->on('notebook_projects')->cascadeOnDelete();
            $table->foreign('parent_id', 'fk_folders_parent')
                ->references('id')->on('project_folders')->cascadeOnDelete();
        });

        Schema::table('project_files', function (Blueprint $table) {
            $table->unsignedBigInteger('folder_id')->nullable()->after('notebook_project_id');
            $table->foreign('folder_id', 'fk_storage_files_folder')
                ->references('id')->on('project_folders')->cascadeOnDelete();
            // Категория теперь вычисляется по типу файла (как в файловом менеджере).
            $table->dropColumn('category');
        });
    }

    public function down(): void
    {
        Schema::table('project_files', function (Blueprint $table) {
            $table->dropForeign('fk_storage_files_folder');
            $table->dropColumn('folder_id');
            $table->string('category', 20)->nullable();
        });

        Schema::dropIfExists('project_folders');
    }
};
