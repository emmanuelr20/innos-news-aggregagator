<?php

namespace App\Services;

use App\Contracts\ArticleAggregationServiceInterface;
use App\Contracts\NewsSourceInterface;
use App\Services\News\NewsApiService;
use App\Services\News\GuardianApiService;
use App\Services\News\NYTimesApiService;
use App\Models\Article;
use App\Models\Source;
use App\Models\Category;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ArticleAggregationService implements ArticleAggregationServiceInterface
{
    protected array $newsServices;
    protected array $categoryKeywords;

    public function __construct()
    {
        $this->newsServices = [
            'newsapi' => new NewsApiService(),
            'guardian' => new GuardianApiService(),
            'nytimes' => new NYTimesApiService(),
        ];

        $this->categoryKeywords = [
            'technology' => ['tech', 'technology', 'software', 'ai', 'artificial intelligence', 'computer', 'digital', 'internet', 'cyber'],
            'business' => ['business', 'economy', 'finance', 'market', 'stock', 'trade', 'company', 'corporate', 'investment'],
            'politics' => ['politics', 'government', 'election', 'policy', 'congress', 'senate', 'president', 'political'],
            'health' => ['health', 'medical', 'medicine', 'hospital', 'doctor', 'disease', 'treatment', 'healthcare'],
            'science' => ['science', 'research', 'study', 'scientist', 'discovery', 'experiment', 'scientific'],
            'sports' => ['sports', 'football', 'basketball', 'baseball', 'soccer', 'tennis', 'game', 'team', 'player'],
            'entertainment' => ['entertainment', 'movie', 'film', 'music', 'celebrity', 'actor', 'actress', 'show'],
            'world' => ['world', 'international', 'global', 'country', 'nation', 'foreign', 'diplomatic'],
        ];
    }

    public function aggregateFromAllSources(array $parameters = []): Collection
    {
        $allArticles = collect();

        foreach ($this->newsServices as $sourceName => $service) {
            try {
                if (!$service->isConfigured()) {
                    Log::warning("News service {$sourceName} is not properly configured, skipping");
                    continue;
                }

                $articles = $this->aggregateFromSource($sourceName, $parameters);
                $allArticles = $allArticles->merge($articles);

                Log::info("Successfully aggregated {$articles->count()} articles from {$sourceName}");
            } catch (\Exception $e) {
                Log::error("Failed to aggregate articles from {$sourceName}", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        return $allArticles;
    }

    public function aggregateFromSource(string $sourceName, array $parameters = []): Collection
    {
        if (!isset($this->newsServices[$sourceName])) {
            throw new \InvalidArgumentException("Unknown news source: {$sourceName}");
        }

        $service = $this->newsServices[$sourceName];
        $rawArticles = $service->fetchArticles($parameters);

        return $rawArticles->map(function ($rawArticle) use ($sourceName) {
            // Normalize the article data
            $normalizedArticle = $this->normalizeArticle($rawArticle, $sourceName);

            // Sanitize the content
            $sanitizedArticle = $this->sanitizeArticle($normalizedArticle);

            // Auto-categorize
            $sanitizedArticle['category'] = $this->categorizeArticle($sanitizedArticle);

            return $sanitizedArticle;
        })->filter(function ($article) {
            // Filter out articles that are duplicates
            return !$this->detectDuplicate($article);
        });
    }

    public function normalizeArticle(array $rawArticle, string $sourceIdentifier): array
    {
        // The raw article should already be normalized by the individual services
        // But we'll add some additional normalization here

        $normalized = $rawArticle;

        // Ensure required fields exist
        $normalized['title'] = trim($normalized['title'] ?? '');
        $normalized['content'] = trim($normalized['content'] ?? '');
        $normalized['summary'] = trim($normalized['summary'] ?? '');
        $normalized['url'] = trim($normalized['url'] ?? '');
        $normalized['source_identifier'] = $sourceIdentifier;

        // Normalize published date
        if (!empty($normalized['published_at'])) {
            if (!($normalized['published_at'] instanceof Carbon)) {
                $normalized['published_at'] = Carbon::parse($normalized['published_at']);
            }
        } else {
            $normalized['published_at'] = now();
        }

        // Generate a unique external ID if not present
        if (empty($normalized['external_id'])) {
            $normalized['external_id'] = md5($normalized['url'] . $normalized['title']);
        }

        // Clean up author field
        if (!empty($normalized['author'])) {
            $normalized['author'] = trim($normalized['author']);
            // Remove common prefixes
            $normalized['author'] = preg_replace('/^(By\s+|Author:\s*)/i', '', $normalized['author']);
        }

        return $normalized;
    }

    public function detectDuplicate(array $articleData): ?Article
    {
        // Check for exact URL match first
        if (!empty($articleData['url'])) {
            $existingByUrl = Article::where('url', $articleData['url'])->first();
            if ($existingByUrl) {
                return $existingByUrl;
            }
        }

        // Check for external ID match
        if (!empty($articleData['external_id'])) {
            $existingByExternalId = Article::where('external_id', $articleData['external_id'])->first();
            if ($existingByExternalId) {
                return $existingByExternalId;
            }
        }

        // Check for similar title and same day publication
        if (!empty($articleData['title'])) {
            $publishedDate = $articleData['published_at'] instanceof Carbon
                ? $articleData['published_at']
                : Carbon::parse($articleData['published_at']);

            // Get all articles from the same day and check similarity manually
            $candidateArticles = Article::whereDate('published_at', $publishedDate->toDateString())->get();

            foreach ($candidateArticles as $candidate) {
                $similarity = $this->calculateTitleSimilarity($articleData['title'], $candidate->title);
                if ($similarity > 0.8) { // 80% similarity threshold
                    return $candidate;
                }
            }
        }

        return null;
    }

    public function categorizeArticle(array $articleData): string
    {
        $text = strtolower(($articleData['title'] ?? '') . ' ' . ($articleData['content'] ?? '') . ' ' . ($articleData['summary'] ?? ''));

        $categoryScores = [];

        foreach ($this->categoryKeywords as $category => $keywords) {
            $score = 0;
            foreach ($keywords as $keyword) {
                $score += substr_count($text, strtolower($keyword));
            }
            $categoryScores[$category] = $score;
        }

        // Get the category with the highest score
        $bestCategory = array_keys($categoryScores, max($categoryScores))[0];

        // If no keywords matched, default to 'general'
        if (max($categoryScores) === 0) {
            $bestCategory = 'general';
        }

        return $bestCategory;
    }

    public function sanitizeArticle(array $articleData): array
    {
        $sanitized = $articleData;

        // Sanitize HTML content
        if (!empty($sanitized['content'])) {
            $sanitized['content'] = $this->sanitizeHtml($sanitized['content']);
        }

        if (!empty($sanitized['summary'])) {
            $sanitized['summary'] = $this->sanitizeHtml($sanitized['summary']);
        }

        if (!empty($sanitized['title'])) {
            // Remove script tags and their content completely
            $sanitized['title'] = preg_replace('/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi', '', $sanitized['title']);
            $sanitized['title'] = strip_tags($sanitized['title']);
            $sanitized['title'] = html_entity_decode($sanitized['title'], ENT_QUOTES, 'UTF-8');
        }

        // Validate and sanitize URL
        if (!empty($sanitized['url'])) {
            if (!filter_var($sanitized['url'], FILTER_VALIDATE_URL)) {
                Log::warning("Invalid URL detected: " . $sanitized['url']);
                $sanitized['url'] = '';
            }
        }

        // Validate image URL
        if (!empty($sanitized['image_url'])) {
            if (!filter_var($sanitized['image_url'], FILTER_VALIDATE_URL)) {
                Log::warning("Invalid image URL detected: " . $sanitized['image_url']);
                $sanitized['image_url'] = null;
            }
        }

        return $sanitized;
    }

    public function storeArticles(Collection $articles): Collection
    {
        $storedArticles = collect();

        foreach ($articles as $articleData) {
            try {
                // Get or create source
                $source = $this->getOrCreateSource($articleData['source_identifier'], $articleData['source_name'] ?? '');

                // Get or create category
                $category = $this->getOrCreateCategory($articleData['category'] ?? 'general');

                // Create the article
                $article = Article::create([
                    'title' => $articleData['title'],
                    'content' => $articleData['content'],
                    'summary' => $articleData['summary'],
                    'url' => $articleData['url'],
                    'image_url' => $articleData['image_url'],
                    'published_at' => $articleData['published_at'],
                    'author' => $articleData['author'],
                    'source_id' => $source->id,
                    'category_id' => $category->id,
                    'external_id' => $articleData['external_id'],
                ]);

                $storedArticles->push($article);
            } catch (\Exception $e) {
                Log::error("Failed to store article: " . $articleData['title'] ?? 'Unknown', [
                    'error' => $e->getMessage(),
                    'article_data' => $articleData,
                ]);
            }
        }

        return $storedArticles;
    }

    protected function calculateTitleSimilarity(string $title1, string $title2): float
    {
        $title1 = strtolower(trim($title1));
        $title2 = strtolower(trim($title2));

        // If one title contains the other, consider them very similar
        if (str_contains($title1, $title2) || str_contains($title2, $title1)) {
            return 0.9;
        }

        // Simple similarity calculation using Levenshtein distance
        $maxLength = max(strlen($title1), strlen($title2));
        if ($maxLength === 0) {
            return 1.0;
        }

        $distance = levenshtein($title1, $title2);
        return 1 - ($distance / $maxLength);
    }

    protected function sanitizeHtml(string $content): string
    {
        // Allow basic formatting tags but remove potentially dangerous ones
        $allowedTags = '<p><br><strong><b><em><i><u><a><ul><ol><li><h1><h2><h3><h4><h5><h6>';

        $sanitized = strip_tags($content, $allowedTags);

        // Remove any remaining script or style content
        $sanitized = preg_replace('/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi', '', $sanitized);
        $sanitized = preg_replace('/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/mi', '', $sanitized);

        // Decode HTML entities
        $sanitized = html_entity_decode($sanitized, ENT_QUOTES, 'UTF-8');

        return trim($sanitized);
    }

    protected function getOrCreateSource(string $identifier, string $name): Source
    {
        return Source::firstOrCreate(
            ['name' => $identifier],
            [
                'name' => $identifier,
                'display_name' => $name ?: $this->getSourceDisplayName($identifier),
                'is_active' => true,
            ]
        );
    }

    protected function getSourceDisplayName(string $identifier): string
    {
        $displayNames = [
            'newsapi' => 'NewsAPI.org',
            'guardian' => 'The Guardian',
            'nytimes' => 'The New York Times',
        ];

        return $displayNames[$identifier] ?? ucfirst($identifier);
    }

    protected function getOrCreateCategory(string $categoryName): Category
    {
        $slug = Str::slug($categoryName);

        return Category::firstOrCreate(
            ['slug' => $slug],
            [
                'name' => ucfirst($categoryName),
                'slug' => $slug,
            ]
        );
    }
}
