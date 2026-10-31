<?php

namespace App\Services;

use App\Models\NotebookProject;
use App\Models\ProjectActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/** Запись действий в журнал проекта блокнота. */
class ProjectJournal
{
    /** Поля, значения которых слишком объёмны: в журнале только факт изменения. */
    private const LONG_FIELDS = ['description'];

    public static function created(NotebookProject $project, string $entity, Model $model, ?string $title = null): void
    {
        self::write($project, 'created', $entity, $model->getKey(), $title ?? self::titleOf($model));
    }

    public static function deleted(NotebookProject $project, string $entity, Model $model, ?string $title = null): void
    {
        self::write($project, 'deleted', $entity, $model->getKey(), $title ?? self::titleOf($model));
    }

    /** Пишет изменения после $model->update(); если ничего не изменилось — не пишет. */
    public static function updated(NotebookProject $project, string $entity, Model $model, array $original, ?string $title = null): void
    {
        $before = (clone $model)->setRawAttributes($original);
        $changes = [];
        foreach ($model->getChanges() as $field => $new) {
            if ($field === 'updated_at') {
                continue;
            }

            $newValue = $model->getAttribute($field);
            $oldValue = $before->getAttribute($field);

            $entry = ['field' => $field];
            if (! in_array($field, self::LONG_FIELDS, true)) {
                $entry['from'] = self::scalar($oldValue);
                $entry['to'] = self::scalar($newValue);
            }
            $changes[] = $entry;
        }

        if ($changes === []) {
            return;
        }

        self::write($project, 'updated', $entity, $model->getKey(), $title ?? self::titleOf($model), $changes);
    }

    public static function attached(NotebookProject $project, string $entity, Model $model): void
    {
        self::write($project, 'attached', $entity, $model->getKey(), self::titleOf($model));
    }

    public static function detached(NotebookProject $project, string $entity, Model $model): void
    {
        self::write($project, 'detached', $entity, $model->getKey(), self::titleOf($model));
    }

    public static function reordered(NotebookProject $project, string $entity): void
    {
        self::write($project, 'reordered', $entity, null, null);
    }

    public static function imported(NotebookProject $project, array $totals): void
    {
        self::write($project, 'imported', 'project', $project->id, null, [['field' => 'totals', 'to' => $totals]]);
    }

    private static function write(NotebookProject $project, string $action, string $entity, mixed $entityId, ?string $title, ?array $changes = null): void
    {
        ProjectActivity::create([
            'notebook_project_id' => $project->id,
            'action' => $action,
            'entity' => $entity,
            'entity_id' => $entityId,
            'title' => $title === null ? null : Str::limit(trim($title), 250, '…'),
            'changes' => $changes,
        ]);
    }

    private static function titleOf(Model $model): ?string
    {
        foreach (['title', 'name', 'original_name'] as $attr) {
            $value = $model->getAttribute($attr);
            if (is_string($value) && trim($value) !== '') {
                return $value;
            }
        }

        return null;
    }

    private static function scalar(mixed $value): mixed
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }
        if (is_array($value)) {
            return implode(', ', array_map('strval', $value));
        }
        if (is_string($value)) {
            return Str::limit($value, 200, '…');
        }

        return $value;
    }
}
