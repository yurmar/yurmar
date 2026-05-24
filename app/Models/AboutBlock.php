<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AboutBlock extends Model
{
    protected $fillable = [
        'description', 'short_facts',
        'skills_frontend', 'skills_backend', 'skills_devops', 'skills_design',
    ];

    protected $casts = [
        'short_facts' => 'array',
        'skills_frontend' => 'array',
        'skills_backend' => 'array',
        'skills_devops' => 'array',
        'skills_design' => 'array',
    ];
}
