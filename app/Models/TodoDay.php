<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TodoDay extends Model
{
    protected $fillable = ['date'];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    public function tasks(): HasMany
    {
        return $this->hasMany(TodoTask::class)->orderBy('sort_order')->orderBy('id');
    }
}
