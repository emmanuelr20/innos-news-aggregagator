# Development Environment Setup

This project uses Docker Compose to run the Laravel backend with PostgreSQL in development mode.

## Prerequisites

- Docker
- Docker Compose

## Getting Started

1. Clone this repository
2. Navigate to the project directory
3. Copy the environment file and configure it:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your API keys and any custom configuration

### Starting the Development Environment

```bash
# Start all services
docker-compose up -d

# To see logs
docker-compose logs -f
```

### Initial Setup (Required)

After starting the services for the first time, you need to set up the database and authentication:

```bash
# Enter the backend container
docker-compose exec backend bash

# Creat passport keys
php artisan passport:keys

# Run database migrations
php artisan migrate

# Create Passport client for API authentication (REQUIRED)
php artisan passport:client --personal

# To fetch news data
php artisan news:aggregate --limit=100 --store
```

**Important**: The Passport client creation is required for API authentication to work properly. Make sure to run this command after your first startup.

### Accessing the Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **PostgreSQL**: localhost:5432
  - Database: backend
  - Username: postgres
  - Password: postgres
- **MailHog**: http://localhost:8025 (web interface for email testing)
- **Queue Worker**: Running in background (processes Laravel jobs)
- **Scheduler**: Running in background (executes scheduled tasks)

### Stopping the Development Environment

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (will delete database data)
docker-compose down -v
```

## Environment Configuration

All environment variables are centralized in the `.env` file at the root of the project. This file is used by Docker Compose to configure all services.

### Key Environment Variables

#### Frontend Configuration

- `FRONTEND_PORT`: Port to expose the frontend (default: 3000)
- `NEXT_PUBLIC_API_BASE_URL`: URL for API requests (default: http://localhost:8000/api)
- `NEXT_PUBLIC_APP_NAME`: Application name (default: News Aggregator)

#### Backend Configuration

- `BACKEND_PORT`: Port to expose the backend (default: 8000)
- `APP_KEY`: Laravel application key
- `APP_DEBUG`: Enable debug mode (default: true)

#### Database Configuration

- `DB_CONNECTION`: Database type (default: pgsql)
- `DB_HOST`: Database host (default: postgres)
- `DB_PORT`: Database port (default: 5432)
- `DB_DATABASE`: Database name (default: backend)
- `DB_USERNAME`: Database username (default: postgres)
- `DB_PASSWORD`: Database password (default: postgres)

#### Queue Configuration

- `QUEUE_CONNECTION`: Queue driver (default: database)
- `QUEUE_WORKER_TRIES`: Number of times to attempt a job (default: 3)
- `QUEUE_WORKER_TIMEOUT`: Job timeout in seconds (default: 90)

#### Mail Configuration

- `MAIL_MAILER`: Mail driver (default: smtp)
- `MAIL_HOST`: Mail server host (default: mailhog)
- `MAIL_PORT`: Mail server port (default: 1025)
- `MAIL_FROM_ADDRESS`: Default from address for emails
- `MAILHOG_WEB_PORT`: Port for MailHog web interface (default: 8025)

#### API Keys (Required for functionality)

- `NEWSAPI_KEY`: News API key
- `GUARDIAN_API_KEY`: Guardian API key
- `NYTIMES_API_KEY`: New York Times API key

See the `.env.example` file for a complete list of available configuration options.

## Background Services

### Queue Worker

The queue worker service processes Laravel jobs from the database queue. It runs with the following configuration:

- Retry failed jobs up to 3 times
- Job timeout of 90 seconds

### Scheduler

The scheduler service runs Laravel's scheduled tasks every minute. This handles any tasks that have been scheduled using Laravel's task scheduling feature.

To add scheduled tasks, modify the `app/Console/Kernel.php` file in the Laravel backend.
