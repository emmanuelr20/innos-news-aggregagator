<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;
use Laravel\Passport\Client;
use Illuminate\Database\Connection;

class PassportServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Use integer IDs instead of UUIDs when using SQLite
        if (config('database.default') === 'sqlite') {
            Client::creating(function (Client $client) {
                // Use incremental integer IDs for SQLite
                $client->incrementing = true;
                $client->keyType = 'int';
            });
        }
    }
}
