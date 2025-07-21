<?php

namespace App\Services\News;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class NewsApiService extends AbstractNewsService
{
    protected function configure(): void
    {
        $this->baseUrl = 'https://newsapi.org/v2/';
        $this->apiKey = config('services.newsapi.key');
        $this->rateLimitPerHour = 1000; // Free tier limit
    }

    public function getSourceName(): string
    {
        return 'newsapi';
    }

    public function getAvailableCategories(): array
    {
        return [
            'business',
            'entertainment',
            'general',
            'health',
            'science',
            'sports',
            'technology'
        ];
    }

    protected function getArticlesEndpoint(array $parameters): string
    {
        return !empty($parameters['q']) ? 'everything' : 'top-headlines';
    }

    protected function buildRequestParameters(array $parameters): array
    {
        $params = [
            'apiKey' => $this->apiKey,
            'pageSize' => $parameters['limit'] ?? 20,
            'page' => $parameters['page'] ?? 1,
        ];

        // Add country parameter (default to US)
        $params['country'] = $parameters['country'] ?? 'us';

        // Add category if specified
        if (!empty($parameters['category']) && in_array($parameters['category'], $this->getAvailableCategories())) {
            $params['category'] = $parameters['category'];
        }

        // Add search query if specified
        if (!empty($parameters['q'])) {
            $params['q'] = $parameters['q'];
            // When searching, we need to use 'everything' endpoint instead
            unset($params['country']);
            unset($params['category']);
        }

        // Add date range if specified
        if (!empty($parameters['from'])) {
            $params['from'] = Carbon::parse($parameters['from'])->toISOString();
        }

        if (!empty($parameters['to'])) {
            $params['to'] = Carbon::parse($parameters['to'])->toISOString();
        }

        return $params;
    }
    protected function extractArticlesFromResponse(array $data): array
    {
        return $data['articles'] ?? [];
    }

    protected function transformArticle(array $rawArticle): array
    {
        return [
            'title' => $rawArticle['title'] ?? '',
            'content' => $rawArticle['content'] ?? $rawArticle['description'] ?? '',
            'summary' => $rawArticle['description'] ?? '',
            'url' => $rawArticle['url'] ?? '',
            'image_url' => $rawArticle['urlToImage'] ?? null,
            'published_at' => $rawArticle['publishedAt'] ? Carbon::parse($rawArticle['publishedAt']) : null,
            'author' => $rawArticle['author'] ?? null,
            'source_name' => $rawArticle['source']['name'] ?? $this->getSourceName(),
            'source_identifier' => $this->getSourceName(),
            'external_id' => md5($rawArticle['url'] ?? ''),
            'raw_data' => $rawArticle,
        ];
    }
}
