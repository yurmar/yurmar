<?php

use App\Http\Controllers\AboutController;
use App\Http\Controllers\AchievementController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BriefOrderController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ExampleController;
use App\Http\Controllers\ExampleFolderController;
use App\Http\Controllers\HeroController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\TechnologyController;
use App\Http\Controllers\TodoDayController;
use App\Http\Controllers\TodoGeneralTaskController;
use App\Http\Controllers\TodoTaskController;
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

    Route::post('/upload', [ImageController::class, 'upload']);

    Route::post('/documents', [DocumentController::class, 'store']);
    Route::put('/documents/{document}', [DocumentController::class, 'update']);
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);

    Route::post('/example-folders', [ExampleFolderController::class, 'store']);
    Route::put('/example-folders/{exampleFolder}', [ExampleFolderController::class, 'update']);
    Route::delete('/example-folders/{exampleFolder}', [ExampleFolderController::class, 'destroy']);

    Route::post('/example-folders/{exampleFolder}/examples', [ExampleController::class, 'store']);
    Route::put('/example-folders/{exampleFolder}/examples/{example}', [ExampleController::class, 'update']);
    Route::delete('/example-folders/{exampleFolder}/examples/{example}', [ExampleController::class, 'destroy']);

    Route::get('/todo-days', [TodoDayController::class, 'index']);
    Route::post('/todo-days', [TodoDayController::class, 'store']);
    Route::get('/todo-days/{todoDay}', [TodoDayController::class, 'show']);
    Route::delete('/todo-days/{todoDay}', [TodoDayController::class, 'destroy']);

    Route::post('/todo-days/{todoDay}/tasks', [TodoTaskController::class, 'store']);
    Route::put('/todo-days/{todoDay}/tasks/{todoTask}', [TodoTaskController::class, 'update']);
    Route::delete('/todo-days/{todoDay}/tasks/{todoTask}', [TodoTaskController::class, 'destroy']);
    Route::post('/todo-days/{todoDay}/tasks/{todoTask}/move', [TodoTaskController::class, 'move']);

    Route::get('/todo-general-tasks', [TodoGeneralTaskController::class, 'index']);
    Route::post('/todo-general-tasks', [TodoGeneralTaskController::class, 'store']);
    Route::put('/todo-general-tasks/{todoTask}', [TodoGeneralTaskController::class, 'update']);
    Route::delete('/todo-general-tasks/{todoTask}', [TodoGeneralTaskController::class, 'destroy']);
    Route::post('/todo-general-tasks/{todoTask}/move', [TodoGeneralTaskController::class, 'move']);
});

// Brief orders: публичное создание, защищённый просмотр
Route::post('/brief-orders', [BriefOrderController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/brief-orders', [BriefOrderController::class, 'index']);
    Route::get('/brief-orders/{briefOrder}', [BriefOrderController::class, 'show']);
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
Route::get('/example-folders', [ExampleFolderController::class, 'index']);
Route::get('/example-folders/{exampleFolder}', [ExampleFolderController::class, 'show']);
Route::get('/example-folders/{exampleFolder}/examples', [ExampleController::class, 'index']);
Route::get('/documents', [DocumentController::class, 'index']);
Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
