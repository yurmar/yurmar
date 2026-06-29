<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Example extends Model
{
    protected $fillable = ['folder_id', 'title', 'description', 'screenshot_path', 'url', 'tags', 'sort_order'];

    public function folder(): BelongsTo
    {
        return $this->belongsTo(ExampleFolder::class, 'folder_id');
    }
}
