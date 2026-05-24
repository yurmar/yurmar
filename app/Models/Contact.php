<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    protected $fillable = [
        'description', 'telegram_url', 'max_url', 'email', 'form_title',
    ];
}
