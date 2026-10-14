<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectFile extends Model
{
    public const DISK = 'local';

    public const CATEGORIES = ['code', 'design', 'docs', 'data', 'other'];

    /** Максимальный размер одного файла, КБ. */
    public const MAX_SIZE_KB = 51200;

    /** Общий лимит файлов проекта, байт. */
    public const PROJECT_QUOTA = 524288000;

    /** Расширения, которые не принимаем (исполняемые на сервере и в ОС). */
    public const BLOCKED_EXTENSIONS = [
        'php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phar', 'phps',
        'exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'dll', 'cgi', 'htaccess',
    ];

    protected $fillable = ['name', 'original_name', 'path', 'mime_type', 'size', 'category', 'description'];

    protected $hidden = ['path'];

    protected $casts = ['size' => 'integer'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(NotebookProject::class, 'notebook_project_id');
    }
}
