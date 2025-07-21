<?php

namespace App\Contracts;

use Illuminate\Support\Collection;
use App\Models\Article;

interface ArticleAggregationServiceInterface
{
    /**
     * Aggregate articles from all configured news sources
     *
     * @param array $parameters Optional parameters for filtering
     * @return Collection Collection of processed articles
     */
    public function aggregateFromAllSources(array $parameters = []): Collection;

    /**
     * Aggregate articles from a specific source
     *
     * @param string $sourceName The source identifier
     * @param array $parameters Optional parameters for filtering
     * @return Collection Collection of processed articles
     */
    public function aggregateFromSource(string $sourceName, array $parameters = []): Collection;

    /**
     * Process and normalize raw article data
     *
     * @param array $rawArticle Raw article data from API
     * @param string $sourceIdentifier Source identifier
     * @return array Normalized article data
     */
    public function normalizeArticle(array $rawArticle, string $sourceIdentifier): array;

    /**
     * Detect if an article is a duplicate of an existing one
     *
     * @param array $articleData Normalized article data
     * @return Article|null Existing duplicate article or null
     */
    public function detectDuplicate(array $articleData): ?Article;

    /**
     * Automatically categorize an article based on its content
     *
     * @param array $articleData Normalized article data
     * @return string Category name
     */
    public function categorizeArticle(array $articleData): string;

    /**
     * Sanitize and validate article content
     *
     * @param array $articleData Article data to sanitize
     * @return array Sanitized article data
     */
    public function sanitizeArticle(array $articleData): array;

    /**
     * Store processed articles in the database
     *
     * @param Collection $articles Collection of processed articles
     * @return Collection Collection of stored Article models
     */
    public function storeArticles(Collection $articles): Collection;
}
