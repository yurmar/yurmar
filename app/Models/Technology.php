<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Technology extends Model
{
    protected $fillable = ['name', 'color', 'category', 'sort_order'];
}
