<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TodoTask extends Model
{
    protected $fillable = ['todo_day_id', 'todo_list_id', 'title', 'is_done', 'is_priority', 'sort_order'];

    protected $casts = [
        'is_done' => 'boolean',
        'is_priority' => 'boolean',
    ];

    public function day(): BelongsTo
    {
        return $this->belongsTo(TodoDay::class, 'todo_day_id');
    }

    public function list(): BelongsTo
    {
        return $this->belongsTo(TodoList::class, 'todo_list_id');
    }
}
