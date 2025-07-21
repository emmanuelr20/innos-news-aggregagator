<?php

namespace App\Contracts;

use Illuminate\Support\Collection;

interface NewsSourceInterface
{
    /**
     * Fetch articles from the news source
     *
     * @param array $parameters Query parameters (category, query, page, etc.)
     * @return Collection Collection of raw article data
     * @throws \App\Exceptions\ExternalApiException
     */
    public function fetchArticles(array $parameters = []): Collection;

    /**
     * Get the source name identifier
     *
     * @return string
     */
    public function getSourceName(): string;

    /**
     * Get available categories for this source
     *
     * @return array
     */
    public function getAvailableCategories(): array;

    /**
     * Check if the API service is properly configured
     *
     * @return bool
     */
    public function isConfigured(): bool;

    /**
     * Get rate limit information
     *
     * @return array ['requests_per_hour' => int, 'remaining' => int]
     */
    public function getRateLimitInfo(): array;
}
