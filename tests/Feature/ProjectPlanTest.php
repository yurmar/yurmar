<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectPlanTest extends TestCase
{
    use RefreshDatabase;

    private function project(User $user, string $name = 'P')
    {
        return $user->notebookProjects()->create(['name' => $name]);
    }

    public function test_task_crud_and_completed_at(): void
    {
        $user = User::factory()->create();
        $project = $this->project($user);
        Sanctum::actingAs($user);

        $id = $this->postJson("/api/notebook-projects/{$project->id}/tasks", ['title' => 'T1'])
            ->assertStatus(201)->assertJsonPath('status', 'todo')->json('id');

        $this->putJson("/api/notebook-projects/{$project->id}/tasks/{$id}", ['status' => 'done'])
            ->assertOk()->assertJsonPath('status', 'done');
        $this->assertNotNull($project->tasks()->find($id)->completed_at);

        $this->putJson("/api/notebook-projects/{$project->id}/tasks/{$id}", ['status' => 'in_progress'])->assertOk();
        $this->assertNull($project->tasks()->find($id)->completed_at);

        $this->deleteJson("/api/notebook-projects/{$project->id}/tasks/{$id}")->assertStatus(204);
        $this->assertSame(0, $project->tasks()->count());
    }

    public function test_foreign_project_tasks_are_forbidden(): void
    {
        $owner = User::factory()->create();
        $project = $this->project($owner);
        $task = $project->tasks()->create(['title' => 'T']);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/notebook-projects/{$project->id}/tasks", ['title' => 'X'])->assertStatus(403);
        $this->putJson("/api/notebook-projects/{$project->id}/tasks/{$task->id}", ['title' => 'X'])->assertStatus(403);
        $this->deleteJson("/api/notebook-projects/{$project->id}/tasks/{$task->id}")->assertStatus(403);
    }

    public function test_task_of_another_own_project_is_404(): void
    {
        $user = User::factory()->create();
        $a = $this->project($user, 'A');
        $b = $this->project($user, 'B');
        $task = $b->tasks()->create(['title' => 'T']);
        Sanctum::actingAs($user);

        $this->putJson("/api/notebook-projects/{$a->id}/tasks/{$task->id}", ['title' => 'X'])->assertStatus(404);
        $this->deleteJson("/api/notebook-projects/{$a->id}/tasks/{$task->id}")->assertStatus(404);
    }

    public function test_reorder_rejects_foreign_ids_and_applies_order(): void
    {
        $user = User::factory()->create();
        $a = $this->project($user, 'A');
        $b = $this->project($user, 'B');
        $t1 = $a->tasks()->create(['title' => '1']);
        $t2 = $a->tasks()->create(['title' => '2']);
        $foreign = $b->tasks()->create(['title' => 'F']);
        Sanctum::actingAs($user);

        $this->postJson("/api/notebook-projects/{$a->id}/tasks/reorder", ['ids' => [$t1->id, $foreign->id]])
            ->assertStatus(422);

        $this->postJson("/api/notebook-projects/{$a->id}/tasks/reorder", ['ids' => [$t2->id, $t1->id]])->assertOk();
        $this->assertSame([$t2->id, $t1->id], $a->tasks()->pluck('id')->all());
    }

    public function test_task_milestone_must_belong_to_same_project(): void
    {
        $user = User::factory()->create();
        $a = $this->project($user, 'A');
        $b = $this->project($user, 'B');
        $foreignMilestone = $b->milestones()->create(['title' => 'M']);
        $own = $a->milestones()->create(['title' => 'M']);
        Sanctum::actingAs($user);

        $this->postJson("/api/notebook-projects/{$a->id}/tasks", ['title' => 'T', 'milestone_id' => $foreignMilestone->id])
            ->assertStatus(422)->assertJsonValidationErrors('milestone_id');
        $this->postJson("/api/notebook-projects/{$a->id}/tasks", ['title' => 'T', 'milestone_id' => $own->id])
            ->assertStatus(201);
    }

    public function test_task_note_must_belong_to_user(): void
    {
        $user = User::factory()->create();
        $project = $this->project($user);
        $own = Note::create(['title' => 'n', 'user_id' => $user->id]);
        $foreign = Note::create(['title' => 'n', 'user_id' => User::factory()->create()->id]);
        Sanctum::actingAs($user);

        $this->postJson("/api/notebook-projects/{$project->id}/tasks", ['title' => 'T', 'note_id' => $foreign->id])
            ->assertStatus(422);
        $this->postJson("/api/notebook-projects/{$project->id}/tasks", ['title' => 'T', 'note_id' => $own->id])
            ->assertStatus(201);
    }

    public function test_task_reference_url_only_http(): void
    {
        $user = User::factory()->create();
        $project = $this->project($user);
        Sanctum::actingAs($user);

        $this->postJson("/api/notebook-projects/{$project->id}/tasks", ['title' => 'T', 'reference_url' => 'javascript:alert(1)'])
            ->assertStatus(422);
    }

    public function test_deleting_milestone_keeps_tasks(): void
    {
        $user = User::factory()->create();
        $project = $this->project($user);
        $milestone = $project->milestones()->create(['title' => 'M']);
        $task = $project->tasks()->create(['title' => 'T', 'milestone_id' => $milestone->id]);
        Sanctum::actingAs($user);

        $this->deleteJson("/api/notebook-projects/{$project->id}/milestones/{$milestone->id}")->assertStatus(204);

        $this->assertNull($task->fresh()->milestone_id);
        $this->assertSame(1, $project->tasks()->count());
    }

    public function test_milestone_deadline_not_before_start(): void
    {
        $user = User::factory()->create();
        $project = $this->project($user);
        Sanctum::actingAs($user);

        $this->postJson("/api/notebook-projects/{$project->id}/milestones", [
            'title' => 'M', 'start_date' => '2026-10-10', 'deadline' => '2026-10-01',
        ])->assertStatus(422)->assertJsonValidationErrors('deadline');
    }

    public function test_milestone_of_foreign_project_is_forbidden(): void
    {
        $owner = User::factory()->create();
        $project = $this->project($owner);
        $milestone = $project->milestones()->create(['title' => 'M']);
        Sanctum::actingAs(User::factory()->create());

        $this->putJson("/api/notebook-projects/{$project->id}/milestones/{$milestone->id}", ['title' => 'X'])
            ->assertStatus(403);
    }

    public function test_progress_excludes_cancelled_and_show_includes_plan(): void
    {
        $user = User::factory()->create();
        $project = $this->project($user);
        $milestone = $project->milestones()->create(['title' => 'M']);
        $project->tasks()->create(['title' => 'a', 'status' => 'done', 'milestone_id' => $milestone->id]);
        $project->tasks()->create(['title' => 'b', 'status' => 'todo', 'milestone_id' => $milestone->id]);
        $project->tasks()->create(['title' => 'c', 'status' => 'cancelled']);
        Sanctum::actingAs($user);

        $this->getJson('/api/notebook-projects')
            ->assertOk()
            ->assertJsonPath('0.tasks_count', 2)
            ->assertJsonPath('0.done_tasks_count', 1);

        $this->getJson("/api/notebook-projects/{$project->id}")
            ->assertOk()
            ->assertJsonCount(3, 'tasks')
            ->assertJsonPath('milestones.0.tasks_count', 2)
            ->assertJsonPath('milestones.0.done_tasks_count', 1);
    }
}
