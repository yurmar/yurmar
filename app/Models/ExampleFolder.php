<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExampleFolder extends Model
{
    protected $fillable = ['name', 'description', 'icon', 'color', 'screenshot_path', 'url', 'is_active', 'sort_order'];

    protected $casts = ['is_active' => 'boolean'];

    public function examples(): HasMany
    {
        return $this->hasMany(Example::class, 'folder_id')->orderBy('sort_order');
    }
}
