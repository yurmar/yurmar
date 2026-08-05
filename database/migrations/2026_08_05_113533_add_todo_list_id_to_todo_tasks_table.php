<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('todo_tasks', function (Blueprint $table) {
            $table->foreignId('todo_list_id')->nullable()->after('todo_day_id')->constrained('todo_lists')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('todo_tasks', function (Blueprint $table) {
            $table->dropForeign(['todo_list_id']);
            $table->dropColumn('todo_list_id');
        });
    }
};
