<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectImportTest extends TestCase
{
    use RefreshDatabase;

    private const SAMPLE = <<<'MD'
---
name: Сайт-визитка
description: Лендинг с формой обратной связи
status: planning
priority: high
start_date: 2026-02-01
deadline: 2026-03-01
local_path: /Users/me/site
repository_url: https://github.com/user/site
technologies: [Laravel, React]
---

## Этап 1. Каркас
description: Рабочий каркас приложения
status: in_progress
start_date: 2026-02-01
deadline: 2026-02-10
- [ ] Развернуть проект | priority: high | due: 2026-02-03
- [x] Подключить БД
- [ ] Настроить сборку | status: in_progress
  Vite и Tailwind

## Этап 2. Контент
- [ ] Сверстать главную

## Без этапа
- [ ] Купить домен | priority: low

## Ссылки
- Макет: https://example.com/design
- Спецификация: /Users/me/docs/spec.md
- [Репозиторий](https://github.com/user/site)
MD;

    public function test_dry_run_returns_structure_without_creating(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/notebook-projects/import', ['markdown' => self::SAMPLE, 'dry_run' => true])
            ->assertOk()
            ->assertJsonPath('project.name', 'Сайт-визитка')
            ->assertJsonPath('project.priority', 'high')
            ->assertJsonPath('project.technologies', ['Laravel', 'React'])
            ->assertJsonPath('totals.milestones', 2)
            ->assertJsonPath('totals.tasks', 5)
            ->assertJsonPath('totals.links', 3);

        $this->assertSame([], $response->json('warnings'));
        $this->assertSame(0, $user->notebookProjects()->count());
    }

    public function test_import_creates_everything_with_fields(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $id = $this->postJson('/api/notebook-projects/import', ['markdown' => self::SAMPLE])
            ->assertStatus(201)->json('project.id');

        $project = $user->notebookProjects()->findOrFail($id);
        $this->assertSame('planning', $project->status);
        $this->assertSame('/Users/me/site', $project->local_path);
        $this->assertSame('2026-03-01', $project->deadline->toDateString());

        $milestones = $project->milestones()->get();
        $this->assertSame(['Этап 1. Каркас', 'Этап 2. Контент'], $milestones->pluck('title')->all());
        $this->assertSame('in_progress', $milestones[0]->status);
        $this->assertSame('Рабочий каркас приложения', $milestones[0]->description);
        $this->assertSame('2026-02-10', $milestones[0]->deadline->toDateString());

        $tasks = $project->tasks()->get();
        $this->assertCount(5, $tasks);
        $this->assertSame('high', $tasks[0]->priority);
        $this->assertSame('2026-02-03', $tasks[0]->due_date->toDateString());
        $this->assertSame('done', $tasks[1]->status);
        $this->assertNotNull($tasks[1]->completed_at);
        $this->assertSame('in_progress', $tasks[2]->status);
        $this->assertSame('Vite и Tailwind', $tasks[2]->description);
        $this->assertNull($tasks[4]->milestone_id);
        $this->assertSame('low', $tasks[4]->priority);

        $links = $project->links()->get();
        $this->assertSame(['url', 'local_path', 'url'], $links->pluck('type')->all());
        $this->assertSame('https://github.com/user/site', $links[2]->url);
    }

    public function test_russian_values_and_dotted_dates_are_understood(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $md = "---\nname: Проект\nстатус: в работе\nприоритет: высокий\nначало: 01.02.2026\n---\n\n## Этап\n- [ ] Задача | статус: готово | срок: 15.02.2026\n";

        $this->postJson('/api/notebook-projects/import', ['markdown' => $md, 'dry_run' => true])
            ->assertOk()
            ->assertJsonPath('project.status', 'active')
            ->assertJsonPath('project.priority', 'high')
            ->assertJsonPath('project.start_date', '2026-02-01')
            ->assertJsonPath('milestones.0.tasks.0.status', 'done')
            ->assertJsonPath('milestones.0.tasks.0.due_date', '2026-02-15');
    }

    public function test_bad_values_become_warnings_not_errors(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $md = "---\nname: P\nstatus: wat\nrepository_url: javascript:alert(1)\ndeadline: 31.02.2026\n---\n\n## Этап\n"
            ."- [ ] Задача | priority: urgent | due: вчера\n\n## Ссылки\n- Плохая: javascript:alert(1)\n- Файл: file:///etc/passwd\n";

        $response = $this->postJson('/api/notebook-projects/import', ['markdown' => $md])->assertStatus(201);

        $this->assertNotEmpty($response->json('warnings'));
        $project = $user->notebookProjects()->first();
        $this->assertSame('planning', $project->status);
        $this->assertNull($project->repository_url);
        $this->assertNull($project->deadline);
        $this->assertSame('normal', $project->tasks()->first()->priority);
        $this->assertNull($project->tasks()->first()->due_date);
        $this->assertSame(0, $project->links()->count());
    }

    public function test_file_upload_and_validation(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $file = UploadedFile::fake()->createWithContent('plan.md', "---\nname: Из файла\n---\n\n## Этап\n- [ ] Раз\n");
        $this->post('/api/notebook-projects/import', ['file' => $file, 'dry_run' => '1'], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('project.name', 'Из файла');

        $this->postJson('/api/notebook-projects/import', ['markdown' => 'просто текст без этапов'])
            ->assertStatus(422)->assertJsonValidationErrors('markdown');
        $this->postJson('/api/notebook-projects/import', [])->assertStatus(422);
    }

    public function test_title_from_h1_and_guest_blocked(): void
    {
        $this->postJson('/api/notebook-projects/import', ['markdown' => '# X'])->assertStatus(401);

        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/notebook-projects/import', ['markdown' => "# Из заголовка\n\n## Этап\n- Просто пункт\n", 'dry_run' => true])
            ->assertOk()->assertJsonPath('project.name', 'Из заголовка')
            ->assertJsonPath('milestones.0.tasks.0.title', 'Просто пункт');
    }

    public function test_limits(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $md = "---\nname: Много\n---\n\n## Этап\n".str_repeat("- [ ] Задача\n", 1100);

        $this->postJson('/api/notebook-projects/import', ['markdown' => $md, 'dry_run' => true])
            ->assertOk()->assertJsonPath('totals.tasks', 1000);
    }

    public function test_the_example_from_the_doc_parses(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $doc = file_get_contents(base_path('docs/notebook-project-plan-import.md'));
        preg_match('/## Пример\s+```markdown\n(.*?)\n```/s', $doc, $m);
        $this->assertNotEmpty($m[1] ?? null, 'Пример не найден в документе');

        $this->postJson('/api/notebook-projects/import', ['markdown' => $m[1], 'dry_run' => true])
            ->assertOk()
            ->assertJsonPath('project.name', 'Сайт-визитка')
            ->assertJsonPath('totals.milestones', 2)
            ->assertJsonPath('totals.tasks', 4)
            ->assertJsonPath('totals.links', 1);
    }
}
