<?php

use App\Http\Controllers\ArticleController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PreferenceController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth.api')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('user', [AuthController::class, 'user']);
    });
});

// Article management routes
Route::get('articles', [ArticleController::class, 'index']);

// Dropdown options (public routes)
Route::get('sources', [PreferenceController::class, 'getSources']);
Route::get('categories', [PreferenceController::class, 'getCategories']);

// Protected article routes (require authentication)
Route::middleware('auth.api')->group(function () {
    Route::post('articles/{id}/save', [ArticleController::class, 'save']);
    Route::delete('articles/saved/{id}', [ArticleController::class, 'unsave']);

    // User preference routes
    Route::get('preferences', [PreferenceController::class, 'getPreferences']);
    Route::put('preferences', [PreferenceController::class, 'updatePreferences']);
});

// Single article route (must be last to avoid conflicts)
Route::get('articles/{id}', [ArticleController::class, 'show']);
