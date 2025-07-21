<?php

namespace Tests\Feature;

use App\Console\Commands\AggregateNewsCommand;
use App\Services\ArticleAggregationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class AggregateNewsCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Set up API keys for testing
        Config::set('services.newsapi.key', 'test-newsapi-key');
        Config::set('services.guardian.key', 'test-guardian-key');
        Config::set('services.nytimes.key', 'test-nytimes-key');
    }

    public function test_command_aggregates_from_all_sources()
    {
        // Mock HTTP responses
        Http::fake([
            'newsapi.org/*' => Http::response([
                'articles' => [
                    [
                        'title' => 'NewsAPI Test Article',
                        'description' => 'Test description',
                        'url' => 'https://example.com/newsapi',
                        'urlToImage' => 'https://example.com/image.jpg',
                        'publishedAt' => '2023-01-01T12:00:00Z',
                        'author' => 'Test Author',
                        'source' => ['name' => 'Test Source']
                    ]
                ]
            ], 200),
            'content.guardianapis.com/*' => Http::response([
                'response' => [
                    'results' => [
                        [
                            'id' => 'guardian/test',
                            'webTitle' => 'Guardian Test Article',
                            'webUrl' => 'https://guardian.com/test',
                            'webPublicationDate' => '2023-01-01T12:00:00Z',
                            'fields' => [
                                'headline' => 'Guardian Test Article',
                                'bodyText' => 'Test content',
                            ],
                            'tags' => []
                        ]
                    ]
                ]
            ], 200),
            'api.nytimes.com/*' => Http::response([
                'results' => [
                    [
                        'title' => 'NYTimes Test Article',
                        'abstract' => 'Test abstract',
                        'url' => 'https://nytimes.com/test',
                        'published_date' => '2023-01-01T12:00:00-05:00',
                        'byline' => 'By Test Author',
                        'multimedia' => []
                    ]
                ]
            ], 200),
        ]);

        $this->artisan('news:aggregate --limit=1')
            ->expectsOutput('Starting news aggregation...')
            ->expectsOutput('Aggregating from all configured sources...')
            ->assertExitCode(0);
    }

    public function test_command_aggregates_from_specific_source()
    {
        Http::fake([
            'newsapi.org/*' => Http::response([
                'articles' => [
                    [
                        'title' => 'NewsAPI Test Article',
                        'description' => 'Test description',
                        'url' => 'https://example.com/newsapi',
                        'urlToImage' => 'https://example.com/image.jpg',
                        'publishedAt' => '2023-01-01T12:00:00Z',
                        'author' => 'Test Author',
                        'source' => ['name' => 'Test Source']
                    ]
                ]
            ], 200),
        ]);

        $this->artisan('news:aggregate --source=newsapi --limit=1')
            ->expectsOutput('Starting news aggregation...')
            ->expectsOutput('Aggregating from source: newsapi')
            ->assertExitCode(0);
    }

    public function test_command_stores_articles_when_store_option_provided()
    {
        Http::fake([
            'newsapi.org/*' => Http::response([
                'articles' => [
                    [
                        'title' => 'NewsAPI Test Article',
                        'description' => 'Test description',
                        'url' => 'https://example.com/newsapi',
                        'urlToImage' => 'https://example.com/image.jpg',
                        'publishedAt' => '2023-01-01T12:00:00Z',
                        'author' => 'Test Author',
                        'source' => ['name' => 'Test Source']
                    ]
                ]
            ], 200),
        ]);

        $this->artisan('news:aggregate --source=newsapi --limit=1 --store')
            ->expectsOutput('Starting news aggregation...')
            ->expectsOutput('Storing articles in database...')
            ->assertExitCode(0);

        // Verify articles were stored
        $this->assertDatabaseCount('articles', 1);
        $this->assertDatabaseHas('articles', [
            'title' => 'NewsAPI Test Article',
            'url' => 'https://example.com/newsapi',
        ]);
    }

    public function test_command_handles_api_failures_gracefully()
    {
        Http::fake([
            'newsapi.org/*' => Http::response(['error' => 'API Error'], 500),
        ]);

        $this->artisan('news:aggregate --source=newsapi --limit=1')
            ->expectsOutput('Starting news aggregation...')
            ->assertExitCode(1); // Should fail but gracefully
    }

    public function test_command_with_category_filter()
    {
        Http::fake([
            'newsapi.org/*' => Http::response(['articles' => []], 200),
        ]);

        $this->artisan('news:aggregate --source=newsapi --category=technology --limit=1')
            ->expectsOutput('Starting news aggregation...')
            ->assertExitCode(0);

        // Verify the category parameter was passed
        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'category=technology');
        });
    }
}
