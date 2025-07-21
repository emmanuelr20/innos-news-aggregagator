<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\ProcessNewsAggregation;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// // Schedule news:aggregate --store command to run daily at midnight
// Schedule::command('news:aggregate --store')
//     ->daily()
//     ->at('00:00')
//     ->name('daily-news-aggregate-store')
//     ->withoutOverlapping()
//     ->onOneServer();

Schedule::job(new ProcessNewsAggregation(['limit' => 100], 'newsapi'))
    ->daily()
    ->at('00:00')
    ->at(10)
    ->name('aggregate-news-newsapi')
    ->withoutOverlapping();

Schedule::job(new ProcessNewsAggregation(['limit' => 100], 'guardian'))
    ->daily()
    ->at('00:00')
    ->at(20)
    ->name('aggregate-news-guardian')
    ->withoutOverlapping();

Schedule::job(new ProcessNewsAggregation(['limit' => 100], 'nytimes'))
    ->daily()
    ->at('00:00')
    ->at(30)
    ->name('aggregate-news-nytimes')
    ->withoutOverlapping();
