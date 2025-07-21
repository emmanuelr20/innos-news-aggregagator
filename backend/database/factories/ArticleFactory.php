<?php

namespace Database\Factories;

use App\Models\Article;
use App\Models\Source;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Article>
 */
class ArticleFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Article::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(6),
            'content' => $this->faker->paragraphs(3, true),
            'summary' => $this->faker->paragraph(),
            'url' => $this->faker->unique()->url(),
            'image_url' => $this->faker->optional()->imageUrl(640, 480, 'news'),
            'published_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'author' => $this->faker->optional()->name(),
            'external_id' => $this->faker->unique()->uuid(),
            'source_id' => Source::factory(),
            'category_id' => Category::factory(),
        ];
    }

    /**
     * Indicate that the article has no image.
     */
    public function withoutImage(): static
    {
        return $this->state(fn(array $attributes) => [
            'image_url' => null,
        ]);
    }

    /**
     * Indicate that the article has no author.
     */
    public function withoutAuthor(): static
    {
        return $this->state(fn(array $attributes) => [
            'author' => null,
        ]);
    }
}
