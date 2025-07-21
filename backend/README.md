# News Aggregator Backend API

A robust Laravel-based REST API for a news aggregator application. This backend provides comprehensive user authentication, news article management, personalized feeds, and advanced search capabilities.

## Features

### 🔐 Authentication & User Management

-   **JWT Authentication**: Secure token-based authentication using Laravel Passport
-   **User Registration**: Account creation with validation
-   **User Login**: Secure authentication with token generation
-   **Password Reset**: Complete email-based password reset flow
-   **User Profiles**: Profile management and preferences
-   **Token Refresh**: Automatic token renewal system

### 📰 News Management

-   **Article Storage**: Normalized article data from multiple sources
-   **Search & Filtering**: Full-text search with advanced filters
-   **Categorization**: Article categorization system
-   **Source Management**: Multiple news source integration
-   **Saved Articles**: User bookmarking functionality
-   **Personalized Feeds**: Algorithm-based content recommendation

### 🔌 News API Integration

-   **NewsAPI.org**: General news articles
-   **The Guardian**: UK-focused news content
-   **New York Times**: Premium news content
-   **Extensible Architecture**: Easy addition of new sources

### 🚀 Performance & Scalability

-   **Database Optimization**: Proper indexing and query optimization
-   **Caching**: Redis-based caching for improved performance
-   **Queue System**: Background job processing
-   **Rate Limiting**: API rate limiting and throttling
-   **Error Handling**: Comprehensive error handling and logging

## Tech Stack

-   **Framework**: Laravel 10+
-   **PHP Version**: 8.1+
-   **Database**: PostgreSQL (configurable)
-   **Authentication**: Laravel Passport (OAuth2)
-   **Caching**: Redis
-   **Queue**: Database/Redis queues
-   **Testing**: PHPUnit with Feature/Unit tests
-   **API Documentation**: Built-in API documentation

## Getting Started

### Prerequisites

-   PHP 8.1 or higher
-   Composer
-   PostgreSQL (or MySQL/SQLite)
-   Redis (optional, for caching)
-   Node.js & npm (for frontend integration)

### Installation

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd backend
    ```

2. **Install PHP dependencies**

    ```bash
    composer install
    ```

3. **Environment Configuration**

    Copy the example environment file:

    ```bash
    cp .env.example .env
    ```

4. **Configure Environment Variables**

    Edit `.env` file with your settings:

    ```env
    # Application
    APP_NAME="News Aggregator"
    APP_ENV=local
    APP_DEBUG=true
    APP_URL=http://localhost:8000
    FRONTEND_URL=http://localhost:3000

    # Database
    DB_CONNECTION=pgsql
    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_DATABASE=news_aggregator
    DB_USERNAME=your_username
    DB_PASSWORD=your_password

    # Mail Configuration
    MAIL_MAILER=log
    MAIL_FROM_ADDRESS="noreply@newsaggregator.com"
    MAIL_FROM_NAME="${APP_NAME}"

    # News API Keys
    NEWSAPI_KEY=your_newsapi_key
    GUARDIAN_API_KEY=your_guardian_key
    NYTIMES_API_KEY=your_nytimes_key
    ```

5. **Generate Application Key**

    ```bash
    php artisan key:generate
    ```

6. **Generate Application Key**

    ```bash
    php artisan passport:keys
    ```

7. **Run Database Migrations**

    ```bash
    php artisan migrate
    ```

8. **Install Passport**

    ```bash
    php artisan passport:install
    ```

9. **Seed Database (Optional)**

    ```bash
    php artisan db:seed
    ```

10. **Start the Development Server**
    ```bash
    php artisan serve
    ```

The API will be available at `http://localhost:8000`

## Project Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/        # API Controllers
│   │   ├── Requests/          # Form Request Validation
│   │   └── Middleware/        # Custom Middleware
│   ├── Models/                # Eloquent Models
│   ├── Services/              # Business Logic Services
│   ├── Contracts/             # Service Interfaces
│   └── Notifications/         # Email Notifications
├── database/
│   ├── migrations/            # Database Migrations
│   ├── seeders/              # Database Seeders
│   └── factories/            # Model Factories
├── routes/
│   ├── api.php               # API Routes
│   └── web.php               # Web Routes
├── tests/
│   ├── Feature/              # Feature Tests
│   └── Unit/                 # Unit Tests
└── config/                   # Configuration Files
```

## API Endpoints

### Authentication

```http
POST   /api/auth/register           # User registration
POST   /api/auth/login              # User login
POST   /api/auth/logout             # User logout
POST   /api/auth/refresh            # Token refresh
GET    /api/auth/user               # Get current user
POST   /api/auth/forgot-password    # Request password reset
POST   /api/auth/reset-password     # Reset password with token
```

### Articles

```http
GET    /api/articles                # Get articles (paginated)
GET    /api/articles/search         # Search articles
GET    /api/articles/{id}           # Get single article
POST   /api/articles/{id}/save      # Save article
DELETE /api/articles/saved/{id}     # Unsave article
GET    /api/articles/saved          # Get saved articles
```

### User Preferences

```http
GET    /api/preferences             # Get user preferences
PUT    /api/preferences             # Update preferences
GET    /api/feed                    # Get personalized feed
```

### Metadata

```http
GET    /api/sources                 # Get available sources
GET    /api/categories              # Get available categories
```

## Authentication Flow

### Password Reset Process

1. **Request Reset**

    ```http
    POST /api/auth/forgot-password
    Content-Type: application/json

    {
      "email": "user@example.com"
    }
    ```

2. **Email Notification**

    - User receives email with reset link
    - Link format: `{FRONTEND_URL}/reset-password?token={token}&email={email}`
    - Token expires in 60 minutes (configurable)

3. **Reset Password**

    ```http
    POST /api/auth/reset-password
    Content-Type: application/json

    {
      "token": "reset_token_here",
      "email": "user@example.com",
      "password": "new_password",
      "password_confirmation": "new_password"
    }
    ```

### JWT Token Usage

Include the JWT token in the Authorization header:

```http
Authorization: Bearer {your_jwt_token}
```

## Database Schema

### Core Tables

-   **users**: User accounts and authentication
-   **password_reset_tokens**: Password reset tokens
-   **articles**: News articles from various sources
-   **sources**: News source configuration
-   **categories**: Article categories
-   **user_preferences**: User personalization settings
-   **user_saved_articles**: User bookmarked articles

### Key Relationships

-   User → UserPreferences (1:1)
-   User → SavedArticles (Many:Many)
-   Article → Source (Many:1)
-   Article → Category (Many:1)

## News API Integration

### Supported Sources

1. **NewsAPI.org**

    - General news from multiple sources
    - Requires API key from newsapi.org

2. **The Guardian**

    - UK-focused news content
    - Requires API key from open-platform.theguardian.com

3. **New York Times**
    - Premium news content
    - Requires API key from developer.nytimes.com

### Data Scraping Commands

```bash
# Fetch from all sources
php artisan news:fetch-all

# Fetch from specific source
php artisan news:fetch newsapi
php artisan news:fetch guardian
php artisan news:fetch nytimes

# Schedule automatic fetching
php artisan schedule:run
```

## Environment Configuration

### Required Variables

```env
# Application Settings
APP_NAME="News Aggregator"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=news_aggregator
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Mail Configuration
MAIL_MAILER=log
MAIL_FROM_ADDRESS="noreply@newsaggregator.com"
MAIL_FROM_NAME="${APP_NAME}"

# News API Keys
NEWSAPI_KEY=your_newsapi_key
GUARDIAN_API_KEY=your_guardian_key
NYTIMES_API_KEY=your_nytimes_key

# Cache & Queue (Optional)
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### Production Configuration

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-api-domain.com
FRONTEND_URL=https://your-frontend-domain.com

# Production Mail Settings
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-smtp-username
MAIL_PASSWORD=your-smtp-password
MAIL_ENCRYPTION=tls

# Production Database
DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_PORT=5432
DB_DATABASE=your-production-db
DB_USERNAME=your-db-user
DB_PASSWORD=your-secure-password
```

## Development

### Available Commands

```bash
# Development
php artisan serve              # Start development server
php artisan migrate           # Run database migrations
php artisan db:seed           # Seed database with sample data
php artisan queue:work        # Process background jobs

# News Fetching
php artisan news:fetch-all    # Fetch from all sources
php artisan schedule:run      # Run scheduled tasks

# Testing
php artisan test              # Run all tests
php artisan test --filter=AuthTest  # Run specific tests

# Cache & Optimization
php artisan config:cache      # Cache configuration
php artisan route:cache       # Cache routes
php artisan view:cache        # Cache views
php artisan optimize:clear    # Clear all caches
```

### Testing

The application includes comprehensive test coverage:

```bash
# Run all tests
php artisan test

# Run specific test suites
php artisan test --testsuite=Feature
php artisan test --testsuite=Unit

# Run with coverage
php artisan test --coverage

# Run specific test file
php artisan test tests/Feature/PasswordResetTest.php
```

### Code Quality

-   **PSR-12**: Code follows PSR-12 coding standards
-   **PHPStan**: Static analysis for code quality
-   **PHP CS Fixer**: Automatic code formatting
-   **Larastan**: Laravel-specific static analysis

## Deployment

### Docker Deployment

```dockerfile
FROM php:8.1-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# Install PHP extensions
RUN docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy application files
COPY . .

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data /var/www
RUN chmod -R 755 /var/www/storage

EXPOSE 8000

CMD php artisan serve --host=0.0.0.0 --port=8000
```

### Production Checklist

-   [ ] Set `APP_ENV=production`
-   [ ] Set `APP_DEBUG=false`
-   [ ] Configure production database
-   [ ] Set up SMTP mail configuration
-   [ ] Configure Redis for caching/queues
-   [ ] Set up SSL certificates
-   [ ] Configure proper file permissions
-   [ ] Set up monitoring and logging
-   [ ] Configure backup strategy

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

    - Verify database credentials in `.env`
    - Ensure database server is running
    - Check database exists and user has permissions

2. **Passport Installation Issues**

    - Run `php artisan passport:install --force`
    - Verify `oauth_*` tables exist
    - Check file permissions on storage directory

3. **Mail Configuration**

    - Test with `MAIL_MAILER=log` first
    - Check mail logs in `storage/logs/laravel.log`
    - Verify SMTP credentials for production

4. **API Key Issues**
    - Verify all news API keys are valid
    - Check API rate limits
    - Monitor API usage in logs

### Performance Optimization

-   Enable Redis caching
-   Use database query optimization
-   Implement API response caching
-   Set up queue workers for background jobs
-   Use CDN for static assets

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run tests: `php artisan test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

-   Follow PSR-12 coding standards
-   Write tests for new features
-   Update documentation as needed
-   Use meaningful commit messages
-   Ensure all tests pass before submitting PR

## Security

If you discover a security vulnerability, please send an email to the development team. All security vulnerabilities will be promptly addressed.

### Security Features

-   JWT token authentication
-   Password hashing with bcrypt
-   CSRF protection
-   SQL injection prevention
-   XSS protection
-   Rate limiting
-   Input validation and sanitization

## License

This project is licensed under the MIT License - see the LICENSE file for details.
