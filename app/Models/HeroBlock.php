<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroBlock extends Model
{
    protected $fillable = [
        'photo_path', 'name', 'specialization', 'offer_text',
        'resume_path', 'btn_portfolio', 'btn_contact', 'btn_resume',
    ];
}
