<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notebook_project_id')->constrained('notebook_projects')->cascadeOnDelete();
            $table->foreignId('milestone_id')->nullable()->constrained('project_milestones')->nullOnDelete();
            $table->foreignId('note_id')->nullable()->constrained('notes')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status', 20)->default('todo');
            $table->string('priority', 20)->default('normal');
            $table->date('due_date')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('reference_url', 2048)->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['notebook_project_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_tasks');
    }
};
