<?php

namespace App\Services\News;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class NYTimesApiService extends AbstractNewsService
{
    protected function configure(): void
    {
        $this->baseUrl = 'https://api.nytimes.com/svc/';
        $this->apiKey = config('services.nytimes.key');
        $this->rateLimitPerHour = 4000; // NYT API limit
    }

    public function getSourceName(): string
    {
        return 'nytimes';
    }

    public function getAvailableCategories(): array
    {
        return [
            'arts',
            'automobiles',
            'books',
            'business',
            'fashion',
            'food',
            'health',
            'home',
            'insider',
            'magazine',
            'movies',
            'nyregion',
            'obituaries',
            'opinion',
            'politics',
            'realestate',
            'science',
            'sports',
            'sundayreview',
            'technology',
            'theater',
            'travel',
            'upshot',
            'us',
            'world'
        ];
    }

    protected function getArticlesEndpoint(array $parameters): string
    {
        // Use search API if query is provided
        if (!empty($parameters['_use_search'])) {
            return 'search/v2/articlesearch.json';
        }

        // Use category-specific endpoint if category is provided
        if (!empty($parameters['_category'])) {
            return "topstories/v2/{$parameters['_category']}.json";
        }

        // Default to home stories
        return 'topstories/v2/home.json';
    }

    protected function buildRequestParameters(array $parameters): array
    {
        $params = [
            'api-key' => $this->apiKey,
        ];

        // For NYT, we need to change the endpoint based on category
        if (!empty($parameters['category']) && in_array($parameters['category'], $this->getAvailableCategories())) {
            // This will be handled in makeApiRequest method
            $params['_category'] = $parameters['category'];
        }

        // For search queries, we'll use the Article Search API
        if (!empty($parameters['q'])) {
            $params['q'] = $parameters['q'];
            $params['_use_search'] = true;

            // Add date filters for search
            if (!empty($parameters['from'])) {
                $params['begin_date'] = Carbon::parse($parameters['from'])->format('Ymd');
            }

            if (!empty($parameters['to'])) {
                $params['end_date'] = Carbon::parse($parameters['to'])->format('Ymd');
            }

            // Pagination for search
            $params['page'] = $parameters['page'] ?? 0; // NYT search uses 0-based pagination
        }

        return $params;
    }

    private function cleanParameters(array $parameters): array
    {
        // Remove internal parameters that shouldn't be sent to API
        unset($parameters['_category'], $parameters['_use_search']);
        return $parameters;
    }

    protected function extractArticlesFromResponse(array $data): array
    {
        // Different response structure for search vs top stories
        if (isset($data['response']['docs'])) {
            // Article Search API response
            return $data['response']['docs'];
        }

        // Top Stories API response
        return $data['results'] ?? [];
    }

    protected function transformArticle(array $rawArticle): array
    {
        // Handle different response formats
        if (isset($rawArticle['web_url'])) {
            // Article Search API format
            return $this->transformSearchArticle($rawArticle);
        }

        // Top Stories API format
        return $this->transformTopStoryArticle($rawArticle);
    }

    private function transformSearchArticle(array $rawArticle): array
    {
        $multimedia = $rawArticle['multimedia'] ?? [];
        $imageUrl = null;

        // Find a suitable image
        foreach ($multimedia as $media) {

            if ($media['type'] === 'image' && !empty($media['url'])) {
                $imageUrl = $media['url'];
                break;
            }
        }

        return [
            'title' => $rawArticle['headline']['main'] ?? '',
            'content' => $rawArticle['lead_paragraph'] ?? '',
            'summary' => $rawArticle['abstract'] ?? $rawArticle['snippet'] ?? '',
            'url' => $rawArticle['web_url'] ?? '',
            'image_url' => $imageUrl,
            'published_at' => $rawArticle['pub_date'] ? Carbon::parse($rawArticle['pub_date']) : null,
            'author' => $this->extractAuthorFromByline($rawArticle['byline']['original'] ?? ''),
            'source_name' => 'The New York Times',
            'source_identifier' => $this->getSourceName(),
            'external_id' => $rawArticle['_id'] ?? md5($rawArticle['web_url'] ?? ''),
            'category' => $rawArticle['section_name'] ?? null,
            'raw_data' => $rawArticle,
        ];
    }

    private function transformTopStoryArticle(array $rawArticle): array
    {
        $multimedia = $rawArticle['multimedia'] ?? [];
        $imageUrl = null;

        // Find a suitable image
        foreach ($multimedia as $media) {
            if ($media['format'] === 'superJumbo' || $media['format'] === 'jumbo' || $media['format'] === 'Super Jumbo') {
                $imageUrl = $media['url'];
                break;
            }
        }

        return [
            'title' => $rawArticle['title'] ?? '',
            'content' => $rawArticle['abstract'] ?? '',
            'summary' => $rawArticle['abstract'] ?? '',
            'url' => $rawArticle['url'] ?? $rawArticle['short_url'] ?? '',
            'image_url' => $imageUrl,
            'published_at' => $rawArticle['published_date'] ? Carbon::parse($rawArticle['published_date']) : null,
            'author' => $this->extractAuthorFromByline($rawArticle['byline'] ?? ''),
            'source_name' => 'The New York Times',
            'source_identifier' => $this->getSourceName(),
            'external_id' => md5($rawArticle['url'] ?? ''),
            'category' => $rawArticle['section'] ?? null,
            'raw_data' => $rawArticle,
        ];
    }

    private function extractAuthorFromByline(string $byline): ?string
    {
        if (empty($byline)) {
            return null;
        }

        // Remove "By " prefix if present
        $author = preg_replace('/^By\s+/i', '', $byline);

        // Take only the first author if multiple
        $authors = explode(' and ', $author);

        return trim($authors[0]) ?: null;
    }
}
