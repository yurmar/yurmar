<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('brief_orders', function (Blueprint $table) {
            $table->string('site_type_other')->nullable()->after('site_types');
            $table->string('site_tasks_other')->nullable()->after('site_tasks');
            $table->string('site_functionality_other')->nullable()->after('site_functionality');
        });
    }

    public function down(): void
    {
        Schema::table('brief_orders', function (Blueprint $table) {
            $table->dropColumn(['site_type_other', 'site_tasks_other', 'site_functionality_other']);
        });
    }
};
