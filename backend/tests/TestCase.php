<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Client;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a personal access client for Passport if needed
        $this->createPersonalAccessClientIfNeeded();
    }

    /**
     * Create a personal access client for Passport if needed
     */
    protected function createPersonalAccessClientIfNeeded()
    {
        try {
            // Only create if we have the oauth tables and they're empty
            if (
                DB::getSchemaBuilder()->hasTable('oauth_clients') &&
                DB::getSchemaBuilder()->hasTable('oauth_personal_access_clients')
            ) {

                if (DB::table('oauth_personal_access_clients')->count() === 0) {
                    $client = Client::create([
                        'name' => 'Laravel Personal Access Client',
                        'secret' => 'test-secret',
                        'provider' => 'users',
                        'redirect_uris' => ['http://localhost'],
                        'grant_types' => ['personal_access'],
                        'revoked' => false,
                        'owner_type' => null,
                        'owner_id' => null,
                    ]);

                    DB::table('oauth_personal_access_clients')->insert([
                        'client_id' => $client->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        } catch (\Exception $e) {
            // Silently fail if OAuth tables don't exist or there's an issue
            // This allows tests to run without OAuth dependency
        }
    }

    /**
     * Create an authenticated user for testing
     */
    protected function authenticateUser($user = null)
    {
        if (!$user) {
            $user = \App\Models\User::factory()->create();
        }

        // Use API guard for authentication
        $this->actingAs($user, 'api');

        return $user;
    }
}
