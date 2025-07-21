<?php

namespace App\Jobs;

use App\Services\ArticleAggregationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessNewsAggregation implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public int $timeout = 300; // 5 minutes timeout
    public int $tries = 3; // Retry up to 3 times
    public int $backoff = 60; // Wait 60 seconds between retries

    protected array $parameters;
    protected ?string $specificSource;

    /**
     * Create a new job instance.
     */
    public function __construct(array $parameters = [], ?string $specificSource = null)
    {
        $this->parameters = $parameters;
        $this->specificSource = $specificSource;
    }

    /**
     * Execute the job.
     */
    public function handle(ArticleAggregationService $aggregationService): void
    {
        Log::info('Starting background news aggregation job', [
            'parameters' => $this->parameters,
            'specific_source' => $this->specificSource,
        ]);

        $startTime = microtime(true);

        try {
            if ($this->specificSource) {
                $articles = $aggregationService->aggregateFromSource($this->specificSource, $this->parameters);
                Log::info("Aggregated {$articles->count()} articles from {$this->specificSource}");
            } else {
                $articles = $aggregationService->aggregateFromAllSources($this->parameters);
                Log::info("Aggregated {$articles->count()} articles from all sources");
            }

            if ($articles->isNotEmpty()) {
                $storedArticles = $aggregationService->storeArticles($articles);

                Log::info('News aggregation job completed successfully', [
                    'articles_found' => $articles->count(),
                    'articles_stored' => $storedArticles->count(),
                    'execution_time' => round(microtime(true) - $startTime, 2),
                ]);
            } else {
                Log::info('News aggregation job completed - no new articles found', [
                    'execution_time' => round(microtime(true) - $startTime, 2),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('News aggregation job failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'parameters' => $this->parameters,
                'specific_source' => $this->specificSource,
                'execution_time' => round(microtime(true) - $startTime, 2),
            ]);

            // Re-throw the exception to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('News aggregation job failed permanently after all retries', [
            'error' => $exception->getMessage(),
            'parameters' => $this->parameters,
            'specific_source' => $this->specificSource,
        ]);

        // Here you could send notifications to administrators
        // or implement other failure handling logic
    }
}
