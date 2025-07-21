# News Aggregator Frontend

A modern, responsive news aggregator frontend built with Next.js, TypeScript, and Tailwind CSS. This application provides users with a personalized news reading experience, featuring authentication, article search, filtering, and saved articles functionality.

## Features

### 🔐 Authentication System

- **User Registration**: Create new accounts with email verification
- **User Login**: Secure authentication with JWT tokens
- **Password Reset**: Complete password reset flow with email notifications
- **User Profile**: Manage account settings and preferences
- **Protected Routes**: Automatic redirection for authenticated/unauthenticated users

### 📰 News Management

- **Article Feed**: Personalized news feed based on user preferences
- **Search & Filter**: Advanced search with multiple filter options
- **Article Details**: Full article view with source attribution
- **Save Articles**: Bookmark articles for later reading
- **Categories**: Browse articles by category (Technology, Sports, Politics, etc.)
- **Sources**: Filter articles by news source

### 🎨 User Experience

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Loading States**: Skeleton loaders and loading indicators
- **Error Handling**: User-friendly error messages and recovery
- **Toast Notifications**: Real-time feedback for user actions
- **Accessibility**: WCAG compliant with proper ARIA labels

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Form Handling**: Custom form validation hooks
- **HTTP Client**: Custom API client with error handling
- **Icons**: React Icons
- **Development**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Backend API server running (see backend README)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Configuration**

   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
   NEXT_PUBLIC_API_TIMEOUT=30000
   NEXT_PUBLIC_APP_NAME="News Aggregator"
   NEXT_PUBLIC_APP_VERSION="1.0.0"
   ```

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   │   ├── login/         # Login page
│   │   │   ├── register/      # Registration page
│   │   │   ├── forgot-password/ # Password reset request
│   │   │   └── reset-password/  # Password reset form
│   │   ├── articles/          # Article pages
│   │   ├── feed/              # Personalized feed
│   │   ├── profile/           # User profile
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   ├── forms/             # Form components
│   │   ├── layout/            # Layout components
│   │   └── ui/                # UI components
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities and API client
│   ├── types/                 # TypeScript type definitions
│   └── constants/             # App constants
├── public/                    # Static assets
└── package.json
```

## Authentication Flow

### Password Reset Process

1. **Request Reset**: User enters email on `/forgot-password`
2. **Email Sent**: Backend sends email with reset link
3. **Reset Link**: Link format: `/reset-password?token=xxx&email=xxx`
4. **New Password**: User sets new password on reset page
5. **Success**: User can login with new credentials

### Protected Routes

The application automatically handles route protection:

- **Public Routes**: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`
- **Protected Routes**: `/feed`, `/profile`, `/articles/saved`
- **Automatic Redirects**: Unauthenticated users redirected to login

## API Integration

### API Client Features

- **Automatic Authentication**: JWT token handling
- **Error Handling**: Centralized error processing
- **Request/Response Interceptors**: Token refresh and error recovery
- **TypeScript Support**: Fully typed API responses
- **Timeout Handling**: Configurable request timeouts

### Available Endpoints

```typescript
// Authentication
apiClient.auth.login(credentials);
apiClient.auth.register(userData);
apiClient.auth.forgotPassword(email);
apiClient.auth.resetPassword(token, email, password, confirmation);
apiClient.auth.logout();

// Articles
apiClient.articles.getArticles(params);
apiClient.articles.searchArticles(query, filters);
apiClient.articles.saveArticle(id);
apiClient.articles.getSavedArticles();

// User
apiClient.preferences.getPreferences();
apiClient.preferences.updatePreferences(data);
```

## Environment Variables

### Required Variables

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_API_TIMEOUT=30000

# App Configuration
NEXT_PUBLIC_APP_NAME="News Aggregator"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Optional Features
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=false
```

### Production Configuration

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api
NEXT_PUBLIC_APP_NAME="Your News App"
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
```

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # TypeScript type checking
```

### Code Quality

- **ESLint**: Configured with Next.js and TypeScript rules
- **Prettier**: Code formatting (auto-format on save recommended)
- **TypeScript**: Strict mode enabled for type safety
- **Husky**: Pre-commit hooks for code quality

### Testing

```bash
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link your GitHub/GitLab repository
2. **Environment Variables**: Add production environment variables
3. **Deploy**: Automatic deployment on push to main branch

### Docker Deployment

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

### Build Command

```bash
docker build -t news-aggregator-frontend .
docker run -p 3000:3000 news-aggregator-frontend
```

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify `NEXT_PUBLIC_API_BASE_URL` is correct
   - Ensure backend server is running
   - Check CORS configuration on backend

2. **Authentication Issues**
   - Clear browser localStorage/cookies
   - Verify JWT token format
   - Check token expiration

3. **Build Errors**
   - Run `npm run type-check` for TypeScript errors
   - Clear `.next` folder and rebuild
   - Verify all environment variables are set

### Performance Optimization

- **Image Optimization**: Use Next.js Image component
- **Code Splitting**: Automatic with Next.js App Router
- **Bundle Analysis**: Run `npm run analyze` to check bundle size
- **Caching**: Configure appropriate cache headers

## Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use semantic commit messages
- Add tests for new features
- Update documentation as needed
- Ensure accessibility compliance

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section
