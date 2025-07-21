<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Category;
use App\Models\Source;
use App\Models\UserPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class PreferenceController extends Controller
{
    /**
     * Get user preferences.
     */
    public function getPreferences(): JsonResponse
    {
        $user = Auth::guard('api')->user();
        $preferences = $user->preferences;

        if (!$preferences) {
            // Return default empty preferences if none exist
            $preferences = [
                'preferred_sources' => [],
                'preferred_categories' => [],
                'preferred_authors' => [],
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'preferred_sources' => $preferences->preferred_sources ?? [],
                'preferred_categories' => $preferences->preferred_categories ?? [],
                'preferred_authors' => $preferences->preferred_authors ?? [],
            ],
            'meta' => [
                'timestamp' => now()->toISOString(),
                'request_id' => request()->header('X-Request-ID', uniqid())
            ]
        ]);
    }

    /**
     * Update user preferences.
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'preferred_sources' => 'array',
            'preferred_sources.*' => 'integer|exists:sources,id',
            'preferred_categories' => 'array',
            'preferred_categories.*' => 'integer|exists:categories,id',
            'preferred_authors' => 'array',
            'preferred_authors.*' => 'string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
                'meta' => [
                    'timestamp' => now()->toISOString(),
                    'request_id' => $request->header('X-Request-ID', uniqid())
                ]
            ], 422);
        }

        /** @var \App\Models\User $user */
        $user = Auth::guard('api')->user();

        $user->preferences()->updateOrCreate(
            ['user_id' => Auth::guard('api')->id()],
            [
                'preferred_sources' => $request->get('preferred_sources', []),
                'preferred_categories' => $request->get('preferred_categories', []),
                'preferred_authors' => $request->get('preferred_authors', []),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Preferences updated successfully',
            'data' => $user->preferences,
            'meta' => [
                'timestamp' => now()->toISOString(),
                'request_id' => $request->header('X-Request-ID', uniqid())
            ]
        ]);
    }

    /**
     * Get available sources for dropdown options.
     */
    public function getSources(): JsonResponse
    {
        $sources = Source::where('is_active', true)
            ->select('id', 'name', 'display_name')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $sources,
            'meta' => [
                'total' => $sources->count(),
                'timestamp' => now()->toISOString(),
                'request_id' => request()->header('X-Request-ID', uniqid())
            ]
        ]);
    }

    /**
     * Get available categories for dropdown options.
     */
    public function getCategories(): JsonResponse
    {
        $categories = Category::select('id', 'name', 'slug', 'description')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
            'meta' => [
                'total' => $categories->count(),
                'timestamp' => now()->toISOString(),
                'request_id' => request()->header('X-Request-ID', uniqid())
            ]
        ]);
    }
}
