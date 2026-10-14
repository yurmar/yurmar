<?php

namespace Tests\Feature;

use App\Models\NotebookProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotebookProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/notebook-projects')->assertStatus(401);
    }

    public function test_owner_can_create_with_defaults_and_list_pinned_first(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/notebook-projects', ['name' => 'Alpha'])
            ->assertStatus(201)
            ->assertJsonPath('status', 'idea')
            ->assertJsonPath('priority', 'normal')
            ->assertJsonPath('is_pinned', false);

        $this->postJson('/api/notebook-projects', ['name' => 'Beta', 'is_pinned' => true])->assertStatus(201);

        $names = collect($this->getJson('/api/notebook-projects')->assertOk()->json())->pluck('name')->all();
        $this->assertSame(['Beta', 'Alpha'], $names);
    }

    public function test_empty_name_becomes_untitled(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/notebook-projects', [])
            ->assertStatus(201)
            ->assertJsonPath('name', 'Без названия');
    }

    public function test_owner_can_update_and_delete(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'A']);
        Sanctum::actingAs($user);

        $this->putJson("/api/notebook-projects/{$project->id}", [
            'name' => 'B',
            'status' => 'active',
            'technologies' => ['Laravel', 'React'],
        ])->assertOk()->assertJsonPath('name', 'B')->assertJsonPath('technologies.1', 'React');

        $this->deleteJson("/api/notebook-projects/{$project->id}")->assertStatus(204);
        $this->assertSoftDeleted('notebook_projects', ['id' => $project->id]);
    }

    public function test_other_user_cannot_access(): void
    {
        $owner = User::factory()->create();
        $project = $owner->notebookProjects()->create(['name' => 'Secret']);
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/notebook-projects/{$project->id}")->assertStatus(403);
        $this->putJson("/api/notebook-projects/{$project->id}", ['name' => 'X'])->assertStatus(403);
        $this->deleteJson("/api/notebook-projects/{$project->id}")->assertStatus(403);
        $this->assertSame([], $this->getJson('/api/notebook-projects')->json());
    }

    public function test_user_id_from_body_is_ignored(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($user);

        $id = $this->postJson('/api/notebook-projects', ['name' => 'A', 'user_id' => $other->id])
            ->assertStatus(201)->json('id');

        $this->assertSame($user->id, NotebookProject::find($id)->user_id);
    }

    public function test_deadline_before_start_date_is_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/notebook-projects', [
            'name' => 'A', 'start_date' => '2026-10-10', 'deadline' => '2026-10-01',
        ])->assertStatus(422)->assertJsonValidationErrors('deadline');
    }

    public function test_deadline_is_checked_against_stored_start_date_on_partial_update(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'A', 'start_date' => '2026-10-10']);
        Sanctum::actingAs($user);

        $this->putJson("/api/notebook-projects/{$project->id}", ['deadline' => '2026-10-01'])
            ->assertStatus(422)->assertJsonValidationErrors('deadline');
    }

    public function test_non_http_repository_url_is_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create());

        foreach (['javascript:alert(1)', 'file:///etc/passwd', 'ftp://example.com/x'] as $url) {
            $this->postJson('/api/notebook-projects', ['name' => 'A', 'repository_url' => $url])
                ->assertStatus(422)->assertJsonValidationErrors('repository_url');
        }

        $this->postJson('/api/notebook-projects', ['name' => 'A', 'repository_url' => 'https://github.com/a/b'])
            ->assertStatus(201);
    }

    public function test_invalid_status_and_priority_are_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/notebook-projects', ['name' => 'A', 'status' => 'nope', 'priority' => 'urgent'])
            ->assertStatus(422)->assertJsonValidationErrors(['status', 'priority']);
    }
}
