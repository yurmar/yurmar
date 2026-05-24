<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'title', 'stack', 'description',
        'screenshot_path', 'url', 'is_featured', 'sort_order',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
    ];
}
