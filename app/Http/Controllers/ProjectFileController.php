<?php

namespace App\Http\Controllers;

use App\Models\NotebookProject;
use App\Models\ProjectFile;
use App\Models\ProjectFolder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProjectFileController extends Controller
{
    public function store(Request $request, NotebookProject $notebookProject): JsonResponse
    {
        $this->authorize('update', $notebookProject);

        $data = $request->validate([
            'file' => 'required|file|max:'.ProjectFile::MAX_SIZE_KB,
            'folder_id' => $this->folderRule($notebookProject),
            'description' => 'sometimes|nullable|string|max:5000',
        ]);

        $upload = $request->file('file');
        $originalName = $this->cleanName($upload->getClientOriginalName());
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        if (in_array($extension, ProjectFile::BLOCKED_EXTENSIONS, true)) {
            throw ValidationException::withMessages(['file' => 'Файлы этого типа загружать нельзя.']);
        }

        $used = (int) $notebookProject->files()->sum('size');
        if ($used + $upload->getSize() > ProjectFile::PROJECT_QUOTA) {
            throw ValidationException::withMessages(['file' => 'Превышен общий лимит файлов проекта (500 МБ).']);
        }

        // Имя на диске — случайное: оригинальное имя в путь не попадает.
        $stored = Str::uuid()->toString().($extension !== '' ? '.'.preg_replace('/[^a-z0-9]/', '', $extension) : '');
        $path = $upload->storeAs('notebook-projects/'.$notebookProject->id, $stored, ProjectFile::DISK);

        // Без явной папки файл сразу попадает в системную папку своего типа.
        $folderId = $data['folder_id'] ?? null;
        if ($folderId === null) {
            $system = ProjectFolder::ensureSystem($notebookProject);
            $folderId = $system[ProjectFile::kindFor($upload->getClientMimeType(), $originalName)];
        }

        $file = $notebookProject->files()->create([
            'name' => $originalName,
            'original_name' => $originalName,
            'path' => $path,
            'mime_type' => $upload->getClientMimeType(),
            'size' => $upload->getSize(),
            'folder_id' => $folderId,
            'description' => $data['description'] ?? null,
        ]);

        return response()->json($file->fresh(), 201);
    }

    public function update(Request $request, NotebookProject $notebookProject, ProjectFile $projectFile): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        $this->ensureBelongs($notebookProject, $projectFile);

        $data = $request->validate([
            'name' => 'sometimes|nullable|string|max:255',
            'folder_id' => $this->folderRule($notebookProject),
            'description' => 'sometimes|nullable|string|max:5000',
        ]);

        if (array_key_exists('name', $data)) {
            $name = $this->cleanName((string) $data['name']);
            $data['name'] = $name === '' ? $projectFile->original_name : $name;
        }

        $projectFile->update($data);

        return response()->json($projectFile->fresh());
    }

    public function download(Request $request, NotebookProject $notebookProject, ProjectFile $projectFile): StreamedResponse
    {
        $this->authorize('view', $notebookProject);
        $this->ensureBelongs($notebookProject, $projectFile);

        abort_unless(Storage::disk(ProjectFile::DISK)->exists($projectFile->path), 404);

        return Storage::disk(ProjectFile::DISK)->download($projectFile->path, $projectFile->name, [
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function destroy(Request $request, NotebookProject $notebookProject, ProjectFile $projectFile): JsonResponse
    {
        $this->authorize('update', $notebookProject);
        $this->ensureBelongs($notebookProject, $projectFile);

        Storage::disk(ProjectFile::DISK)->delete($projectFile->path);
        $projectFile->delete();

        return response()->json(null, 204);
    }

    private function folderRule(NotebookProject $project): array
    {
        return [
            'sometimes', 'nullable', 'integer',
            Rule::exists('project_folders', 'id')->where('notebook_project_id', $project->id),
        ];
    }

    private function ensureBelongs(NotebookProject $project, ProjectFile $file): void
    {
        abort_unless($file->notebook_project_id === $project->id, 404);
    }

    private function cleanName(string $name): string
    {
        $name = basename(str_replace('\\', '/', $name));
        $name = preg_replace('/[\x00-\x1F\x7F]/u', '', $name) ?? '';

        return Str::limit(trim($name), 255, '');
    }
}
