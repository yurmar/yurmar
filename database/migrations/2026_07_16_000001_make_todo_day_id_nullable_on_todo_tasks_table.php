<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Сырой MySQL-синтаксис; на sqlite (тесты) пропускаем.
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE todo_tasks MODIFY todo_day_id BIGINT UNSIGNED NULL');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('DELETE FROM todo_tasks WHERE todo_day_id IS NULL');
        DB::statement('ALTER TABLE todo_tasks MODIFY todo_day_id BIGINT UNSIGNED NOT NULL');
    }
};
