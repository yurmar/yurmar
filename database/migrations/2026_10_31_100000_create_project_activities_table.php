<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Журнал проекта блокнота: каждое добавление, изменение и удаление внутри проекта.
    public function up(): void
    {
        Schema::create('project_activities', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('notebook_project_id');
            $table->string('action', 20);
            $table->string('entity', 20);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('title', 255)->nullable();
            $table->json('changes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['notebook_project_id', 'id'], 'idx_project_activities_project');
            $table->foreign('notebook_project_id', 'fk_project_activities_project')
                ->references('id')->on('notebook_projects')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_activities');
    }
};
