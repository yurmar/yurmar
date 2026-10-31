<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectActivity extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'notebook_project_id',
        'action',
        'entity',
        'entity_id',
        'title',
        'changes',
    ];

    protected $casts = [
        'changes' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(NotebookProject::class, 'notebook_project_id');
    }
}
