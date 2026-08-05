<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TodoList extends Model
{
    protected $fillable = ['name'];

    public function tasks(): HasMany
    {
        return $this->hasMany(TodoTask::class)->orderBy('sort_order')->orderBy('id');
    }
}
