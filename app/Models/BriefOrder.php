<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BriefOrder extends Model
{
    protected $fillable = [
        'contact_person', 'company_name', 'company_activity', 'products_info',
        'site_sections', 'brand_style', 'current_site', 'current_site_assessment',
        'competitors', 'proposed_domain', 'site_types', 'site_type_other',
        'site_tasks', 'site_tasks_other', 'site_functionality', 'site_functionality_other',
        'target_audience', 'language_versions',
        'design_impression', 'color_scheme', 'content_placement',
        'liked_sites', 'disliked_sites', 'has_advertising', 'advertising_details',
        'hosting_type', 'tech_support', 'content_filling', 'additional_wishes',
    ];

    protected $casts = [
        'site_types'        => 'array',
        'site_tasks'        => 'array',
        'site_functionality' => 'array',
    ];
}
