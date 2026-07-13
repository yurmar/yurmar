<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TodoTask extends Model
{
    protected $fillable = ['todo_day_id', 'title', 'is_done', 'sort_order'];

    protected $casts = [
        'is_done' => 'boolean',
    ];

    public function day(): BelongsTo
    {
        return $this->belongsTo(TodoDay::class, 'todo_day_id');
    }
}
