<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectFileTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_local_path_and_url(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'P']);
        Sanctum::actingAs($user);

        $this->postJson("/api/notebook-projects/{$project->id}/files", [
            'name' => 'Src', 'type' => 'local_path', 'path' => '/Users/me/src', 'category' => 'code', 'tags' => ['php'],
        ])->assertStatus(201)->assertJsonPath('path', '/Users/me/src')->assertJsonPath('url', null);

        $this->postJson("/api/notebook-projects/{$project->id}/files", [
            'name' => 'Docs', 'type' => 'url', 'url' => 'https://example.com/docs',
        ])->assertStatus(201)->assertJsonPath('url', 'https://example.com/docs');

        $this->getJson("/api/notebook-projects/{$project->id}")
            ->assertOk()->assertJsonCount(2, 'files')->assertJsonPath('files_count', 2);
    }

    public function test_dangerous_urls_and_upload_type_are_rejected(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'P']);
        Sanctum::actingAs($user);

        foreach (['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html;base64,AAAA'] as $url) {
            $this->postJson("/api/notebook-projects/{$project->id}/files", ['name' => 'x', 'type' => 'url', 'url' => $url])
                ->assertStatus(422);
        }

        $this->postJson("/api/notebook-projects/{$project->id}/files", ['name' => 'x', 'type' => 'upload', 'path' => 'a'])
            ->assertStatus(422)->assertJsonValidationErrors('type');
    }

    public function test_path_required_for_local_and_url_for_link(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'P']);
        Sanctum::actingAs($user);

        $this->postJson("/api/notebook-projects/{$project->id}/files", ['name' => 'x', 'type' => 'local_path'])
            ->assertStatus(422)->assertJsonValidationErrors('path');
        $this->postJson("/api/notebook-projects/{$project->id}/files", ['name' => 'x', 'type' => 'url'])
            ->assertStatus(422)->assertJsonValidationErrors('url');
    }

    public function test_partial_update_and_type_switch(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'P']);
        $file = $project->files()->create(['name' => 'A', 'type' => 'local_path', 'path' => '/a']);
        Sanctum::actingAs($user);

        $this->putJson("/api/notebook-projects/{$project->id}/files/{$file->id}", ['name' => 'B'])
            ->assertOk()->assertJsonPath('name', 'B')->assertJsonPath('path', '/a');

        $this->putJson("/api/notebook-projects/{$project->id}/files/{$file->id}", ['type' => 'url', 'url' => 'https://x.dev'])
            ->assertOk()->assertJsonPath('type', 'url')->assertJsonPath('path', null);
    }

    public function test_foreign_access_is_blocked(): void
    {
        $owner = User::factory()->create();
        $project = $owner->notebookProjects()->create(['name' => 'P']);
        $other = $owner->notebookProjects()->create(['name' => 'Q']);
        $file = $other->files()->create(['name' => 'A', 'type' => 'local_path', 'path' => '/a']);

        Sanctum::actingAs($owner);
        $this->putJson("/api/notebook-projects/{$project->id}/files/{$file->id}", ['name' => 'X'])->assertStatus(404);

        Sanctum::actingAs(User::factory()->create());
        $this->postJson("/api/notebook-projects/{$project->id}/files", ['name' => 'x', 'type' => 'local_path', 'path' => '/a'])
            ->assertStatus(403);
        $this->deleteJson("/api/notebook-projects/{$other->id}/files/{$file->id}")->assertStatus(403);
    }

    public function test_delete(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'P']);
        $file = $project->files()->create(['name' => 'A', 'type' => 'local_path', 'path' => '/a']);
        Sanctum::actingAs($user);

        $this->deleteJson("/api/notebook-projects/{$project->id}/files/{$file->id}")->assertStatus(204);
        $this->assertSame(0, $project->files()->count());
    }
}
