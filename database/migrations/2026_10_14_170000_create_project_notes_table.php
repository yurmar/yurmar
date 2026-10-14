<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Связь проекта блокнота с записями. Запись не принадлежит проекту: отвязка её не удаляет.
    public function up(): void
    {
        Schema::create('project_notes', function (Blueprint $table) {
            $table->unsignedBigInteger('notebook_project_id');
            $table->unsignedBigInteger('note_id');
            $table->timestamp('created_at')->nullable();

            $table->primary(['notebook_project_id', 'note_id']);
            $table->foreign('notebook_project_id', 'fk_project_notes_project')
                ->references('id')->on('notebook_projects')->cascadeOnDelete();
            $table->foreign('note_id', 'fk_project_notes_note')
                ->references('id')->on('notes')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_notes');
    }
};
