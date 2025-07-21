<?php

namespace Tests\Unit;

use App\Services\News\GuardianApiService;
use App\Exceptions\ExternalApiException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class GuardianApiServiceTest extends TestCase
{
    private GuardianApiService $service;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.guardian.key', 'test-api-key');
        $this->service = new GuardianApiService();
    }

    public function test_get_source_name()
    {
        $this->assertEquals('guardian', $this->service->getSourceName());
    }

    public function test_get_available_categories()
    {
        $categories = $this->service->getAvailableCategories();

        $this->assertIsArray($categories);
        $this->assertContains('world', $categories);
        $this->assertContains('politics', $categories);
        $this->assertContains('technology', $categories);
        $this->assertContains('business', $categories);
    }

    public function test_is_configured_returns_true_when_api_key_is_set()
    {
        $this->assertTrue($this->service->isConfigured());
    }

    public function test_fetch_articles_success()
    {
        $mockResponse = [
            'response' => [
                'status' => 'ok',
                'total' => 2,
                'results' => [
                    [
                        'id' => 'world/2023/jan/01/test-article-1',
                        'webTitle' => 'Test Article 1',
                        'webUrl' => 'https://theguardian.com/world/2023/jan/01/test-article-1',
                        'webPublicationDate' => '2023-01-01T12:00:00Z',
                        'sectionName' => 'World news',
                        'fields' => [
                            'headline' => 'Test Article 1 Headline',
                            'bodyText' => 'This is the body text of the test article with more than 200 characters to test the summary extraction functionality. It should be truncated properly and end with ellipsis when it exceeds the limit. This text needs to be long enough to actually trigger the truncation logic in the Guardian API service so we can test that it works correctly.',
                            'byline' => 'Test Author',
                            'thumbnail' => 'https://example.com/thumbnail.jpg'
                        ],
                        'tags' => [
                            [
                                'type' => 'contributor',
                                'webTitle' => 'Test Author'
                            ]
                        ]
                    ],
                    [
                        'id' => 'politics/2023/jan/02/test-article-2',
                        'webTitle' => 'Test Article 2',
                        'webUrl' => 'https://theguardian.com/politics/2023/jan/02/test-article-2',
                        'webPublicationDate' => '2023-01-02T12:00:00Z',
                        'sectionName' => 'Politics',
                        'fields' => [
                            'headline' => 'Test Article 2 Headline',
                            'bodyText' => 'Short body text.',
                        ],
                        'tags' => []
                    ]
                ]
            ]
        ];

        Http::fake([
            'content.guardianapis.com/*' => Http::response($mockResponse, 200)
        ]);

        $articles = $this->service->fetchArticles(['limit' => 2]);

        $this->assertCount(2, $articles);

        $firstArticle = $articles->first();
        $this->assertEquals('Test Article 1 Headline', $firstArticle['title']);
        $this->assertEquals('https://theguardian.com/world/2023/jan/01/test-article-1', $firstArticle['url']);
        $this->assertEquals('Test Author', $firstArticle['author']);
        $this->assertEquals('guardian', $firstArticle['source_identifier']);
        $this->assertEquals('The Guardian', $firstArticle['source_name']);
        $this->assertEquals('World news', $firstArticle['category']);

        // Test summary extraction
        $this->assertStringContainsString('This is the body text', $firstArticle['summary']);
        $this->assertStringEndsWith('...', $firstArticle['summary']);
        $this->assertLessThanOrEqual(203, strlen($firstArticle['summary'])); // 200 + "..."
    }

    public function test_fetch_articles_with_category_filter()
    {
        Http::fake([
            'content.guardianapis.com/*' => Http::response(['response' => ['results' => []]], 200)
        ]);

        $this->service->fetchArticles(['category' => 'politics']);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'section=politics');
        });
    }

    public function test_fetch_articles_with_search_query()
    {
        Http::fake([
            'content.guardianapis.com/*' => Http::response(['response' => ['results' => []]], 200)
        ]);

        $this->service->fetchArticles(['q' => 'climate change']);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'q=climate+change') || str_contains($request->url(), 'q=climate%20change');
        });
    }

    public function test_fetch_articles_with_date_range()
    {
        Http::fake([
            'content.guardianapis.com/*' => Http::response(['response' => ['results' => []]], 200)
        ]);

        $this->service->fetchArticles([
            'from' => '2023-01-01',
            'to' => '2023-01-31'
        ]);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'from-date=2023-01-01') &&
                str_contains($request->url(), 'to-date=2023-01-31');
        });
    }

    public function test_fetch_articles_includes_required_fields()
    {
        Http::fake([
            'content.guardianapis.com/*' => Http::response(['response' => ['results' => []]], 200)
        ]);

        $this->service->fetchArticles();

        Http::assertSent(function ($request) {
            return (str_contains($request->url(), 'show-fields=headline,byline,thumbnail,bodyText,publication,short-url') ||
                str_contains($request->url(), 'show-fields=headline%2Cbyline%2Cthumbnail%2CbodyText%2Cpublication%2Cshort-url')) &&
                str_contains($request->url(), 'show-tags=contributor');
        });
    }

    public function test_fetch_articles_throws_exception_when_not_configured()
    {
        Config::set('services.guardian.key', '');
        $service = new GuardianApiService();

        $this->expectException(ExternalApiException::class);
        $this->expectExceptionMessage('API service not properly configured for guardian');

        $service->fetchArticles();
    }

    public function test_fetch_articles_throws_exception_on_api_error()
    {
        Http::fake([
            'content.guardianapis.com/*' => Http::response(['message' => 'Invalid API key'], 401)
        ]);

        $this->expectException(ExternalApiException::class);

        $this->service->fetchArticles();
    }

    public function test_summary_extraction_handles_empty_body()
    {
        $mockResponse = [
            'response' => [
                'results' => [
                    [
                        'id' => 'test/article',
                        'webTitle' => 'Test Article',
                        'webUrl' => 'https://example.com',
                        'webPublicationDate' => '2023-01-01T12:00:00Z',
                        'fields' => [
                            'headline' => 'Test Headline',
                            'bodyText' => ''
                        ],
                        'tags' => []
                    ]
                ]
            ]
        ];

        Http::fake([
            'content.guardianapis.com/*' => Http::response($mockResponse, 200)
        ]);

        $articles = $this->service->fetchArticles();

        $this->assertEquals('', $articles->first()['summary']);
    }

    public function test_get_rate_limit_info()
    {
        $rateLimitInfo = $this->service->getRateLimitInfo();

        $this->assertIsArray($rateLimitInfo);
        $this->assertArrayHasKey('requests_per_hour', $rateLimitInfo);
        $this->assertArrayHasKey('remaining', $rateLimitInfo);
        $this->assertEquals(5000, $rateLimitInfo['requests_per_hour']);
    }
}
