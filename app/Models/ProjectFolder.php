<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectFolder extends Model
{
    /** Системные папки хранилища: ключ => название (порядок отображения). */
    public const SYSTEM = [
        'images' => 'Изображения',
        'video' => 'Видео',
        'docs' => 'Документы',
        'audio' => 'Музыка',
        'archives' => 'Архивы',
        'other' => 'Прочее',
    ];

    protected $fillable = ['name', 'parent_id', 'system_key'];

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

    /**
     * Создаёт недостающие системные папки проекта и раскладывает по ним файлы,
     * которые лежат вне папок. Возвращает [system_key => folder id].
     */
    public static function ensureSystem(NotebookProject $project): array
    {
        $existing = self::where('notebook_project_id', $project->id)
            ->whereNotNull('system_key')
            ->pluck('id', 'system_key')
            ->all();

        foreach (self::SYSTEM as $key => $name) {
            if (! isset($existing[$key])) {
                $existing[$key] = $project->folders()->forceCreate([
                    'notebook_project_id' => $project->id,
                    'name' => $name,
                    'system_key' => $key,
                    'parent_id' => null,
                ])->id;
            }
        }

        ProjectFile::where('notebook_project_id', $project->id)
            ->whereNull('folder_id')
            ->get()
            ->each(function (ProjectFile $file) use ($existing) {
                $file->folder_id = $existing[ProjectFile::kindFor($file->mime_type, $file->name)];
                $file->save();
            });

        return $existing;
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
