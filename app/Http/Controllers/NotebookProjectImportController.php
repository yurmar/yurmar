<?php

namespace App\Http\Controllers;

use App\Models\NotebookProject;
use App\Services\ProjectMarkdownImporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use App\Services\ProjectJournal;

class NotebookProjectImportController extends Controller
{
    public function store(Request $request, ProjectMarkdownImporter $importer): JsonResponse
    {
        $parsed = $this->parsed($request, $importer);

        if ($request->boolean('dry_run')) {
            return response()->json($parsed);
        }

        $project = $importer->import($request->user(), $parsed);
        ProjectJournal::created($project, 'project', $project);
        ProjectJournal::imported($project, $parsed['totals']);

        return response()->json([
            'project' => $project,
            'warnings' => $parsed['warnings'],
            'totals' => $parsed['totals'],
        ], 201);
    }

    /** Импорт плана в существующий проект: добавляет этапы, задачи и ссылки. */
    public function storeInto(Request $request, NotebookProject $notebookProject, ProjectMarkdownImporter $importer): JsonResponse
    {
        $this->authorize('update', $notebookProject);

        $parsed = $this->parsed($request, $importer);

        if ($request->boolean('dry_run')) {
            return response()->json($parsed);
        }

        $filled = $importer->importInto($notebookProject, $parsed);
        ProjectJournal::imported($notebookProject, $parsed['totals']);

        return response()->json([
            'project' => $notebookProject->fresh(),
            'filled' => $filled,
            'warnings' => $parsed['warnings'],
            'totals' => $parsed['totals'],
        ], 201);
    }

    private function parsed(Request $request, ProjectMarkdownImporter $importer): array
    {
        $data = $request->validate([
            'markdown' => 'required_without:file|nullable|string|max:500000',
            'file' => 'required_without:markdown|nullable|file|max:1024',
            'dry_run' => 'sometimes|boolean',
        ]);

        $markdown = $request->hasFile('file')
            ? (string) file_get_contents($request->file('file')->getRealPath())
            : (string) ($data['markdown'] ?? '');

        if (! mb_check_encoding($markdown, 'UTF-8')) {
            throw ValidationException::withMessages(['file' => 'Файл должен быть в кодировке UTF-8.']);
        }

        if (trim($markdown) === '') {
            throw ValidationException::withMessages(['markdown' => 'Файл пустой.']);
        }

        $parsed = $importer->parse($markdown);

        if ($parsed['totals']['milestones'] === 0 && $parsed['totals']['tasks'] === 0) {
            throw ValidationException::withMessages([
                'markdown' => 'В файле не найдено ни одного этапа (заголовок «## Название») или задачи. Проверьте формат.',
            ]);
        }

        return $parsed;
    }
}
