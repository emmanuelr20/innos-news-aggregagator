<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\Source;
use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PreferenceControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_user_preferences()
    {
        $user = $this->authenticateUser();
        $source = Source::factory()->create();
        $category = Category::factory()->create();

        // Create preferences using the correct model structure
        $user->preferences()->create([
            'preferred_sources' => [$source->id],
            'preferred_categories' => [$category->id],
            'preferred_authors' => ['John Doe'],
        ]);

        $response = $this->getJson('/api/preferences');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'preferred_sources',
                    'preferred_categories',
                    'preferred_authors'
                ],
                'meta'
            ])
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_can_update_user_preferences()
    {
        $user = $this->authenticateUser();
        $source1 = Source::factory()->create();
        $source2 = Source::factory()->create();
        $category1 = Category::factory()->create();
        $category2 = Category::factory()->create();

        $preferences = [
            'preferred_sources' => [$source1->id, $source2->id],
            'preferred_categories' => [$category1->id, $category2->id],
            'preferred_authors' => ['Jane Doe', 'John Smith'],
        ];

        $response = $this->putJson('/api/preferences', $preferences);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Preferences updated successfully'
            ]);

        // Check if preferences were saved in the database
        $this->assertDatabaseHas('user_preferences', [
            'user_id' => $user->id,
        ]);

        $savedPreferences = $user->fresh()->preferences;
        $this->assertEquals([$source1->id, $source2->id], $savedPreferences->preferred_sources);
        $this->assertEquals([$category1->id, $category2->id], $savedPreferences->preferred_categories);
        $this->assertEquals(['Jane Doe', 'John Smith'], $savedPreferences->preferred_authors);
    }

    public function test_can_clear_existing_preferences_when_updating()
    {
        $user = $this->authenticateUser();
        $source1 = Source::factory()->create();
        $source2 = Source::factory()->create();
        $category1 = Category::factory()->create();

        // Create initial preferences
        $user->preferences()->create([
            'preferred_sources' => [$source1->id],
            'preferred_categories' => [],
            'preferred_authors' => [],
        ]);

        // Update with new preferences
        $preferences = [
            'preferred_sources' => [$source2->id],
            'preferred_categories' => [$category1->id],
            'preferred_authors' => ['New Author'],
        ];

        $response = $this->putJson('/api/preferences', $preferences);

        $response->assertStatus(200);

        // Check preferences were updated
        $savedPreferences = $user->fresh()->preferences;
        $this->assertEquals([$source2->id], $savedPreferences->preferred_sources);
        $this->assertEquals([$category1->id], $savedPreferences->preferred_categories);
        $this->assertEquals(['New Author'], $savedPreferences->preferred_authors);
    }

    public function test_unauthenticated_user_cannot_access_preferences()
    {
        $response = $this->getJson('/api/preferences');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_update_preferences()
    {
        $source = Source::factory()->create();
        $category = Category::factory()->create();

        $preferences = [
            'preferred_sources' => [$source->id],
            'preferred_categories' => [$category->id],
            'preferred_authors' => ['John Doe'],
        ];

        $response = $this->putJson('/api/preferences', $preferences);

        $response->assertStatus(401);
    }

    public function test_can_handle_empty_preferences()
    {
        $user = $this->authenticateUser();

        $preferences = [
            'preferred_sources' => [],
            'preferred_categories' => [],
            'preferred_authors' => [],
        ];

        $response = $this->putJson('/api/preferences', $preferences);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Preferences updated successfully'
            ]);

        // Check preferences were saved as empty arrays
        $savedPreferences = $user->fresh()->preferences;
        $this->assertEquals([], $savedPreferences->preferred_sources);
        $this->assertEquals([], $savedPreferences->preferred_categories);
        $this->assertEquals([], $savedPreferences->preferred_authors);
    }

    public function test_validates_preference_input()
    {
        $user = $this->authenticateUser();

        $preferences = [
            'preferred_sources' => 'invalid',
            'preferred_categories' => 'invalid',
            'preferred_authors' => 'invalid',
        ];

        $response = $this->putJson('/api/preferences', $preferences);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['preferred_sources', 'preferred_categories', 'preferred_authors']);
    }
}
