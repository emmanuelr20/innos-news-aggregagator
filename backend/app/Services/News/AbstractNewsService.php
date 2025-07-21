<?php

namespace App\Services\News;

use App\Contracts\NewsSourceInterface;
use App\Exceptions\ExternalApiException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

abstract class AbstractNewsService implements NewsSourceInterface
{
    protected string $baseUrl;
    protected ?string $apiKey;
    protected int $timeout = 30;
    protected int $rateLimitPerHour = 1000;
    protected int $retryAttempts = 3;
    protected int $retryDelay = 1000; // milliseconds

    public function __construct()
    {
        $this->configure();
    }

    /**
     * Configure the service with API credentials and settings
     */
    abstract protected function configure(): void;

    /**
     * Transform raw API response to standardized format
     */
    abstract protected function transformArticle(array $rawArticle): array;

    /**
     * Build API request parameters
     */
    abstract protected function buildRequestParameters(array $parameters): array;

    /**
     * Get the API endpoint for fetching articles
     */
    abstract protected function getArticlesEndpoint(array $parameters): string;

    /**
     * Fetch articles from the news source with retry logic and rate limiting
     */
    public function fetchArticles(array $parameters = []): Collection
    {
        if (!$this->isConfigured()) {
            throw new ExternalApiException(
                "API service not properly configured for {$this->getSourceName()}",
                $this->getSourceName()
            );
        }

        $cacheKey = $this->getCacheKey($parameters);

        // Check cache first (5 minutes)
        if ($cached = Cache::get($cacheKey)) {
            return collect($cached);
        }

        $requestParams = $this->buildRequestParameters($parameters);
        $articles = $this->makeApiRequest($requestParams);

        // Cache the results
        Cache::put($cacheKey, $articles->toArray(), now()->addMinutes(5));

        return $articles;
    }

    /**
     * Make HTTP request to the API with retry logic
     */
    protected function makeApiRequest(array $parameters): Collection
    {
        $attempt = 0;
        $lastException = null;

        while ($attempt < $this->retryAttempts) {
            try {
                $response = Http::timeout($this->timeout)
                    ->retry(2, 500)
                    ->get($this->baseUrl . $this->getArticlesEndpoint($parameters), $parameters);

                if ($response->successful()) {
                    $data = $response->json();
                    return $this->processApiResponse($data);
                }

                throw new ExternalApiException(
                    "API request failed with status {$response->status()}",
                    $this->getSourceName(),
                    $response->status(),
                    $response->body()
                );
            } catch (ExternalApiException $e) {
                $lastException = $e;
                Log::warning("API request attempt " . ($attempt + 1) . " failed for {$this->getSourceName()}", [
                    'error' => $e->getMessage(),
                    'status_code' => $e->getStatusCode(),
                ]);
            } catch (\Exception $e) {
                $lastException = new ExternalApiException(
                    "Unexpected error: " . $e->getMessage(),
                    $this->getSourceName(),
                    0,
                    '',
                    $e
                );
                Log::error("Unexpected error in API request for {$this->getSourceName()}", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            $attempt++;
            if ($attempt < $this->retryAttempts) {
                usleep($this->retryDelay * 1000 * $attempt); // Exponential backoff
            }
        }

        throw $lastException ?? new ExternalApiException(
            "All retry attempts failed for {$this->getSourceName()}",
            $this->getSourceName()
        );
    }

    /**
     * Process the API response and transform articles
     */
    protected function processApiResponse(array $data): Collection
    {
        $articles = $this->extractArticlesFromResponse($data);

        return collect($articles)->map(function ($article) {
            return $this->transformArticle($article);
        })->filter(function ($article) {
            return $this->isValidArticle($article);
        });
    }

    /**
     * Extract articles array from API response
     */
    abstract protected function extractArticlesFromResponse(array $data): array;

    /**
     * Validate if article has required fields
     */
    protected function isValidArticle(array $article): bool
    {
        return !empty($article['title']) &&
            !empty($article['url']) &&
            !empty($article['published_at']);
    }

    /**
     * Generate cache key for request parameters
     */
    protected function getCacheKey(array $parameters): string
    {
        return 'news_' . $this->getSourceName() . '_' . md5(serialize($parameters));
    }

    /**
     * Check if the API service is properly configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->baseUrl) && !empty($this->apiKey);
    }

    /**
     * Get rate limit information (basic implementation)
     */
    public function getRateLimitInfo(): array
    {
        return [
            'requests_per_hour' => $this->rateLimitPerHour,
            'remaining' => $this->rateLimitPerHour, // Would need actual tracking
        ];
    }
}
