<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('example_folders', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('icon')->nullable();
            $table->string('color')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('example_folders');
    }
};
