<?php

namespace Tests\Unit;

use App\Jobs\ProcessNewsAggregation;
use App\Services\ArticleAggregationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class ProcessNewsAggregationTest extends TestCase
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

    public function test_job_processes_all_sources()
    {
        Log::shouldReceive('info')->atLeast()->once();

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
                'response' => ['results' => []]
            ], 200),
            'api.nytimes.com/*' => Http::response([
                'results' => []
            ], 200),
        ]);

        $job = new ProcessNewsAggregation(['limit' => 1]);
        $job->handle(new ArticleAggregationService());

        // Verify articles were stored
        $this->assertDatabaseCount('articles', 1);
        $this->assertDatabaseHas('articles', [
            'title' => 'NewsAPI Test Article',
        ]);
    }

    public function test_job_processes_specific_source()
    {
        Log::shouldReceive('info')->atLeast()->once();

        Http::fake([
            'newsapi.org/*' => Http::response([
                'articles' => [
                    [
                        'title' => 'NewsAPI Specific Test',
                        'description' => 'Test description',
                        'url' => 'https://example.com/newsapi-specific',
                        'urlToImage' => 'https://example.com/image.jpg',
                        'publishedAt' => '2023-01-01T12:00:00Z',
                        'author' => 'Test Author',
                        'source' => ['name' => 'Test Source']
                    ]
                ]
            ], 200),
        ]);

        $job = new ProcessNewsAggregation(['limit' => 1], 'newsapi');
        $job->handle(new ArticleAggregationService());

        $this->assertDatabaseCount('articles', 1);
        $this->assertDatabaseHas('articles', [
            'title' => 'NewsAPI Specific Test',
        ]);
    }

    public function test_job_handles_no_articles_gracefully()
    {
        Log::shouldReceive('info')->atLeast()->once();

        Http::fake([
            'newsapi.org/*' => Http::response(['articles' => []], 200),
            'content.guardianapis.com/*' => Http::response(['response' => ['results' => []]], 200),
            'api.nytimes.com/*' => Http::response(['results' => []], 200),
        ]);

        $job = new ProcessNewsAggregation(['limit' => 1]);
        $job->handle(new ArticleAggregationService());

        // Should complete without errors even with no articles
        $this->assertDatabaseCount('articles', 0);
    }

    public function test_job_logs_errors_on_failure()
    {
        Log::shouldReceive('info')->once();
        Log::shouldReceive('error')->once();

        // Mock a service that will throw an exception
        $mockService = $this->createMock(ArticleAggregationService::class);
        $mockService->method('aggregateFromAllSources')
            ->willThrowException(new \Exception('Test exception'));

        $job = new ProcessNewsAggregation(['limit' => 1]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Test exception');

        $job->handle($mockService);
    }

    public function test_job_has_correct_configuration()
    {
        $job = new ProcessNewsAggregation();

        $this->assertEquals(300, $job->timeout);
        $this->assertEquals(3, $job->tries);
        $this->assertEquals(60, $job->backoff);
    }

    public function test_job_failed_method_logs_permanent_failure()
    {
        Log::shouldReceive('error')->once()->with(
            'News aggregation job failed permanently after all retries',
            \Mockery::type('array')
        );

        $job = new ProcessNewsAggregation(['limit' => 1], 'test-source');
        $exception = new \Exception('Permanent failure');

        $job->failed($exception);
    }
}
