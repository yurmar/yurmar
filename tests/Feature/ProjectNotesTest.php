<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectNotesTest extends TestCase
{
    use RefreshDatabase;

    private function note(User $user, string $title = 'N'): Note
    {
        return Note::create(['title' => $title, 'user_id' => $user->id]);
    }

    public function test_attach_is_idempotent_and_lists_notes(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'P']);
        $note = $this->note($user, 'Идея');
        Sanctum::actingAs($user);

        $this->postJson("/api/notebook-projects/{$project->id}/notes/{$note->id}")->assertStatus(201);
        $this->postJson("/api/notebook-projects/{$project->id}/notes/{$note->id}")->assertStatus(201);

        $this->getJson("/api/notebook-projects/{$project->id}/notes")
            ->assertOk()->assertJsonCount(1)->assertJsonPath('0.title', 'Идея');
        $this->getJson("/api/notebook-projects/{$project->id}")
            ->assertOk()->assertJsonPath('notes_count', 1)->assertJsonCount(1, 'notes');
        $this->getJson('/api/notebook-projects')->assertOk()->assertJsonPath('0.notes_count', 1);
    }

    public function test_detach_keeps_the_note(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'P']);
        $note = $this->note($user);
        $project->notes()->attach($note->id, ['created_at' => now()]);
        Sanctum::actingAs($user);

        $this->deleteJson("/api/notebook-projects/{$project->id}/notes/{$note->id}")->assertStatus(204);

        $this->assertSame(0, $project->notes()->count());
        $this->assertNotNull(Note::find($note->id));
    }

    public function test_foreign_note_cannot_be_attached(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'P']);
        $foreign = $this->note(User::factory()->create());
        Sanctum::actingAs($user);

        $this->postJson("/api/notebook-projects/{$project->id}/notes/{$foreign->id}")->assertStatus(403);
        $this->assertSame(0, $project->notes()->count());
    }

    public function test_foreign_project_is_forbidden(): void
    {
        $owner = User::factory()->create();
        $project = $owner->notebookProjects()->create(['name' => 'P']);
        $note = $this->note($owner);
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/notebook-projects/{$project->id}/notes")->assertStatus(403);
        $this->postJson("/api/notebook-projects/{$project->id}/notes/{$note->id}")->assertStatus(403);
    }

    public function test_trashed_note_disappears_from_project_and_counts(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'P']);
        $note = $this->note($user);
        $project->notes()->attach($note->id, ['created_at' => now()]);
        Sanctum::actingAs($user);

        $note->delete();

        $this->getJson("/api/notebook-projects/{$project->id}/notes")->assertOk()->assertJsonCount(0);
        $this->getJson('/api/notebook-projects')->assertOk()->assertJsonPath('0.notes_count', 0);
    }

    public function test_projects_for_note(): void
    {
        $user = User::factory()->create();
        $a = $user->notebookProjects()->create(['name' => 'Alpha']);
        $user->notebookProjects()->create(['name' => 'Beta']);
        $note = $this->note($user);
        $a->notes()->attach($note->id, ['created_at' => now()]);
        Sanctum::actingAs($user);

        $this->getJson("/api/notes/{$note->id}/projects")
            ->assertOk()->assertJsonCount(1)->assertJsonPath('0.name', 'Alpha');

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/notes/{$note->id}/projects")->assertStatus(403);
    }
}
