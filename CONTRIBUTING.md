# Contributing to U-Dig It Rentals Platform

Thank you for your interest in contributing to the U-Dig It Rentals platform! This document provides comprehensive guidelines and information for contributors to help maintain code quality and ensure smooth collaboration.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:
1. Check if the issue already exists
2. Use the appropriate issue template
3. Provide detailed information about the problem
4. Include steps to reproduce if applicable

### Feature Requests

We welcome feature requests! Please:
1. Check existing feature requests first
2. Use the feature request template
3. Provide clear description of the feature
4. Explain the use case and benefits

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Write tests** for new functionality
5. **Run tests** to ensure everything works
6. **Commit your changes** with clear messages
7. **Push to your fork**
8. **Create a Pull Request**

## 🛠️ Development Setup

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **pnpm 9+** (package manager)
- **Docker & Docker Compose** (for containerized development)
- **PostgreSQL 15+** (if running locally)
- **Redis 7+** (if running locally)
- **Git** (version control)

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/kubota-rental-platform.git
   cd kubota-rental-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   # Edit the files with your configuration
   ```

4. **Start the development environment**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d

   # Or start individually
   pnpm run dev:backend  # Terminal 1
   pnpm run dev:frontend # Terminal 2
   ```

## 📝 Code Style Guidelines

### TypeScript
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper type annotations and avoid `any`
- Implement proper error handling with typed errors
- Use JSDoc comments for complex functions

### React/Next.js
- Use functional components with hooks
- Follow the App Router patterns and conventions
- Use TypeScript for all components and pages
- Implement proper error boundaries and loading states
- Follow React best practices for performance

### NestJS
- Follow module-based architecture
- Use dependency injection properly
- Implement proper validation with class-validator
- Use TypeORM decorators correctly
- Add comprehensive JSDoc documentation

### Styling
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and typography
- Ensure accessibility compliance (WCAG 2.1 AA)
- Use design system tokens consistently

### Database
- Use proper migrations for schema changes
- Implement proper indexing for performance
- Use transactions for data consistency
- Follow naming conventions for tables and columns

## 🔄 Development Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### Commit Messages
Follow the conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes

**Examples**:
```
feat(booking): add real-time availability checking
fix(auth): resolve JWT token expiration issue
docs(api): update authentication endpoints
```

### Pull Request Process

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**:
   - Write code following style guidelines
   - Add tests for new functionality
   - Update documentation if needed
   - Ensure all tests pass

3. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat(component): add new booking flow"
   ```

4. **Push and Create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **PR Review Process**:
   - Ensure CI checks pass
   - Address reviewer feedback
   - Update documentation if needed
   - Squash commits if requested

### Code Review Guidelines

**As a Reviewer**:
- Check code quality and style
- Verify tests are comprehensive
- Ensure documentation is updated
- Test the changes locally if needed
- Provide constructive feedback

**As an Author**:
- Respond to feedback promptly
- Make requested changes
- Ask questions if unclear
- Update PR description if needed

## 🧪 Testing Guidelines

### Unit Tests
- Write tests for all business logic
- Use Jest for testing framework
- Aim for 80%+ code coverage
- Test edge cases and error conditions

### Integration Tests
- Test API endpoints thoroughly
- Test database interactions
- Use test database for backend tests
- Mock external services

### E2E Tests
- Test critical user journeys
- Use Playwright for browser testing
- Test on multiple devices/browsers
- Include accessibility testing

### Running Tests
```bash
# All tests
pnpm run test

# Frontend tests
cd frontend && pnpm run test

# Backend tests
cd backend && pnpm run test

# E2E tests
cd frontend && pnpm run test:e2e

# Test coverage
pnpm run test:coverage
```

## 📋 Pull Request Guidelines

### Before Submitting
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Proper error handling

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 🏗️ Project Architecture

### Frontend Structure
```
frontend/src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   ├── ui/             # Base UI components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── lib/                # Utility functions and configs
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

### Backend Structure
```
backend/src/
├── modules/            # Feature modules
│   ├── auth/          # Authentication module
│   ├── equipment/     # Equipment management
│   ├── bookings/      # Booking system
│   └── payments/      # Payment processing
├── entities/           # Database entities
├── guards/            # Authentication guards
├── decorators/        # Custom decorators
├── dto/               # Data transfer objects
└── common/            # Shared utilities
```

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are documented and available in:
- Development: `.env.local` (frontend) and `.env` (backend)
- Staging: Environment-specific configuration
- Production: Secure environment variable management

### Database Migrations
- Always create migrations for schema changes
- Test migrations on staging environment
- Include rollback procedures
- Document breaking changes

## 📚 Documentation

### Code Documentation
- Use JSDoc comments for functions and classes
- Document complex business logic
- Include examples for reusable components
- Maintain API documentation

### README Updates
- Keep installation instructions current
- Update feature lists as they're added
- Include troubleshooting section
- Document configuration options

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - OS and version
   - Node.js version
   - Browser and version (for frontend issues)

2. **Steps to Reproduce**
   - Clear, numbered steps
   - Expected behavior
   - Actual behavior

3. **Additional Context**
   - Screenshots or videos
   - Error messages or logs
   - Related issues or PRs

## 💡 Feature Requests

For feature requests, please include:

1. **Problem Description**
   - What problem does this solve?
   - Who would benefit from this feature?

2. **Proposed Solution**
   - How should this feature work?
   - Any specific requirements?

3. **Alternatives Considered**
   - What other solutions were considered?
   - Why is this the best approach?

## 📞 Getting Help

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Use GitHub Issues for bugs and feature requests
- **Email**: Contact the maintainers for sensitive issues

## 🎯 Roadmap

Current priorities:
- [ ] Enhanced booking system
- [ ] Advanced admin tools
- [ ] Mobile app development
- [ ] Analytics and reporting
- [ ] Third-party integrations

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the Kubota Rental Platform! 🚀
