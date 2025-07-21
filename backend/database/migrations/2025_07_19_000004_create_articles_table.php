<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration combines the original create_articles_table and
     * add_external_id_to_articles_table migrations.
     */
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title', 500);
            $table->text('content')->nullable();
            $table->text('summary')->nullable();
            $table->string('url', 1000)->unique();
            $table->string('image_url', 1000)->nullable();
            $table->timestamp('published_at');
            $table->foreignId('source_id')->constrained('sources')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->string('author')->nullable();
            $table->string('external_id')->nullable()->unique();
            $table->timestamps();

            // Indexes for performance
            $table->index('published_at');
            $table->index(['source_id', 'category_id']);
            $table->index('title');
            $table->index('author');
            $table->index('external_id');
        });

        // Add full-text search index - SQLite compatible
        if (config('database.default') === 'pgsql') {
            // PostgreSQL full-text search index
            DB::statement("CREATE INDEX idx_articles_search ON articles USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')))");
        }
        // Skip creating the SQLite full-text index as it's causing issues
        // SQLite has different syntax for full-text search that requires FTS tables
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
