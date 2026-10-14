<?php

namespace Tests\Feature;

use App\Models\ProjectFile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectFileStorageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(ProjectFile::DISK);
    }

    private function projectFor(User $user)
    {
        return $user->notebookProjects()->create(['name' => 'P']);
    }

    public function test_upload_stores_file_privately_with_random_name(): void
    {
        $user = User::factory()->create();
        $project = $this->projectFor($user);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/notebook-projects/{$project->id}/files", [
            'file' => UploadedFile::fake()->create('Спецификация v2.pdf', 120, 'application/pdf'),
        ])->assertStatus(201)
            ->assertJsonPath('name', 'Спецификация v2.pdf')
            ->assertJsonPath('folder_id', null)
            ->assertJsonMissingPath('path');

        $file = ProjectFile::find($response->json('id'));
        $this->assertStringStartsWith("notebook-projects/{$project->id}/", $file->path);
        $this->assertStringNotContainsString('Спецификация', $file->path);
        Storage::disk(ProjectFile::DISK)->assertExists($file->path);
    }

    public function test_blocked_extensions_and_oversize_are_rejected(): void
    {
        $user = User::factory()->create();
        $project = $this->projectFor($user);
        Sanctum::actingAs($user);

        $this->postJson("/api/notebook-projects/{$project->id}/files", [
            'file' => UploadedFile::fake()->create('shell.php', 1),
        ])->assertStatus(422)->assertJsonValidationErrors('file');

        $this->postJson("/api/notebook-projects/{$project->id}/files", [
            'file' => UploadedFile::fake()->create('big.zip', ProjectFile::MAX_SIZE_KB + 1),
        ])->assertStatus(422)->assertJsonValidationErrors('file');

        $this->assertSame(0, $project->files()->count());
    }

    public function test_project_quota(): void
    {
        $user = User::factory()->create();
        $project = $this->projectFor($user);
        $project->files()->create([
            'name' => 'a', 'original_name' => 'a', 'path' => 'x', 'size' => ProjectFile::PROJECT_QUOTA - 1000,
        ]);
        Sanctum::actingAs($user);

        $this->postJson("/api/notebook-projects/{$project->id}/files", [
            'file' => UploadedFile::fake()->create('more.txt', 10),
        ])->assertStatus(422)->assertJsonValidationErrors('file');
    }

    public function test_download_requires_owner_and_matching_project(): void
    {
        $owner = User::factory()->create();
        $project = $this->projectFor($owner);
        $other = $this->projectFor($owner);
        Sanctum::actingAs($owner);

        $id = $this->postJson("/api/notebook-projects/{$project->id}/files", [
            'file' => UploadedFile::fake()->createWithContent('note.txt', 'hello'),
        ])->assertStatus(201)->json('id');

        $this->get("/api/notebook-projects/{$project->id}/files/{$id}/download")
            ->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->get("/api/notebook-projects/{$other->id}/files/{$id}/download")->assertStatus(404);

        Sanctum::actingAs(User::factory()->create());
        $this->get("/api/notebook-projects/{$project->id}/files/{$id}/download")->assertStatus(403);
    }

    public function test_rename_and_delete_removes_from_disk(): void
    {
        $user = User::factory()->create();
        $project = $this->projectFor($user);
        Sanctum::actingAs($user);

        $id = $this->postJson("/api/notebook-projects/{$project->id}/files", [
            'file' => UploadedFile::fake()->create('a.txt', 1),
        ])->json('id');
        $path = ProjectFile::find($id)->path;

        $this->putJson("/api/notebook-projects/{$project->id}/files/{$id}", ['name' => '../../etc/b.txt'])
            ->assertOk()->assertJsonPath('name', 'b.txt');

        $this->deleteJson("/api/notebook-projects/{$project->id}/files/{$id}")->assertStatus(204);
        Storage::disk(ProjectFile::DISK)->assertMissing($path);
        $this->assertSame(0, $project->files()->count());
    }

    public function test_show_lists_files_and_counts(): void
    {
        $user = User::factory()->create();
        $project = $this->projectFor($user);
        Sanctum::actingAs($user);

        $this->postJson("/api/notebook-projects/{$project->id}/files", [
            'file' => UploadedFile::fake()->create('a.txt', 1),
        ])->assertStatus(201);

        $this->getJson("/api/notebook-projects/{$project->id}")
            ->assertOk()->assertJsonCount(1, 'files')->assertJsonPath('files_count', 1);
        $this->getJson('/api/notebook-projects')->assertOk()->assertJsonPath('0.files_count', 1);
    }
}
