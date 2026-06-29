<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExampleFolder extends Model
{
    protected $fillable = ['name', 'description', 'icon', 'color', 'sort_order'];

    public function examples(): HasMany
    {
        return $this->hasMany(Example::class, 'folder_id')->orderBy('sort_order');
    }
}
