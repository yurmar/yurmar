<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Note extends Model
{
    use SoftDeletes;

    protected $fillable = ['title', 'content', 'user_id', 'is_pinned'];

    protected $casts = ['is_pinned' => 'boolean'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function notebookProjects(): BelongsToMany
    {
        return $this->belongsToMany(NotebookProject::class, 'project_notes', 'note_id', 'notebook_project_id')
            ->whereNull('notebook_projects.deleted_at')
            ->select(['notebook_projects.id', 'notebook_projects.name']);
    }
}
