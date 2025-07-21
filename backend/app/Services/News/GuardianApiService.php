<?php

namespace App\Services\News;

use Carbon\Carbon;

class GuardianApiService extends AbstractNewsService
{
    protected function configure(): void
    {
        $this->baseUrl = 'https://content.guardianapis.com/';
        $this->apiKey = config('services.guardian.key');
        $this->rateLimitPerHour = 5000; // Guardian API limit
    }

    public function getSourceName(): string
    {
        return 'guardian';
    }

    public function getAvailableCategories(): array
    {
        return [
            'world',
            'politics',
            'business',
            'technology',
            'environment',
            'science',
            'sport',
            'culture',
            'lifestyle',
            'opinion',
            'education',
            'media',
            'society'
        ];
    }

    protected function getArticlesEndpoint(array $parameters): string
    {
        return 'top-stories';
    }

    protected function buildRequestParameters(array $parameters): array
    {
        $params = [
            'api-key' => $this->apiKey,
            'page-size' => min($parameters['limit'] ?? 20, 50), // Guardian max is 50
            'page' => $parameters['page'] ?? 1,
            'show-fields' => 'headline,byline,thumbnail,bodyText,publication,short-url',
            'show-tags' => 'contributor',
            'order-by' => 'newest',
        ];

        // Add section (category) if specified
        if (!empty($parameters['category']) && in_array($parameters['category'], $this->getAvailableCategories())) {
            $params['section'] = $parameters['category'];
        }

        // Add search query if specified
        if (!empty($parameters['q'])) {
            $params['q'] = $parameters['q'];
        }

        // Add date range if specified
        if (!empty($parameters['from'])) {
            $params['from-date'] = Carbon::parse($parameters['from'])->toDateString();
        }

        if (!empty($parameters['to'])) {
            $params['to-date'] = Carbon::parse($parameters['to'])->toDateString();
        }

        return $params;
    }

    protected function extractArticlesFromResponse(array $data): array
    {
        return $data['response']['results'] ?? [];
    }

    protected function transformArticle(array $rawArticle): array
    {
        $fields = $rawArticle['fields'] ?? [];
        $tags = $rawArticle['tags'] ?? [];

        // Extract author from tags
        $author = null;
        foreach ($tags as $tag) {
            if ($tag['type'] === 'contributor') {
                $author = $tag['webTitle'];
                break;
            }
        }

        return [
            'title' => $fields['headline'] ?? $rawArticle['webTitle'] ?? '',
            'content' => $fields['bodyText'] ?? '',
            'summary' => $this->extractSummary($fields['bodyText'] ?? ''),
            'url' => $rawArticle['webUrl'] ?? '',
            'image_url' => $fields['thumbnail'] ?? null,
            'published_at' => $rawArticle['webPublicationDate'] ? Carbon::parse($rawArticle['webPublicationDate']) : null,
            'author' => $author ?? $fields['byline'] ?? null,
            'source_name' => 'The Guardian',
            'source_identifier' => $this->getSourceName(),
            'external_id' => $rawArticle['id'] ?? md5($rawArticle['webUrl'] ?? ''),
            'category' => $rawArticle['sectionName'] ?? null,
            'raw_data' => $rawArticle,
        ];
    }

    /**
     * Extract summary from body text (first 200 characters)
     */
    private function extractSummary(string $bodyText): string
    {
        if (empty($bodyText)) {
            return '';
        }

        $summary = strip_tags($bodyText);
        $summary = preg_replace('/\s+/', ' ', $summary);

        if (strlen($summary) > 200) {
            $summary = substr($summary, 0, 200);
            $lastSpace = strrpos($summary, ' ');
            if ($lastSpace !== false) {
                $summary = substr($summary, 0, $lastSpace);
            }
            $summary .= '...';
        }

        return trim($summary);
    }
}
