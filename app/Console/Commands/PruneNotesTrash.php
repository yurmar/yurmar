<?php

namespace App\Console\Commands;

use App\Models\Note;
use Illuminate\Console\Command;

class PruneNotesTrash extends Command
{
    protected $signature = 'notes:prune-trash';

    protected $description = 'Окончательно удалить заметки, находящиеся в корзине дольше 30 дней';

    public function handle(): int
    {
        $cutoff = now()->subDays(30);

        $count = Note::onlyTrashed()->where('deleted_at', '<', $cutoff)->count();

        Note::onlyTrashed()->where('deleted_at', '<', $cutoff)->forceDelete();

        $this->info("Удалено заметок из корзины: {$count}");

        return self::SUCCESS;
    }
}
