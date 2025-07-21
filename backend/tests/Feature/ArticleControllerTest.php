<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\Source;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_paginated_articles()
    {
        // Create test data
        $source = Source::factory()->create();
        $category = Category::factory()->create();
        Article::factory()->count(15)->create([
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        $response = $this->getJson('/api/articles');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'items' => [
                        '*' => [
                            'id',
                            'title',
                            'content',
                            'summary',
                            'url',
                            'image_url',
                            'published_at',
                            'author',
                            'source',
                            'category',
                        ]
                    ],
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
                'meta'
            ])
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_can_search_articles_via_query_parameter()
    {
        // Create test data
        $source = Source::factory()->create();
        $category = Category::factory()->create();

        Article::factory()->create([
            'title' => 'Laravel Tutorial',
            'content' => 'Learn Laravel framework',
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        Article::factory()->create([
            'title' => 'Vue.js Guide',
            'content' => 'Learn Vue.js',
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        $response = $this->getJson('/api/articles?search=Laravel');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'items' => [
                        '*' => [
                            'id',
                            'title',
                            'content',
                            'summary',
                            'url',
                            'image_url',
                            'published_at',
                            'author',
                            'source',
                            'category',
                        ]
                    ],
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
                'meta'
            ])
            ->assertJson([
                'success' => true,
            ]);

        // Verify only Laravel article is returned
        $responseData = $response->json();
        $this->assertEquals(1, $responseData['data']['total']);
        $this->assertStringContainsString('Laravel', $responseData['data']['items'][0]['title']);
    }

    public function test_can_get_single_article()
    {
        $source = Source::factory()->create();
        $category = Category::factory()->create();
        $article = Article::factory()->create([
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        $response = $this->getJson("/api/articles/{$article->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'title',
                    'content',
                    'summary',
                    'url',
                    'image_url',
                    'published_at',
                    'author',
                    'source',
                    'category',
                ],
                'meta'
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $article->id,
                    'title' => $article->title,
                ]
            ]);
    }

    public function test_returns_404_for_nonexistent_article()
    {
        $response = $this->getJson('/api/articles/9999');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Article not found',
            ]);
    }

    public function test_can_save_article()
    {
        $user = $this->authenticateUser();
        $source = Source::factory()->create();
        $category = Category::factory()->create();
        $article = Article::factory()->create([
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        $response = $this->postJson("/api/articles/{$article->id}/save");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Article saved successfully',
                'data' => [
                    'article_id' => $article->id,
                ]
            ]);

        $this->assertDatabaseHas('user_saved_articles', [
            'user_id' => $user->id,
            'article_id' => $article->id,
        ]);
    }

    public function test_cannot_save_same_article_twice()
    {
        $user = $this->authenticateUser();
        $source = Source::factory()->create();
        $category = Category::factory()->create();
        $article = Article::factory()->create([
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        // Save the article first time
        $this->postJson("/api/articles/{$article->id}/save");

        // Try to save again
        $response = $this->postJson("/api/articles/{$article->id}/save");

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'message' => 'Article is already saved',
            ]);
    }

    public function test_can_unsave_article()
    {
        $user = $this->authenticateUser();
        $source = Source::factory()->create();
        $category = Category::factory()->create();
        $article = Article::factory()->create([
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        // Manually save article to database
        $user->savedArticles()->attach($article->id, ['saved_at' => now()]);

        $response = $this->deleteJson("/api/articles/saved/{$article->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Article removed from saved list',
                'data' => [
                    'article_id' => $article->id,
                ]
            ]);

        $this->assertDatabaseMissing('user_saved_articles', [
            'user_id' => $user->id,
            'article_id' => $article->id,
        ]);
    }

    public function test_cannot_unsave_article_not_in_saved_list()
    {
        $user = $this->authenticateUser();
        $source = Source::factory()->create();
        $category = Category::factory()->create();
        $article = Article::factory()->create([
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        $response = $this->deleteJson("/api/articles/saved/{$article->id}");

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Article is not in your saved list',
            ]);
    }

    public function test_can_get_saved_articles()
    {
        $user = $this->authenticateUser();
        $source = Source::factory()->create();
        $category = Category::factory()->create();

        $savedArticle = Article::factory()->create([
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        $regularArticle = Article::factory()->create([
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        // Save one article
        $user->savedArticles()->attach($savedArticle->id, ['saved_at' => now()]);

        $response = $this->getJson('/api/articles?saved=1');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'items' => [
                        '*' => [
                            'id',
                            'title',
                            'content',
                            'summary',
                            'url',
                            'image_url',
                            'published_at',
                            'author',
                            'source',
                            'category',
                        ]
                    ],
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
                'meta'
            ])
            ->assertJson([
                'success' => true,
            ]);

        // Verify only saved article is returned
        $responseData = $response->json();
        $this->assertEquals(1, $responseData['data']['total']);
        $this->assertEquals($savedArticle->id, $responseData['data']['items'][0]['id']);
    }

    public function test_unauthenticated_user_cannot_save_articles()
    {
        $source = Source::factory()->create();
        $category = Category::factory()->create();
        $article = Article::factory()->create([
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        $response = $this->postJson("/api/articles/{$article->id}/save");

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated',
            ]);
    }

    public function test_unauthenticated_user_cannot_unsave_articles()
    {
        $source = Source::factory()->create();
        $category = Category::factory()->create();
        $article = Article::factory()->create([
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        $response = $this->deleteJson("/api/articles/saved/{$article->id}");

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated',
            ]);
    }

    public function test_can_filter_articles_by_source()
    {
        $source1 = Source::factory()->create();
        $source2 = Source::factory()->create();
        $category = Category::factory()->create();

        Article::factory()->create([
            'source_id' => $source1->id,
            'category_id' => $category->id,
        ]);

        Article::factory()->create([
            'source_id' => $source2->id,
            'category_id' => $category->id,
        ]);

        $response = $this->getJson("/api/articles?source_ids[]={$source1->id}");

        $response->assertStatus(200);

        $responseData = $response->json();
        $this->assertEquals(1, $responseData['data']['total']);
        $this->assertEquals($source1->id, $responseData['data']['items'][0]['source']['id']);
    }

    public function test_can_filter_articles_by_category()
    {
        $source = Source::factory()->create();
        $category1 = Category::factory()->create();
        $category2 = Category::factory()->create();

        Article::factory()->create([
            'source_id' => $source->id,
            'category_id' => $category1->id,
        ]);

        Article::factory()->create([
            'source_id' => $source->id,
            'category_id' => $category2->id,
        ]);

        $response = $this->getJson("/api/articles?category_ids[]={$category1->id}");

        $response->assertStatus(200);

        $responseData = $response->json();
        $this->assertEquals(1, $responseData['data']['total']);
        $this->assertEquals($category1->id, $responseData['data']['items'][0]['category']['id']);
    }

    public function test_can_sort_articles()
    {
        $source = Source::factory()->create();
        $category = Category::factory()->create();

        $article1 = Article::factory()->create([
            'title' => 'A First Article',
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        $article2 = Article::factory()->create([
            'title' => 'Z Last Article',
            'source_id' => $source->id,
            'category_id' => $category->id,
        ]);

        // Test ascending sort by title
        $response = $this->getJson('/api/articles?sort_by=title&sort_order=asc');

        $response->assertStatus(200);

        $responseData = $response->json();
        $this->assertEquals($article1->id, $responseData['data']['items'][0]['id']);
        $this->assertEquals($article2->id, $responseData['data']['items'][1]['id']);
    }
}
