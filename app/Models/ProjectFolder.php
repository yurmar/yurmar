<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectFolder extends Model
{
    protected $fillable = ['name', 'parent_id'];

    protected $casts = ['parent_id' => 'integer'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(NotebookProject::class, 'notebook_project_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function files(): HasMany
    {
        return $this->hasMany(ProjectFile::class, 'folder_id');
    }

    /** id этой папки и всех вложенных. */
    public function descendantIds(): array
    {
        $all = self::where('notebook_project_id', $this->notebook_project_id)->get(['id', 'parent_id']);
        $ids = [$this->id];
        $queue = [$this->id];

        while ($queue) {
            $current = array_shift($queue);
            foreach ($all->where('parent_id', $current) as $child) {
                $ids[] = $child->id;
                $queue[] = $child->id;
            }
        }

        return $ids;
    }
}
