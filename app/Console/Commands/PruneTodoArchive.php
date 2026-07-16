<?php

namespace App\Console\Commands;

use App\Models\TodoDay;
use Illuminate\Console\Command;

class PruneTodoArchive extends Command
{
    protected $signature = 'todo:prune-archive';

    protected $description = 'Удалить из БД дни (и их задачи), которые находятся в архиве дольше 30 дней';

    public function handle(): int
    {
        $cutoff = now()->subDays(30)->toDateString();

        $days = TodoDay::withCount([
            'tasks',
            'tasks as done_tasks_count' => fn ($q) => $q->where('is_done', true),
        ])
            ->where('date', '<', $cutoff)
            ->get()
            ->filter(fn (TodoDay $day) => $day->tasks_count > 0 && $day->tasks_count === $day->done_tasks_count);

        foreach ($days as $day) {
            $day->delete();
        }

        $this->info("Удалено дней из архива: {$days->count()}");

        return self::SUCCESS;
    }
}
