<?php

namespace Tests\Unit;

use App\Services\News\NewsApiService;
use App\Exceptions\ExternalApiException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class NewsApiServiceTest extends TestCase
{
    private NewsApiService $service;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.newsapi.key', 'test-api-key');
        $this->service = new NewsApiService();
    }

    public function test_get_source_name()
    {
        $this->assertEquals('newsapi', $this->service->getSourceName());
    }

    public function test_get_available_categories()
    {
        $categories = $this->service->getAvailableCategories();

        $this->assertIsArray($categories);
        $this->assertContains('business', $categories);
        $this->assertContains('technology', $categories);
        $this->assertContains('sports', $categories);
    }

    public function test_is_configured_returns_true_when_api_key_is_set()
    {
        $this->assertTrue($this->service->isConfigured());
    }

    public function test_is_configured_returns_false_when_api_key_is_missing()
    {
        Config::set('services.newsapi.key', '');
        $service = new NewsApiService();

        $this->assertFalse($service->isConfigured());
    }

    public function test_fetch_articles_success()
    {
        $mockResponse = [
            'status' => 'ok',
            'totalResults' => 2,
            'articles' => [
                [
                    'title' => 'Test Article 1',
                    'description' => 'Test description 1',
                    'url' => 'https://example.com/article1',
                    'urlToImage' => 'https://example.com/image1.jpg',
                    'publishedAt' => '2023-01-01T12:00:00Z',
                    'author' => 'Test Author',
                    'source' => ['name' => 'Test Source']
                ],
                [
                    'title' => 'Test Article 2',
                    'description' => 'Test description 2',
                    'url' => 'https://example.com/article2',
                    'urlToImage' => null,
                    'publishedAt' => '2023-01-02T12:00:00Z',
                    'author' => null,
                    'source' => ['name' => 'Test Source 2']
                ]
            ]
        ];

        Http::fake([
            'newsapi.org/*' => Http::response($mockResponse, 200)
        ]);

        $articles = $this->service->fetchArticles(['limit' => 2]);

        $this->assertCount(2, $articles);

        $firstArticle = $articles->first();
        $this->assertEquals('Test Article 1', $firstArticle['title']);
        $this->assertEquals('https://example.com/article1', $firstArticle['url']);
        $this->assertEquals('Test Author', $firstArticle['author']);
        $this->assertEquals('newsapi', $firstArticle['source_identifier']);
    }

    public function test_fetch_articles_with_category_filter()
    {
        Http::fake([
            'newsapi.org/*' => Http::response(['articles' => []], 200)
        ]);

        $this->service->fetchArticles(['category' => 'technology']);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'category=technology');
        });
    }

    public function test_fetch_articles_with_search_query()
    {
        Http::fake([
            'newsapi.org/*' => Http::response(['articles' => []], 200)
        ]);

        $this->service->fetchArticles(['q' => 'test query']);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'everything') &&
                (str_contains($request->url(), 'q=test+query') || str_contains($request->url(), 'q=test%20query'));
        });
    }

    public function test_fetch_articles_throws_exception_when_not_configured()
    {
        Config::set('services.newsapi.key', '');
        $service = new NewsApiService();

        $this->expectException(ExternalApiException::class);
        $this->expectExceptionMessage('API service not properly configured for newsapi');

        $service->fetchArticles();
    }

    public function test_fetch_articles_throws_exception_on_api_error()
    {
        Http::fake([
            'newsapi.org/*' => Http::response(['error' => 'API key invalid'], 401)
        ]);

        $this->expectException(ExternalApiException::class);

        $this->service->fetchArticles();
    }

    public function test_fetch_articles_filters_invalid_articles()
    {
        $mockResponse = [
            'articles' => [
                [
                    'title' => 'Valid Article',
                    'url' => 'https://example.com/valid',
                    'publishedAt' => '2023-01-01T12:00:00Z',
                    'source' => ['name' => 'Test Source']
                ],
                [
                    'title' => '', // Invalid - empty title
                    'url' => 'https://example.com/invalid',
                    'publishedAt' => '2023-01-01T12:00:00Z',
                    'source' => ['name' => 'Test Source']
                ],
                [
                    'title' => 'Another Valid Article',
                    'url' => '', // Invalid - empty URL
                    'publishedAt' => '2023-01-01T12:00:00Z',
                    'source' => ['name' => 'Test Source']
                ]
            ]
        ];

        Http::fake([
            'newsapi.org/*' => Http::response($mockResponse, 200)
        ]);

        $articles = $this->service->fetchArticles();

        $this->assertCount(1, $articles);
        $this->assertEquals('Valid Article', $articles->first()['title']);
    }

    public function test_get_rate_limit_info()
    {
        $rateLimitInfo = $this->service->getRateLimitInfo();

        $this->assertIsArray($rateLimitInfo);
        $this->assertArrayHasKey('requests_per_hour', $rateLimitInfo);
        $this->assertArrayHasKey('remaining', $rateLimitInfo);
        $this->assertEquals(1000, $rateLimitInfo['requests_per_hour']);
    }
}
