<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectLink extends Model
{
    // 'upload' зарезервирован под будущую серверную загрузку и пока не принимается.
    public const TYPES = ['local_path', 'url'];

    public const CATEGORIES = ['code', 'design', 'docs', 'data', 'other'];

    protected $fillable = ['name', 'type', 'path', 'url', 'description', 'category', 'tags', 'sort_order'];

    protected $casts = [
        'tags' => 'array',
        'sort_order' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(NotebookProject::class, 'notebook_project_id');
    }
}
