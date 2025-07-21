<?php

namespace App\Http\Controllers;

use App\Http\Requests\ArticleIndexRequest;
use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ArticleController extends Controller
{
    /**
     * Get paginated list of articles with optional filtering.
     */
    public function index(ArticleIndexRequest $request): JsonResponse
    {
        $sortBy = $request->get('sort_by', 'published_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $query = Article::with(['source', 'category']);

        if ($request->filled('saved') && Auth::guard('api')->check()) {
            /** @var \App\Models\User $user */
            $user = Auth::guard('api')->user();
            $query = $user->savedArticles()->with(['source', 'category']);
        }

        $query->orderBy($sortBy, $sortOrder);

        // Apply filters
        if ($request->filled('source_ids')) {
            $query->bySource($request->get('source_ids'));
        }

        if ($request->filled('category_ids')) {
            $query->byCategory($request->get('category_ids'));
        }

        if ($request->filled('authors')) {
            $query->byAuthor($request->get('authors'));
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->byDateRange($request->get('start_date'), $request->get('end_date'));
        }

        if ($request->filled('search')) {
            $query->search($request->get('search') ?? '');
        }

        if (Auth::guard('api')->check()) {
            $query->isSaved(Auth::guard('api')->id());
        }

        $perPage = $request->get('per_page', 15);
        $articles = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $articles->items(),
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
            'meta' => [
                'total' => $articles->total(),
                'timestamp' => now()->toISOString(),
                'request_id' => $request->header('X-Request-ID', uniqid())
            ]
        ]);
    }

    /**
     * Get a single article by ID.
     */
    public function show(int $id): JsonResponse
    {
        $article = Article::with(['source', 'category'])->isSaved(Auth::guard('api')->id())->find($id);

        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found',
                'meta' => [
                    'timestamp' => now()->toISOString(),
                    'request_id' => request()->header('X-Request-ID', uniqid())
                ]
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $article,
            'meta' => [
                'timestamp' => now()->toISOString(),
                'request_id' => request()->header('X-Request-ID', uniqid())
            ]
        ]);
    }

    /**
     * Save an article for the authenticated user.
     */
    public function save(int $id): JsonResponse
    {
        $article = Article::find($id);

        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found',
                'meta' => [
                    'timestamp' => now()->toISOString(),
                    'request_id' => request()->header('X-Request-ID', uniqid())
                ]
            ], 404);
        }

        /** @var \App\Models\User $user */
        $user =  Auth::guard('api')->user();

        // Check if already saved
        if ($user->savedArticles()->where('article_id', $id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Article is already saved',
                'meta' => [
                    'timestamp' => now()->toISOString(),
                    'request_id' => request()->header('X-Request-ID', uniqid())
                ]
            ], 409);
        }

        $user->savedArticles()->attach($id, ['saved_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Article saved successfully',
            'data' => [
                'article_id' => $id,
                'saved_at' => now()->toISOString()
            ],
            'meta' => [
                'timestamp' => now()->toISOString(),
                'request_id' => request()->header('X-Request-ID', uniqid())
            ]
        ]);
    }

    /**
     * Remove a saved article for the authenticated user.
     */
    public function unsave(int $id): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user =  Auth::guard('api')->user();

        // Check if the article is saved by the user
        if (!$user->savedArticles()->where('article_id', $id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Article is not in your saved list',
                'meta' => [
                    'timestamp' => now()->toISOString(),
                    'request_id' => request()->header('X-Request-ID', uniqid())
                ]
            ], 404);
        }

        $user->savedArticles()->detach($id);

        return response()->json([
            'success' => true,
            'message' => 'Article removed from saved list',
            'data' => [
                'article_id' => $id,
                'removed_at' => now()->toISOString()
            ],
            'meta' => [
                'timestamp' => now()->toISOString(),
                'request_id' => request()->header('X-Request-ID', uniqid())
            ]
        ]);
    }
}
