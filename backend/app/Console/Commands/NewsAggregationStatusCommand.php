<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Source;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NewsAggregationStatusCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'news:status 
                            {--hours=24 : Number of hours to look back for statistics}
                            {--detailed : Show detailed breakdown by source}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Display news aggregation status and statistics';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $detailed = $this->option('detailed');

        $this->info("News Aggregation Status Report");
        $this->info("Looking back {$hours} hours");
        $this->newLine();

        $this->displayOverallStats($hours);

        if ($detailed) {
            $this->newLine();
            $this->displaySourceBreakdown($hours);
        }

        $this->newLine();
        $this->displayRecentActivity();

        return Command::SUCCESS;
    }

    protected function displayOverallStats(int $hours): void
    {
        $since = Carbon::now()->subHours($hours);

        $totalArticles = Article::count();
        $recentArticles = Article::where('created_at', '>=', $since)->count();
        $activeSources = Source::where('is_active', true)->count();
        $totalSources = Source::count();

        $this->info("Overall Statistics:");
        $this->line("• Total articles in database: {$totalArticles}");
        $this->line("• Articles added in last {$hours} hours: {$recentArticles}");
        $this->line("• Active sources: {$activeSources}/{$totalSources}");

        if ($recentArticles > 0) {
            $avgPerHour = round($recentArticles / $hours, 1);
            $this->line("• Average articles per hour: {$avgPerHour}");
        }
    }

    protected function displaySourceBreakdown(int $hours): void
    {
        $since = Carbon::now()->subHours($hours);

        $sourceStats = DB::table('articles')
            ->join('sources', 'articles.source_id', '=', 'sources.id')
            ->select(
                'sources.display_name',
                'sources.name as source_name',
                'sources.is_active',
                DB::raw('COUNT(*) as total_articles'),
                DB::raw('COUNT(CASE WHEN articles.created_at >= ? THEN 1 END) as recent_articles')
            )
            ->addBinding($since, 'select')
            ->groupBy('sources.id', 'sources.display_name', 'sources.name', 'sources.is_active')
            ->orderBy('recent_articles', 'desc')
            ->get();

        $this->info("Source Breakdown:");

        if ($sourceStats->isEmpty()) {
            $this->line("No articles found from any source.");
            return;
        }

        $headers = ['Source', 'Status', 'Total Articles', "Last {$hours}h"];
        $rows = [];

        foreach ($sourceStats as $stat) {
            $status = $stat->is_active ? '✓ Active' : '✗ Inactive';
            $rows[] = [
                $stat->display_name,
                $status,
                number_format($stat->total_articles),
                number_format($stat->recent_articles),
            ];
        }

        $this->table($headers, $rows);
    }

    protected function displayRecentActivity(): void
    {
        $recentArticles = Article::with(['source', 'category'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $this->info("Recent Articles:");

        if ($recentArticles->isEmpty()) {
            $this->line("No articles found.");
            return;
        }

        foreach ($recentArticles as $article) {
            $timeAgo = $article->created_at->diffForHumans();
            $source = $article->source->display_name ?? 'Unknown';
            $category = $article->category->name ?? 'Uncategorized';

            $this->line("• [{$timeAgo}] {$article->title}");
            $this->line("  Source: {$source} | Category: {$category}");
        }
    }
}
