<?php

namespace Tests\Unit;

use App\Services\News\NYTimesApiService;
use App\Exceptions\ExternalApiException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class NYTimesApiServiceTest extends TestCase
{
    private NYTimesApiService $service;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.nytimes.key', 'test-api-key');
        $this->service = new NYTimesApiService();
    }

    public function test_get_source_name()
    {
        $this->assertEquals('nytimes', $this->service->getSourceName());
    }

    public function test_get_available_categories()
    {
        $categories = $this->service->getAvailableCategories();

        $this->assertIsArray($categories);
        $this->assertContains('business', $categories);
        $this->assertContains('technology', $categories);
        $this->assertContains('politics', $categories);
        $this->assertContains('world', $categories);
    }

    public function test_is_configured_returns_true_when_api_key_is_set()
    {
        $this->assertTrue($this->service->isConfigured());
    }

    public function test_fetch_top_stories_success()
    {
        $mockResponse = [
            'status' => 'OK',
            'num_results' => 2,
            'results' => [
                [
                    'title' => 'Test Article 1',
                    'abstract' => 'Test abstract 1',
                    'url' => 'https://nytimes.com/article1',
                    'published_date' => '2023-01-01T12:00:00-05:00',
                    'byline' => 'By Test Author',
                    'section' => 'Business',
                    'multimedia' => [
                        [
                            'format' => 'superJumbo',
                            'url' => 'https://nytimes.com/image1.jpg'
                        ]
                    ]
                ],
                [
                    'title' => 'Test Article 2',
                    'abstract' => 'Test abstract 2',
                    'url' => 'https://nytimes.com/article2',
                    'published_date' => '2023-01-02T12:00:00-05:00',
                    'byline' => 'By Another Author and Third Author',
                    'section' => 'Technology',
                    'multimedia' => []
                ]
            ]
        ];

        Http::fake([
            'api.nytimes.com/*' => Http::response($mockResponse, 200)
        ]);

        $articles = $this->service->fetchArticles(['limit' => 2]);

        $this->assertCount(2, $articles);

        $firstArticle = $articles->first();
        $this->assertEquals('Test Article 1', $firstArticle['title']);
        $this->assertEquals('https://nytimes.com/article1', $firstArticle['url']);
        $this->assertEquals('Test Author', $firstArticle['author']); // Should extract first author
        $this->assertEquals('nytimes', $firstArticle['source_identifier']);
        $this->assertEquals('The New York Times', $firstArticle['source_name']);
        $this->assertEquals('Business', $firstArticle['category']);
        $this->assertEquals('https://nytimes.com/image1.jpg', $firstArticle['image_url']);
    }

    public function test_fetch_articles_with_category_uses_correct_endpoint()
    {
        Http::fake([
            'api.nytimes.com/*' => Http::response(['results' => []], 200)
        ]);

        $this->service->fetchArticles(['category' => 'technology']);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'topstories/v2/technology.json');
        });
    }

    public function test_fetch_articles_with_search_query_uses_search_endpoint()
    {
        $mockSearchResponse = [
            'status' => 'OK',
            'response' => [
                'docs' => [
                    [
                        '_id' => 'test123',
                        'web_url' => 'https://nytimes.com/search-article',
                        'headline' => ['main' => 'Search Result Article'],
                        'abstract' => 'Search result abstract',
                        'pub_date' => '2023-01-01T12:00:00+0000',
                        'byline' => ['original' => 'By Search Author'],
                        'section_name' => 'U.S.',
                        'multimedia' => [
                            [
                                'type' => 'image',
                                'url' => 'images/search-image.jpg'
                            ]
                        ]
                    ]
                ]
            ]
        ];

        Http::fake([
            'api.nytimes.com/*' => Http::response($mockSearchResponse, 200)
        ]);

        $articles = $this->service->fetchArticles(['q' => 'climate change']);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'search/v2/articlesearch.json') &&
                (str_contains($request->url(), 'q=climate+change') || str_contains($request->url(), 'q=climate%20change'));
        });

        $this->assertCount(1, $articles);
        $article = $articles->first();
        $this->assertEquals('Search Result Article', $article['title']);
        $this->assertEquals('Search Author', $article['author']);
        $this->assertEquals('images/search-image.jpg', $article['image_url']);
    }

    public function test_fetch_articles_with_search_and_date_range()
    {
        Http::fake([
            'api.nytimes.com/*' => Http::response(['response' => ['docs' => []]], 200)
        ]);

        $this->service->fetchArticles([
            'q' => 'test query',
            'from' => '2023-01-01',
            'to' => '2023-01-31'
        ]);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'begin_date=20230101') &&
                str_contains($request->url(), 'end_date=20230131');
        });
    }

    public function test_author_extraction_from_byline()
    {
        $mockResponse = [
            'results' => [
                [
                    'title' => 'Test Article',
                    'abstract' => 'Test abstract',
                    'url' => 'https://nytimes.com/test',
                    'published_date' => '2023-01-01T12:00:00-05:00',
                    'byline' => 'By John Doe and Jane Smith',
                    'multimedia' => []
                ]
            ]
        ];

        Http::fake([
            'api.nytimes.com/*' => Http::response($mockResponse, 200)
        ]);

        $articles = $this->service->fetchArticles();

        // Should extract only the first author
        $this->assertEquals('John Doe', $articles->first()['author']);
    }

    public function test_fetch_articles_throws_exception_when_not_configured()
    {
        Config::set('services.nytimes.key', '');
        $service = new NYTimesApiService();

        $this->expectException(ExternalApiException::class);
        $this->expectExceptionMessage('API service not properly configured for nytimes');

        $service->fetchArticles();
    }

    public function test_fetch_articles_throws_exception_on_api_error()
    {
        Http::fake([
            'api.nytimes.com/*' => Http::response(['fault' => ['faultstring' => 'Invalid API key']], 401)
        ]);

        $this->expectException(ExternalApiException::class);

        $this->service->fetchArticles();
    }

    public function test_handles_missing_multimedia_gracefully()
    {
        $mockResponse = [
            'results' => [
                [
                    'title' => 'Test Article',
                    'abstract' => 'Test abstract',
                    'url' => 'https://nytimes.com/test',
                    'published_date' => '2023-01-01T12:00:00-05:00',
                    'byline' => 'By Test Author',
                    'multimedia' => null
                ]
            ]
        ];

        Http::fake([
            'api.nytimes.com/*' => Http::response($mockResponse, 200)
        ]);

        $articles = $this->service->fetchArticles();

        $this->assertNull($articles->first()['image_url']);
    }

    public function test_get_rate_limit_info()
    {
        $rateLimitInfo = $this->service->getRateLimitInfo();

        $this->assertIsArray($rateLimitInfo);
        $this->assertArrayHasKey('requests_per_hour', $rateLimitInfo);
        $this->assertArrayHasKey('remaining', $rateLimitInfo);
        $this->assertEquals(4000, $rateLimitInfo['requests_per_hour']);
    }

    public function test_default_endpoint_is_home_stories()
    {
        Http::fake([
            'api.nytimes.com/*' => Http::response(['results' => []], 200)
        ]);

        $this->service->fetchArticles();

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'topstories/v2/home.json');
        });
    }
}
