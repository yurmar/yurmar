<?php

namespace App\Policies;

use App\Models\NotebookProject;
use App\Models\User;

class NotebookProjectPolicy
{
    public function view(User $user, NotebookProject $project): bool
    {
        return $project->user_id === $user->id;
    }

    public function update(User $user, NotebookProject $project): bool
    {
        return $project->user_id === $user->id;
    }

    public function delete(User $user, NotebookProject $project): bool
    {
        return $project->user_id === $user->id;
    }
}
