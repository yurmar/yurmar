<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class NotebookProject extends Model
{
    use SoftDeletes;

    public const STATUSES = ['idea', 'planning', 'active', 'paused', 'completed', 'archived'];

    public const PRIORITIES = ['low', 'normal', 'high'];

    public const UNTITLED = 'Без названия';

    protected $fillable = [
        'name',
        'description',
        'status',
        'priority',
        'local_path',
        'repository_url',
        'technologies',
        'start_date',
        'deadline',
        'is_pinned',
    ];

    protected $attributes = [
        'status' => 'idea',
        'priority' => 'normal',
        'is_pinned' => false,
    ];

    protected $casts = [
        'technologies' => 'array',
        'is_pinned' => 'boolean',
        'start_date' => 'date:Y-m-d',
        'deadline' => 'date:Y-m-d',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(ProjectMilestone::class)->orderBy('sort_order')->orderBy('id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class)->orderBy('sort_order')->orderBy('id');
    }

    public function links(): HasMany
    {
        return $this->hasMany(ProjectLink::class)->orderBy('sort_order')->orderBy('id');
    }

    public function files(): HasMany
    {
        return $this->hasMany(ProjectFile::class)->orderBy('id');
    }
}
