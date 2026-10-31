<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectJournalTest extends TestCase
{
    use RefreshDatabase;

    public function test_actions_are_recorded_in_journal(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $id = $this->postJson('/api/notebook-projects', ['name' => 'P'])->json('id');
        $this->putJson("/api/notebook-projects/{$id}", ['status' => 'active', 'name' => 'P'])->assertOk();
        // Повторное сохранение без изменений в журнал не попадает.
        $this->putJson("/api/notebook-projects/{$id}", ['status' => 'active'])->assertOk();

        $task = $this->postJson("/api/notebook-projects/{$id}/tasks", ['title' => 'T'])->json('id');
        $this->putJson("/api/notebook-projects/{$id}/tasks/{$task}", ['status' => 'done'])->assertOk();
        $this->deleteJson("/api/notebook-projects/{$id}/tasks/{$task}")->assertNoContent();

        $rows = $this->getJson("/api/notebook-projects/{$id}/journal")->assertOk()->json('data');

        $this->assertSame(
            ['deleted:task', 'updated:task', 'created:task', 'updated:project', 'created:project'],
            array_map(fn ($r) => $r['action'].':'.$r['entity'], $rows),
        );
        $this->assertSame('status', $rows[1]['changes'][0]['field']);
        $this->assertSame('done', $rows[1]['changes'][0]['to']);
        $this->assertSame('idea', $rows[3]['changes'][0]['from']);
    }

    public function test_journal_is_private(): void
    {
        $owner = User::factory()->create();
        $project = $owner->notebookProjects()->create(['name' => 'P']);
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/notebook-projects/{$project->id}/journal")->assertForbidden();
    }
}
