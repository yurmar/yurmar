<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectMilestone extends Model
{
    public const STATUSES = ['todo', 'in_progress', 'done'];

    protected $fillable = ['title', 'description', 'status', 'start_date', 'deadline', 'sort_order'];

    protected $attributes = ['status' => 'todo', 'sort_order' => 0];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'deadline' => 'date:Y-m-d',
        'sort_order' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(NotebookProject::class, 'notebook_project_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class, 'milestone_id');
    }
}
