<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notebook_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status', 20)->default('idea');
            $table->string('priority', 20)->default('normal');
            $table->string('local_path', 1024)->nullable();
            $table->string('repository_url', 2048)->nullable();
            $table->json('technologies')->nullable();
            $table->date('start_date')->nullable();
            $table->date('deadline')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'is_pinned']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notebook_projects');
    }
};
