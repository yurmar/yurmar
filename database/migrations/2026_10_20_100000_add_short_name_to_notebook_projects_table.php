<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Короткое название проекта (для списков, ссылок и т.п.).
    public function up(): void
    {
        Schema::table('notebook_projects', function (Blueprint $table) {
            $table->string('short_name', 50)->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('notebook_projects', function (Blueprint $table) {
            $table->dropColumn('short_name');
        });
    }
};
