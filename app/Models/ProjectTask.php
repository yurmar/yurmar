<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectTask extends Model
{
    public const STATUSES = ['todo', 'in_progress', 'done', 'cancelled'];

    protected $fillable = [
        'milestone_id', 'note_id', 'title', 'description', 'status', 'priority',
        'due_date', 'sort_order', 'reference_url', 'completed_at',
    ];

    protected $attributes = ['status' => 'todo', 'priority' => 'normal', 'sort_order' => 0];

    protected $casts = [
        'due_date' => 'date:Y-m-d',
        'completed_at' => 'datetime',
        'sort_order' => 'integer',
        'milestone_id' => 'integer',
        'note_id' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(NotebookProject::class, 'notebook_project_id');
    }

    public function milestone(): BelongsTo
    {
        return $this->belongsTo(ProjectMilestone::class, 'milestone_id');
    }
}
