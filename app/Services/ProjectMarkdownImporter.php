<?php

namespace App\Services;

use App\Models\NotebookProject;
use App\Models\ProjectMilestone;
use App\Models\ProjectTask;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Разбор Markdown-плана проекта (формат — docs/notebook-project-plan-import.md)
 * и создание проекта с этапами, задачами и ссылками.
 */
class ProjectMarkdownImporter
{
    public const MAX_MILESTONES = 50;

    public const MAX_TASKS = 1000;

    public const MAX_LINKS = 100;

    private const KEY_ALIASES = [
        'name' => 'name', 'название' => 'name', 'title' => 'name',
        'description' => 'description', 'описание' => 'description',
        'status' => 'status', 'статус' => 'status',
        'priority' => 'priority', 'приоритет' => 'priority',
        'start_date' => 'start_date', 'start' => 'start_date', 'начало' => 'start_date', 'дата_начала' => 'start_date',
        'deadline' => 'deadline', 'дедлайн' => 'deadline',
        'due' => 'due', 'due_date' => 'due', 'срок' => 'due',
        'local_path' => 'local_path', 'путь' => 'local_path',
        'repository_url' => 'repository_url', 'repository' => 'repository_url', 'репозиторий' => 'repository_url',
        'technologies' => 'technologies', 'технологии' => 'technologies',
    ];

    private const PROJECT_STATUS = [
        'idea' => 'idea', 'идея' => 'idea',
        'planning' => 'planning', 'планирование' => 'planning',
        'active' => 'active', 'в работе' => 'active',
        'paused' => 'paused', 'приостановлен' => 'paused',
        'completed' => 'completed', 'завершён' => 'completed', 'завершен' => 'completed',
        'archived' => 'archived', 'архив' => 'archived',
    ];

    private const TASK_STATUS = [
        'todo' => 'todo', 'к выполнению' => 'todo',
        'in_progress' => 'in_progress', 'в работе' => 'in_progress',
        'done' => 'done', 'готово' => 'done',
        'cancelled' => 'cancelled', 'canceled' => 'cancelled', 'отменена' => 'cancelled',
    ];

    private const MILESTONE_STATUS = [
        'todo' => 'todo', 'не начат' => 'todo',
        'in_progress' => 'in_progress', 'в работе' => 'in_progress',
        'done' => 'done', 'завершён' => 'done', 'завершен' => 'done', 'готово' => 'done',
    ];

    private const PRIORITY = [
        'low' => 'low', 'низкий' => 'low',
        'normal' => 'normal', 'обычный' => 'normal',
        'high' => 'high', 'высокий' => 'high',
    ];

    /** @var string[] */
    private array $warnings = [];

    /**
     * @return array{project: array, milestones: array, unassigned: array, links: array, warnings: string[], totals: array}
     */
    public function parse(string $markdown): array
    {
        $this->warnings = [];

        $text = str_replace(["\r\n", "\r"], "\n", $markdown);
        $text = preg_replace('/^\xEF\xBB\xBF/', '', $text) ?? $text;
        $lines = explode("\n", $text);

        $project = [];
        $i = 0;
        $count = count($lines);

        while ($i < $count && trim($lines[$i]) === '') {
            $i++;
        }

        // Блок свойств проекта между строками ---
        if ($i < $count && trim($lines[$i]) === '---') {
            $i++;
            while ($i < $count && trim($lines[$i]) !== '---') {
                $this->readProperty($lines[$i], $project);
                $i++;
            }
            $i++;
        }

        $milestones = [];
        $unassigned = [];
        $links = [];
        $current = null; // ссылка на текущий этап (по индексу)
        $section = 'start'; // start | milestone | unassigned | links
        $lastTask = null; // [контейнер, индекс] — куда дописывать описание
        $taskTotal = 0;

        for (; $i < $count; $i++) {
            $line = rtrim($lines[$i]);
            $trim = trim($line);

            if ($trim === '') {
                continue;
            }

            // # Заголовок первого уровня — имя проекта, если его нет в свойствах.
            if (preg_match('/^#\s+(.+)$/u', $trim, $m)) {
                if (empty($project['name'])) {
                    $project['name'] = trim($m[1]);
                }

                continue;
            }

            if (preg_match('/^##\s+(.+)$/u', $trim, $m)) {
                $title = trim($m[1]);
                $lastTask = null;
                $lower = mb_strtolower($title);

                if ($lower === 'ссылки' || $lower === 'links') {
                    $section = 'links';
                } elseif ($lower === 'без этапа') {
                    $section = 'unassigned';
                } else {
                    if (count($milestones) >= self::MAX_MILESTONES) {
                        $this->warn('Слишком много этапов: лишние пропущены (максимум '.self::MAX_MILESTONES.').');
                        $section = 'skip';

                        continue;
                    }
                    $title = preg_replace('/^этап\s*:\s*/iu', '', $title) ?? $title;
                    $milestones[] = [
                        'title' => Str::limit($title, 255, ''),
                        'description' => null, 'status' => 'todo',
                        'start_date' => null, 'deadline' => null, 'tasks' => [],
                    ];
                    $current = count($milestones) - 1;
                    $section = 'milestone';
                }

                continue;
            }

            if ($section === 'skip') {
                continue;
            }

            if ($section === 'links') {
                if (preg_match('/^[-*]\s+(.+)$/u', $trim, $m)) {
                    $this->readLink($m[1], $links);
                }

                continue;
            }

            // Элемент списка: чекбокс или обычный пункт — задача.
            if (preg_match('/^(\s*)[-*]\s+(?:\[( |x|X)\]\s+)?(.+)$/u', $line, $m) && $section !== 'start') {
                if ($taskTotal >= self::MAX_TASKS) {
                    $this->warn('Слишком много задач: лишние пропущены (максимум '.self::MAX_TASKS.').');

                    continue;
                }
                $task = $this->readTask($m[3], strtolower($m[2]) === 'x');
                $taskTotal++;
                if ($section === 'milestone') {
                    $milestones[$current]['tasks'][] = $task;
                    $lastTask = ['m', $current, count($milestones[$current]['tasks']) - 1];
                } else {
                    $unassigned[] = $task;
                    $lastTask = ['u', null, count($unassigned) - 1];
                }

                continue;
            }

            // Продолжение: с отступом — описание задачи; до списка — свойства/описание этапа.
            $indented = (bool) preg_match('/^\s{2,}\S/u', $line);

            if ($indented && $lastTask !== null) {
                $this->appendTaskDescription($milestones, $unassigned, $lastTask, $trim);

                continue;
            }

            if ($section === 'milestone' && $current !== null) {
                $props = [];
                if ($this->readProperty($trim, $props)) {
                    $this->applyMilestoneProps($milestones[$current], $props);
                } else {
                    $milestones[$current]['description'] = trim(($milestones[$current]['description'] ?? '').' '.$trim);
                }
            }
        }

        $project = $this->normalizeProject($project);

        foreach ($milestones as &$m) {
            unset($m['_x']);
        }
        unset($m);

        return [
            'project' => $project,
            'milestones' => $milestones,
            'unassigned' => $unassigned,
            'links' => array_slice($links, 0, self::MAX_LINKS),
            'warnings' => $this->warnings,
            'totals' => [
                'milestones' => count($milestones),
                'tasks' => $taskTotal,
                'links' => min(count($links), self::MAX_LINKS),
            ],
        ];
    }

    public function import(User $user, array $parsed): NotebookProject
    {
        return DB::transaction(function () use ($user, $parsed) {
            $project = $user->notebookProjects()->create($parsed['project']);

            $order = 0;
            foreach ($parsed['milestones'] as $index => $data) {
                $tasks = $data['tasks'];
                unset($data['tasks']);

                $milestone = $project->milestones()->create($data + ['sort_order' => $index]);

                foreach ($tasks as $task) {
                    $this->createTask($project, $milestone, $task, $order++);
                }
            }

            foreach ($parsed['unassigned'] as $task) {
                $this->createTask($project, null, $task, $order++);
            }

            foreach ($parsed['links'] as $index => $link) {
                $project->links()->create($link + ['sort_order' => $index]);
            }

            return $project->fresh();
        });
    }

    private function createTask(NotebookProject $project, ?ProjectMilestone $milestone, array $task, int $order): ProjectTask
    {
        return $project->tasks()->create($task + [
            'milestone_id' => $milestone?->id,
            'sort_order' => $order,
            'completed_at' => $task['status'] === 'done' ? now() : null,
        ]);
    }

    private function warn(string $message): void
    {
        if (count($this->warnings) < 50 && ! in_array($message, $this->warnings, true)) {
            $this->warnings[] = $message;
        }
    }

    /** Читает строку «ключ: значение» в $props. Возвращает false, если это не свойство. */
    private function readProperty(string $line, array &$props): bool
    {
        if (! preg_match('/^\s*([\p{L}_ ]{2,30}?)\s*:\s*(.*)$/u', $line, $m)) {
            return false;
        }

        $key = self::KEY_ALIASES[mb_strtolower(trim($m[1]))] ?? null;
        if ($key === null) {
            return false;
        }

        $props[$key] = trim($m[2]);

        return true;
    }

    private function readTask(string $raw, bool $checked): array
    {
        $parts = array_map('trim', explode(' | ', $raw));
        $title = array_shift($parts);

        $task = [
            'title' => Str::limit($title === '' ? 'Без названия' : $title, 255, ''),
            'description' => null,
            'status' => $checked ? 'done' : 'todo',
            'priority' => 'normal',
            'due_date' => null,
        ];

        foreach ($parts as $part) {
            $props = [];
            if (! $this->readProperty($part, $props)) {
                $this->warn("Не распознано свойство задачи «{$title}»: {$part}");

                continue;
            }
            foreach ($props as $key => $value) {
                match ($key) {
                    'status' => $task['status'] = $this->enum($value, self::TASK_STATUS, 'todo', 'статус задачи', $title),
                    'priority' => $task['priority'] = $this->enum($value, self::PRIORITY, 'normal', 'приоритет задачи', $title),
                    'due', 'deadline' => $task['due_date'] = $this->date($value, "срок задачи «{$title}»"),
                    default => null,
                };
            }
        }

        return $task;
    }

    private function appendTaskDescription(array &$milestones, array &$unassigned, array $ref, string $line): void
    {
        [$where, $m, $t] = $ref;

        if ($where === 'm') {
            $task = &$milestones[$m]['tasks'][$t];
        } else {
            $task = &$unassigned[$t];
        }

        $task['description'] = Str::limit(trim(($task['description'] ?? '')."\n".$line), 5000, '');
    }

    private function applyMilestoneProps(array &$milestone, array $props): void
    {
        foreach ($props as $key => $value) {
            match ($key) {
                'description' => $milestone['description'] = Str::limit($value, 5000, ''),
                'status' => $milestone['status'] = $this->enum($value, self::MILESTONE_STATUS, 'todo', 'статус этапа', $milestone['title']),
                'start_date' => $milestone['start_date'] = $this->date($value, "начало этапа «{$milestone['title']}»"),
                'deadline', 'due' => $milestone['deadline'] = $this->date($value, "дедлайн этапа «{$milestone['title']}»"),
                default => null,
            };
        }

        if ($milestone['start_date'] && $milestone['deadline'] && $milestone['deadline'] < $milestone['start_date']) {
            $this->warn("Дедлайн этапа «{$milestone['title']}» раньше начала — дедлайн отброшен.");
            $milestone['deadline'] = null;
        }
    }

    private function readLink(string $raw, array &$links): void
    {
        $name = null;
        $target = null;

        if (preg_match('/^\[([^\]]+)\]\(([^)]+)\)/u', $raw, $m)) {
            [$name, $target] = [trim($m[1]), trim($m[2])];
        } elseif (preg_match('/^(.+?)\s*:\s+(\S.*)$/u', $raw, $m)) {
            [$name, $target] = [trim($m[1]), trim($m[2])];
        } else {
            $target = trim($raw);
            $name = Str::limit($target, 80, '');
        }

        if (preg_match('~^https?://~i', $target)) {
            if (! filter_var($target, FILTER_VALIDATE_URL)) {
                $this->warn("Некорректная ссылка пропущена: {$target}");

                return;
            }
            $links[] = ['name' => Str::limit($name, 255, ''), 'type' => 'url', 'url' => Str::limit($target, 2048, ''), 'path' => null];

            return;
        }

        if (preg_match('~^[a-z][a-z0-9+.-]*:~i', $target) && ! preg_match('~^[a-z]:[\\\\/]~i', $target)) {
            $this->warn("Ссылка с недопустимой схемой пропущена: {$target}");

            return;
        }

        $links[] = ['name' => Str::limit($name, 255, ''), 'type' => 'local_path', 'url' => null, 'path' => Str::limit($target, 1024, '')];
    }

    private function normalizeProject(array $raw): array
    {
        $name = trim((string) ($raw['name'] ?? ''));
        if ($name === '') {
            $name = 'Импортированный проект';
            $this->warn('В файле нет названия проекта (name) — подставлено «Импортированный проект».');
        }

        $project = [
            'name' => Str::limit($name, 255, ''),
            'description' => isset($raw['description']) && $raw['description'] !== ''
                ? Str::limit($raw['description'], 20000, '') : null,
            'status' => $this->enum($raw['status'] ?? 'planning', self::PROJECT_STATUS, 'planning', 'статус проекта', $name),
            'priority' => $this->enum($raw['priority'] ?? 'normal', self::PRIORITY, 'normal', 'приоритет проекта', $name),
            'start_date' => isset($raw['start_date']) ? $this->date($raw['start_date'], 'start_date проекта') : null,
            'deadline' => isset($raw['deadline']) ? $this->date($raw['deadline'], 'deadline проекта') : null,
            'local_path' => isset($raw['local_path']) && $raw['local_path'] !== ''
                ? Str::limit($raw['local_path'], 1024, '') : null,
            'repository_url' => null,
            'technologies' => null,
        ];

        if ($project['start_date'] && $project['deadline'] && $project['deadline'] < $project['start_date']) {
            $this->warn('Дедлайн проекта раньше даты начала — дедлайн отброшен.');
            $project['deadline'] = null;
        }

        if (! empty($raw['repository_url'])) {
            $url = $raw['repository_url'];
            if (preg_match('~^https?://~i', $url) && filter_var($url, FILTER_VALIDATE_URL)) {
                $project['repository_url'] = Str::limit($url, 2048, '');
            } else {
                $this->warn("repository_url пропущен: допустимы только http/https ({$url}).");
            }
        }

        if (! empty($raw['technologies'])) {
            $list = trim($raw['technologies'], " \t[]");
            $items = array_values(array_unique(array_filter(array_map(
                fn ($t) => Str::limit(trim($t, " \t\"'"), 50, ''),
                explode(',', $list)
            ))));
            $project['technologies'] = $items ? array_slice($items, 0, 30) : null;
        }

        return $project;
    }

    private function enum(?string $value, array $map, string $default, string $label, string $context): string
    {
        $key = mb_strtolower(trim((string) $value));
        if (isset($map[$key])) {
            return $map[$key];
        }
        $this->warn("Неизвестное значение «{$value}» ({$label}: {$context}) — использовано «{$default}».");

        return $default;
    }

    private function date(string $value, string $label): ?string
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        $y = $m = $d = null;
        if (preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})$/', $value, $p)) {
            [, $y, $m, $d] = $p;
        } elseif (preg_match('/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/', $value, $p)) {
            [, $d, $m, $y] = $p;
        }

        if ($y !== null && checkdate((int) $m, (int) $d, (int) $y)) {
            return sprintf('%04d-%02d-%02d', $y, $m, $d);
        }

        $this->warn("Некорректная дата «{$value}» ({$label}) — пропущена.");

        return null;
    }
}
