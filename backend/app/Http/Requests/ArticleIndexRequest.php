<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ArticleIndexRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            'source_ids' => 'array',
            'source_ids.*' => 'integer|exists:sources,id',
            'category_ids' => 'array',
            'category_ids.*' => 'integer|exists:categories,id',
            'authors' => 'array',
            'authors.*' => 'string|max:255',
            'start_date' => 'date',
            'end_date' => 'date|after_or_equal:start_date',
            'search' => 'string|max:255',
            'sort_by' => 'string|in:created_at,published_at,title',
            'sort_order' => 'string|in:asc,desc',
            'saved' => 'boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'page.integer' => 'Page must be an integer',
            'page.min' => 'Page must be at least 1',
            'per_page.integer' => 'Per page must be an integer',
            'per_page.min' => 'Per page must be at least 1',
            'per_page.max' => 'Per page cannot exceed 100',
            'source_ids.array' => 'Source IDs must be an array',
            'source_ids.*.integer' => 'Each source ID must be an integer',
            'source_ids.*.exists' => 'One or more source IDs do not exist',
            'category_ids.array' => 'Category IDs must be an array',
            'category_ids.*.integer' => 'Each category ID must be an integer',
            'category_ids.*.exists' => 'One or more category IDs do not exist',
            'authors.array' => 'Authors must be an array',
            'authors.*.string' => 'Each author name must be a string',
            'authors.*.max' => 'Each author name cannot exceed 255 characters',
            'start_date.date' => 'Start date must be a valid date',
            'end_date.date' => 'End date must be a valid date',
            'end_date.after_or_equal' => 'End date must be on or after the start date',
            'search.string' => 'Search must be a string',
            'search.max' => 'Search cannot exceed 255 characters',
            'sort_by.in' => 'Sort by must be one of: created_at, published_at, title',
            'sort_order.in' => 'Sort order must be either asc or desc',
            'saved.boolean' => 'Saved must be a boolean value',
        ];
    }
}
