<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Article extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'content',
        'summary',
        'url',
        'image_url',
        'published_at',
        'source_id',
        'category_id',
        'author',
        'external_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'published_at' => 'datetime',
    ];

    /**
     * Get the source that owns the article.
     */
    public function source(): BelongsTo
    {
        return $this->belongsTo(Source::class);
    }

    /**
     * Get the category that owns the article.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * The users that have saved this article.
     */
    public function savedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_saved_articles')
            ->withTimestamps()
            ->withPivot('saved_at');
    }

    /**
     * Scope a query to search articles by title and content.
     */
    public function scopeSearch($query, $searchTerm)
    {
        return $query->where(function ($q) use ($searchTerm) {
            $q->where('title', 'LIKE', "%{$searchTerm}%")
                ->orWhere('content', 'LIKE', "%{$searchTerm}%")
                ->orWhere('summary', 'LIKE', "%{$searchTerm}%");
        });
    }

    /**
     * Scope a query to filter by source.
     */
    public function scopeBySource($query, $sourceIds)
    {
        return $query->whereIn('source_id', $sourceIds);
    }

    /**
     * Scope a query to filter by category.
     */
    public function scopeByCategory($query, $categoryIds)
    {
        return $query->whereIn('category_id', $categoryIds);
    }

    /**
     * Scope a query to filter by authors.
     */
    public function scopeByAuthor($query, $authors)
    {
        return $query->whereIn('author', $authors);
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('published_at', [$startDate, $endDate]);
    }

    /**
     * Scope a query to filter by saved status.
     */
    public function scopeIsSaved($query, $userId)
    {
        if (!$userId) {
            return $query;
        }

        return $query->selectRaw(
            'articles.*, EXISTS (
                SELECT 1 FROM user_saved_articles 
                WHERE user_saved_articles.article_id = articles.id 
                AND user_saved_articles.user_id = ?) as is_saved',
            [$userId]
        );
    }
}
