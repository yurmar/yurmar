<?php

namespace Tests\Feature;

use App\Models\ProjectFile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectFolderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(ProjectFile::DISK);
    }

    public function test_create_nested_folders_and_list_in_show(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'P']);
        Sanctum::actingAs($user);

        $rootId = $this->postJson("/api/notebook-projects/{$project->id}/folders", ['name' => 'Docs'])
            ->assertStatus(201)->assertJsonPath('parent_id', null)->json('id');
        $this->postJson("/api/notebook-projects/{$project->id}/folders", ['name' => 'Specs', 'parent_id' => $rootId])
            ->assertStatus(201)->assertJsonPath('parent_id', $rootId);

        $this->getJson("/api/notebook-projects/{$project->id}")->assertOk()->assertJsonCount(2, 'folders');
    }

    public function test_parent_must_belong_to_same_project(): void
    {
        $user = User::factory()->create();
        $a = $user->notebookProjects()->create(['name' => 'A']);
        $b = $user->notebookProjects()->create(['name' => 'B']);
        $foreign = $b->folders()->create(['name' => 'F']);
        Sanctum::actingAs($user);

        $this->postJson("/api/notebook-projects/{$a->id}/folders", ['name' => 'X', 'parent_id' => $foreign->id])
            ->assertStatus(422)->assertJsonValidationErrors('parent_id');
    }

    public function test_folder_cannot_move_into_itself_or_descendant(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'P']);
        $root = $project->folders()->create(['name' => 'R']);
        $child = $project->folders()->create(['name' => 'C', 'parent_id' => $root->id]);
        Sanctum::actingAs($user);

        $this->putJson("/api/notebook-projects/{$project->id}/folders/{$root->id}", ['parent_id' => $child->id])
            ->assertStatus(422);
        $this->putJson("/api/notebook-projects/{$project->id}/folders/{$root->id}", ['parent_id' => $root->id])
            ->assertStatus(422);
    }

    public function test_upload_into_folder_and_move_file(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'P']);
        $one = $project->folders()->create(['name' => 'One']);
        $two = $project->folders()->create(['name' => 'Two']);
        Sanctum::actingAs($user);

        $id = $this->postJson("/api/notebook-projects/{$project->id}/files", [
            'file' => UploadedFile::fake()->create('a.txt', 1),
            'folder_id' => $one->id,
        ])->assertStatus(201)->assertJsonPath('folder_id', $one->id)->json('id');

        $this->putJson("/api/notebook-projects/{$project->id}/files/{$id}", ['folder_id' => $two->id])
            ->assertOk()->assertJsonPath('folder_id', $two->id);
        $this->putJson("/api/notebook-projects/{$project->id}/files/{$id}", ['folder_id' => null])
            ->assertOk()->assertJsonPath('folder_id', null);
    }

    public function test_delete_folder_removes_nested_files_from_disk(): void
    {
        $user = User::factory()->create();
        $project = $user->notebookProjects()->create(['name' => 'P']);
        $root = $project->folders()->create(['name' => 'R']);
        $child = $project->folders()->create(['name' => 'C', 'parent_id' => $root->id]);
        Sanctum::actingAs($user);

        $upload = fn ($folder, $name) => $this->postJson("/api/notebook-projects/{$project->id}/files", [
            'file' => UploadedFile::fake()->create($name, 1), 'folder_id' => $folder->id,
        ])->assertStatus(201)->json('id');
        $a = ProjectFile::find($upload($root, 'a.txt'))->path;
        $b = ProjectFile::find($upload($child, 'b.txt'))->path;
        $keepId = $this->postJson("/api/notebook-projects/{$project->id}/files", [
            'file' => UploadedFile::fake()->create('keep.txt', 1),
        ])->json('id');

        $this->deleteJson("/api/notebook-projects/{$project->id}/folders/{$root->id}")->assertStatus(204);

        Storage::disk(ProjectFile::DISK)->assertMissing($a);
        Storage::disk(ProjectFile::DISK)->assertMissing($b);
        $this->assertSame(0, $project->folders()->count());
        $this->assertSame([$keepId], $project->files()->pluck('id')->all());
    }

    public function test_foreign_user_is_blocked(): void
    {
        $owner = User::factory()->create();
        $project = $owner->notebookProjects()->create(['name' => 'P']);
        $folder = $project->folders()->create(['name' => 'R']);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/notebook-projects/{$project->id}/folders", ['name' => 'X'])->assertStatus(403);
        $this->putJson("/api/notebook-projects/{$project->id}/folders/{$folder->id}", ['name' => 'X'])->assertStatus(403);
        $this->deleteJson("/api/notebook-projects/{$project->id}/folders/{$folder->id}")->assertStatus(403);
    }
}
