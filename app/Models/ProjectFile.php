<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectFile extends Model
{
    public const DISK = 'local';

    /** Максимальный размер одного файла, КБ. */
    public const MAX_SIZE_KB = 51200;

    /** Общий лимит файлов проекта, байт. */
    public const PROJECT_QUOTA = 524288000;

    /** Расширения, которые не принимаем (исполняемые на сервере и в ОС). */
    public const BLOCKED_EXTENSIONS = [
        'php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phar', 'phps',
        'exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'dll', 'cgi', 'htaccess',
    ];

    /** Определяет тип файла по mime/расширению: ключ системной папки. */
    public static function kindFor(?string $mime, string $name): string
    {
        $mime = (string) $mime;
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));

        return match (true) {
            str_starts_with($mime, 'image/') => 'images',
            str_starts_with($mime, 'video/') => 'video',
            str_starts_with($mime, 'audio/') => 'audio',
            in_array($ext, ['zip', 'rar', '7z', 'tar', 'gz', 'tgz'], true) => 'archives',
            in_array($ext, ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'odt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'], true) => 'docs',
            default => 'other',
        };
    }

    protected $fillable = ['folder_id', 'name', 'original_name', 'path', 'mime_type', 'size', 'description'];

    protected $hidden = ['path'];

    protected $casts = ['size' => 'integer', 'folder_id' => 'integer'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(NotebookProject::class, 'notebook_project_id');
    }
}
