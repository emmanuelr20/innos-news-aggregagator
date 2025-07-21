<?php

namespace Tests\Unit;

use App\Services\ArticleAggregationService;
use App\Models\Article;
use App\Models\Source;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;
use Carbon\Carbon;

class ArticleAggregationServiceTest extends TestCase
{
    use RefreshDatabase;

    private ArticleAggregationService $service;

    protected function setUp(): void
    {
        parent::setUp();

        // Set up API keys for testing
        Config::set('services.newsapi.key', 'test-newsapi-key');
        Config::set('services.guardian.key', 'test-guardian-key');
        Config::set('services.nytimes.key', 'test-nytimes-key');

        $this->service = new ArticleAggregationService();
    }

    public function test_normalize_article_adds_required_fields()
    {
        $rawArticle = [
            'title' => '  Test Article  ',
            'content' => '  Test content  ',
            'url' => 'https://example.com/test',
            'published_at' => '2023-01-01T12:00:00Z',
            'author' => 'By Test Author',
        ];

        $normalized = $this->service->normalizeArticle($rawArticle, 'test-source');

        $this->assertEquals('Test Article', $normalized['title']);
        $this->assertEquals('Test content', $normalized['content']);
        $this->assertEquals('test-source', $normalized['source_identifier']);
        $this->assertEquals('Test Author', $normalized['author']); // Should remove "By " prefix
        $this->assertInstanceOf(Carbon::class, $normalized['published_at']);
        $this->assertNotEmpty($normalized['external_id']);
    }

    public function test_detect_duplicate_by_url()
    {
        // Create an existing article
        $source = Source::factory()->create(['name' => 'test-source']);
        $category = Category::factory()->create(['name' => 'test']);

        $existingArticle = Article::factory()->create([
            'url' => 'https://example.com/duplicate',
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        $articleData = [
            'url' => 'https://example.com/duplicate',
            'title' => 'Different Title',
        ];

        $duplicate = $this->service->detectDuplicate($articleData);

        $this->assertNotNull($duplicate);
        $this->assertEquals($existingArticle->id, $duplicate->id);
    }

    public function test_detect_duplicate_by_external_id()
    {
        $source = Source::factory()->create(['name' => 'test-source']);
        $category = Category::factory()->create(['name' => 'test']);

        $existingArticle = Article::factory()->create([
            'external_id' => 'test-external-id',
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        $articleData = [
            'external_id' => 'test-external-id',
            'url' => 'https://different-url.com',
        ];

        $duplicate = $this->service->detectDuplicate($articleData);

        $this->assertNotNull($duplicate);
        $this->assertEquals($existingArticle->id, $duplicate->id);
    }

    public function test_detect_duplicate_by_similar_title()
    {
        $source = Source::factory()->create(['name' => 'test-source']);
        $category = Category::factory()->create(['name' => 'test']);

        $existingArticle = Article::factory()->create([
            'title' => 'Breaking News: Major Event Happens',
            'published_at' => Carbon::today(),
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        $articleData = [
            'title' => 'Breaking News: Major Event Happens Today',
            'published_at' => Carbon::today(),
            'url' => 'https://different-url.com',
        ];

        $duplicate = $this->service->detectDuplicate($articleData);

        $this->assertNotNull($duplicate);
        $this->assertEquals($existingArticle->id, $duplicate->id);
    }

    public function test_detect_no_duplicate_for_different_articles()
    {
        $articleData = [
            'title' => 'Unique Article Title',
            'url' => 'https://unique-url.com',
            'external_id' => 'unique-external-id',
            'published_at' => Carbon::today(),
        ];

        $duplicate = $this->service->detectDuplicate($articleData);

        $this->assertNull($duplicate);
    }

    public function test_categorize_article_technology()
    {
        $articleData = [
            'title' => 'New AI Technology Breakthrough',
            'content' => 'Scientists have developed new artificial intelligence software that can process data faster than ever before.',
            'summary' => 'AI breakthrough in technology sector',
        ];

        $category = $this->service->categorizeArticle($articleData);

        $this->assertEquals('technology', $category);
    }

    public function test_categorize_article_business()
    {
        $articleData = [
            'title' => 'Stock Market Reaches New High',
            'content' => 'The stock market closed at record highs today as investors showed confidence in the economy.',
            'summary' => 'Market performance and business news',
        ];

        $category = $this->service->categorizeArticle($articleData);

        $this->assertEquals('business', $category);
    }

    public function test_categorize_article_defaults_to_general()
    {
        $articleData = [
            'title' => 'Random News Article',
            'content' => 'This is just some random content without specific keywords.',
            'summary' => 'Random summary',
        ];

        $category = $this->service->categorizeArticle($articleData);

        $this->assertEquals('general', $category);
    }

    public function test_sanitize_article_removes_html_tags()
    {
        $articleData = [
            'title' => '<script>alert("xss")</script>Clean Title',
            'content' => '<p>Good content</p><script>bad script</script><strong>Bold text</strong>',
            'summary' => '<em>Italic summary</em><script>another script</script>',
            'url' => 'https://example.com/valid',
            'image_url' => 'https://example.com/image.jpg',
        ];

        $sanitized = $this->service->sanitizeArticle($articleData);

        $this->assertEquals('Clean Title', $sanitized['title']);
        $this->assertStringContainsString('<p>Good content</p>', $sanitized['content']);
        $this->assertStringContainsString('<strong>Bold text</strong>', $sanitized['content']);
        $this->assertStringNotContainsString('<script>', $sanitized['content']);
        $this->assertStringContainsString('<em>Italic summary</em>', $sanitized['summary']);
        $this->assertStringNotContainsString('<script>', $sanitized['summary']);
    }

    public function test_sanitize_article_handles_invalid_urls()
    {
        $articleData = [
            'title' => 'Test Article',
            'url' => 'not-a-valid-url',
            'image_url' => 'also-not-valid',
        ];

        $sanitized = $this->service->sanitizeArticle($articleData);

        $this->assertEquals('', $sanitized['url']);
        $this->assertNull($sanitized['image_url']);
    }

    public function test_store_articles_creates_articles_with_relationships()
    {
        $articlesData = collect([
            [
                'title' => 'Test Article 1',
                'content' => 'Test content 1',
                'summary' => 'Test summary 1',
                'url' => 'https://example.com/1',
                'image_url' => 'https://example.com/image1.jpg',
                'published_at' => Carbon::now(),
                'author' => 'Test Author 1',
                'source_identifier' => 'test-source',
                'source_name' => 'Test Source',
                'category' => 'technology',
                'external_id' => 'test-1',
            ],
            [
                'title' => 'Test Article 2',
                'content' => 'Test content 2',
                'summary' => 'Test summary 2',
                'url' => 'https://example.com/2',
                'image_url' => null,
                'published_at' => Carbon::now(),
                'author' => 'Test Author 2',
                'source_identifier' => 'test-source',
                'source_name' => 'Test Source',
                'category' => 'business',
                'external_id' => 'test-2',
            ],
        ]);

        $storedArticles = $this->service->storeArticles($articlesData);

        $this->assertCount(2, $storedArticles);

        // Check that articles were created in database
        $this->assertDatabaseCount('articles', 2);
        $this->assertDatabaseCount('sources', 1);
        $this->assertDatabaseCount('categories', 2);

        // Check first article
        $firstArticle = $storedArticles->first();
        $this->assertEquals('Test Article 1', $firstArticle->title);
        $this->assertEquals('test-source', $firstArticle->source->name);
        $this->assertEquals('technology', $firstArticle->category->slug);

        // Check second article
        $secondArticle = $storedArticles->last();
        $this->assertEquals('Test Article 2', $secondArticle->title);
        $this->assertEquals('business', $secondArticle->category->slug);
    }

    public function test_aggregate_from_source_with_mocked_service()
    {
        // Mock HTTP responses for NewsAPI
        Http::fake([
            'newsapi.org/*' => Http::response([
                'articles' => [
                    [
                        'title' => 'Test News Article',
                        'description' => 'Test description',
                        'url' => 'https://example.com/news',
                        'urlToImage' => 'https://example.com/image.jpg',
                        'publishedAt' => '2023-01-01T12:00:00Z',
                        'author' => 'Test Author',
                        'source' => ['name' => 'Test Source']
                    ]
                ]
            ], 200)
        ]);

        $articles = $this->service->aggregateFromSource('newsapi', ['limit' => 1]);

        $this->assertCount(1, $articles);
        $article = $articles->first();
        $this->assertEquals('Test News Article', $article['title']);
        $this->assertEquals('newsapi', $article['source_identifier']);
        $this->assertNotEmpty($article['category']); // Should be auto-categorized
    }

    public function test_aggregate_from_all_sources_handles_service_failures()
    {
        // Mock one successful and one failing service
        Http::fake([
            'newsapi.org/*' => Http::response(['articles' => []], 200),
            'content.guardianapis.com/*' => Http::response(['error' => 'API Error'], 500),
            'api.nytimes.com/*' => Http::response(['results' => []], 200),
        ]);

        // Should not throw exception even if one service fails
        $articles = $this->service->aggregateFromAllSources();

        // Should be a collection (might be empty but shouldn't throw)
        $this->assertInstanceOf(\Illuminate\Support\Collection::class, $articles);
    }
}
