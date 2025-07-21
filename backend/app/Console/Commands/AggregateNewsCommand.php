<?php

namespace App\Console\Commands;

use App\Services\ArticleAggregationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class AggregateNewsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'news:aggregate 
                            {--source= : Specific source to aggregate from (newsapi, guardian, nytimes)}
                            {--limit=50 : Maximum number of articles to fetch per source}
                            {--category= : Specific category to fetch}
                            {--store : Store the aggregated articles in the database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Aggregate news articles from external APIs';

    protected ArticleAggregationService $aggregationService;

    public function __construct(ArticleAggregationService $aggregationService)
    {
        parent::__construct();
        $this->aggregationService = $aggregationService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting news aggregation...');

        $startTime = microtime(true);
        $parameters = $this->buildParameters();

        try {
            if ($this->option('source')) {
                $articles = $this->aggregateFromSpecificSource($parameters);
            } else {
                $articles = $this->aggregateFromAllSources($parameters);
            }

            $this->displayResults($articles, $startTime);

            if ($this->option('store') && $articles->isNotEmpty()) {
                $this->storeArticles($articles);
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('News aggregation failed: ' . $e->getMessage());
            Log::error('News aggregation command failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'parameters' => $parameters,
            ]);

            return Command::FAILURE;
        }
    }

    protected function buildParameters(): array
    {
        $parameters = [
            'limit' => (int) $this->option('limit'),
        ];

        if ($this->option('category')) {
            $parameters['category'] = $this->option('category');
        }

        return $parameters;
    }

    protected function aggregateFromSpecificSource(array $parameters): \Illuminate\Support\Collection
    {
        $source = $this->option('source');
        $this->info("Aggregating from source: {$source}");

        $articles = $this->aggregationService->aggregateFromSource($source, $parameters);

        $this->info("Found {$articles->count()} articles from {$source}");

        return $articles;
    }

    protected function aggregateFromAllSources(array $parameters): \Illuminate\Support\Collection
    {
        $this->info('Aggregating from all configured sources...');

        $articles = $this->aggregationService->aggregateFromAllSources($parameters);

        $this->info("Found {$articles->count()} total articles from all sources");

        return $articles;
    }

    protected function displayResults(\Illuminate\Support\Collection $articles, float $startTime): void
    {
        $executionTime = round(microtime(true) - $startTime, 2);

        $this->newLine();
        $this->info("Aggregation completed in {$executionTime} seconds");
        $this->info("Total articles found: {$articles->count()}");

        if ($articles->isNotEmpty()) {
            $this->newLine();
            $this->info('Sample articles:');

            $articles->take(5)->each(function ($article, $index) {
                $this->line(($index + 1) . ". {$article['title']} ({$article['source_identifier']})");
            });

            if ($articles->count() > 5) {
                $this->line('... and ' . ($articles->count() - 5) . ' more articles');
            }
        }
    }

    protected function storeArticles(\Illuminate\Support\Collection $articles): void
    {
        $this->info('Storing articles in database...');

        $storedArticles = $this->aggregationService->storeArticles($articles);

        $this->info("Successfully stored {$storedArticles->count()} articles");

        if ($storedArticles->count() < $articles->count()) {
            $skipped = $articles->count() - $storedArticles->count();
            $this->warn("Skipped {$skipped} articles (likely duplicates or errors)");
        }
    }
}
