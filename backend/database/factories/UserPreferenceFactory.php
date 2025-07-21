<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Source;
use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserPreference>
 */
class UserPreferenceFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = UserPreference::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'preferred_sources' => [],
            'preferred_categories' => [],
            'preferred_authors' => [],
        ];
    }

    /**
     * Indicate that the user has some preferences.
     */
    public function withPreferences(): static
    {
        // Get some random sources and categories
        $sources = Source::inRandomOrder()->limit(2)->pluck('id')->toArray();
        $categories = Category::inRandomOrder()->limit(2)->pluck('id')->toArray();

        // Generate some random topics
        $authors = [
            'John Doe',
            'Jane Smith',
            'Michael Johnson',
            'Sarah Wilson',
            'David Brown',
            'Emily Davis',
            'Chris Anderson',
            'Lisa Taylor',
        ];

        $randomAuthors = $this->faker->randomElements($authors, $this->faker->numberBetween(1, 4));

        return $this->state(fn(array $attributes) => [
            'preferred_sources' => $sources,
            'preferred_categories' => $categories,
            'preferred_authors' => $randomAuthors,
        ]);
    }

    /**
     * Indicate that the user has specific topic preferences.
     */
    public function withTopics(array $authors): static
    {
        return $this->state(fn(array $attributes) => [
            'preferred_authors' => $authors,
        ]);
    }
}
