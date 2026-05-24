<?php

use App\Http\Controllers\AboutController;
use App\Http\Controllers\AchievementController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\HeroController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\TechnologyController;
use Illuminate\Support\Facades\Route;

// Auth
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);

    Route::put('/hero', [HeroController::class, 'update']);
    Route::put('/about', [AboutController::class, 'update']);
    Route::put('/contacts', [ContactController::class, 'update']);

    Route::post('/services', [ServiceController::class, 'store']);
    Route::put('/services/{service}', [ServiceController::class, 'update']);
    Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

    Route::post('/achievements', [AchievementController::class, 'store']);
    Route::put('/achievements/{achievement}', [AchievementController::class, 'update']);
    Route::delete('/achievements/{achievement}', [AchievementController::class, 'destroy']);

    Route::post('/technologies', [TechnologyController::class, 'store']);
    Route::put('/technologies/{technology}', [TechnologyController::class, 'update']);
    Route::delete('/technologies/{technology}', [TechnologyController::class, 'destroy']);

    Route::post('/projects', [ProjectController::class, 'store']);
    Route::put('/projects/{project}', [ProjectController::class, 'update']);
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);
});

// Public read
Route::get('/hero', [HeroController::class, 'show']);
Route::get('/about', [AboutController::class, 'show']);
Route::get('/contacts', [ContactController::class, 'show']);
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/achievements', [AchievementController::class, 'index']);
Route::get('/technologies', [TechnologyController::class, 'index']);
Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/projects/{project}', [ProjectController::class, 'show']);
