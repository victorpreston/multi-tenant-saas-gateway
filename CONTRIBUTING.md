# Contributing to Multi-Tenant SaaS Gateway

Thank you for contributing! This document outlines the contribution process.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the issue, not the person

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone <your-fork-url>`
3. **Create** a feature branch: `git checkout -b feat/your-feature`
4. **Install** dependencies: `npm install`
5. **Setup** hooks: `npm run prepare`

## Development Workflow

### Before Coding

```bash
# Update from main
git fetch origin
git rebase origin/main

# Create feature branch
git checkout -b feat/your-feature
```

### While Coding

```bash
# Format code
npm run format

# Check linting
npm run lint:check

# Run tests
npm run test

# Watch mode (helpful during development)
npm run test:watch
```

### Before Committing

```bash
# Check formatting
npm run format:check

# Check linting
npm run lint:check

# Run all tests
npm run test:cov

# Format everything
npm run format
npm run lint
```

### Making Commits

Use the interactive commit prompt:

```bash
npm run commit
```

Follow the prompts:
1. Select commit type (feat, fix, docs, etc.)
2. Enter scope (optional): `auth`, `database`, `cache`, etc.
3. Write short subject (imperative mood, lowercase)
4. Add longer description (optional)
5. Mention issues (optional): `fixes #123`

**Examples:**

```
feat(auth): add JWT token refresh endpoint
fix(rate-limit): correct per-tenant calculation
docs(readme): update environment variables
refactor(cache): improve Redis connection pooling
test(gateway): add middleware integration tests
```

### Pushing Code

```bash
# Push to your fork
git push origin feat/your-feature

# Create Pull Request on GitHub
```

## Pull Request Guidelines

### PR Title

Use the same format as commits:
```
feat(scope): description
fix(scope): description
```

### PR Description

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123
Related to #456

## Testing
- [ ] Added unit tests
- [ ] Added integration tests
- [ ] All tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Added comments for complex logic
- [ ] Updated documentation
- [ ] No new warnings generated
- [ ] Tests pass locally
```

## Code Standards

### TypeScript

```typescript
// Use interfaces for type definitions
interface User {
  id: string;
  email: string;
  name: string;
}

// Use type annotations
function getUserById(id: string): User | null {
  // implementation
}

// Use async/await (not .then())
async function fetchData(): Promise<void> {
  try {
    const data = await service.getData();
  } catch (error) {
    logger.error('Failed to fetch data', error);
  }
}

// Use descriptive variable names
const userEmailVerified = true;

// Comment complex logic
// Calculate rolling 7-day average to smooth metrics
const average = values.slice(-7).reduce((a, b) => a + b) / 7;
```

### NestJS

```typescript
// Use dependency injection
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
  ) {}
}

// Use DTOs for request/response validation
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// Use guards for authorization
@UseGuards(AuthGuard, RolesGuard)
@Post()
create(@Body() dto: CreateUserDto): Promise<User> {
  return this.userService.create(dto);
}

// Use interceptors for cross-cutting concerns
@UseInterceptors(LoggingInterceptor)
@Get()
findAll(): Promise<User[]> {
  return this.userService.findAll();
}
```

### Testing

```typescript
// Use descriptive test names
describe('UserService', () => {
  it('should create user with valid email', async () => {
    // Arrange
    const dto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    // Act
    const user = await service.create(dto);

    // Assert
    expect(user.email).toBe('test@example.com');
  });

  it('should throw error with invalid email', async () => {
    const dto: CreateUserDto = {
      email: 'invalid-email',
      password: 'password123',
    };

    await expect(service.create(dto)).rejects.toThrow();
  });
});
```

### SQL

```sql
-- Use meaningful table and column names
-- Use UPPERCASE for keywords
-- Use lowercase for identifiers
-- Add comments for complex queries

-- Get user with roles
SELECT
  u.id,
  u.email,
  ARRAY_AGG(r.name) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id
ORDER BY u.created_at DESC;
```

## Commit Message Format

### Type

Required, must be one of:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only
- `style`: Code style (no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Test additions/changes
- `chore`: Build/tooling changes
- `ci`: CI/CD changes
- `revert`: Revert a commit

### Scope

Optional, in parentheses after type:
- `auth`: Authentication module
- `gateway`: Gateway layer
- `database`: Database/migrations
- `cache`: Redis/caching
- `kafka`: Event streaming
- `monitoring`: Prometheus/Grafana
- `docker`: Docker/compose setup

### Subject

- Imperative mood ("add" not "added")
- Lowercase first letter
- No period at end
- Max 50 characters

### Body

- Explain *what* and *why*, not *how*
- Wrap at 72 characters
- Separate from subject with blank line
- Use bullet points for multiple items

### Footer

- Reference issues: `Fixes #123`
- Break changes: `BREAKING CHANGE: description`

### Examples

```
feat(auth): add two-factor authentication support

Add TOTP-based 2FA implementation with:
- User enrollment flow
- Verification during login
- Recovery codes backup

Fixes #456
```

```
fix(rate-limit): use tenant context from request

The rate limiter was using global context instead of
extracting tenant ID from request headers, causing
incorrect per-tenant limits.

Fixes #789
```

## Testing Requirements

### Unit Tests

- Test individual functions/methods
- Mock external dependencies
- Aim for >80% coverage
- Run: `npm run test`

### Integration Tests

- Test module interactions
- Use test database
- Test real connections (Redis, etc.)
- Run: `npm run test:e2e`

### Coverage

```bash
npm run test:cov
# View coverage report
open coverage/index.html
```

## Documentation

### Code Comments

```typescript
// Good: Explains why, not what
// Rate limit is per-tenant to prevent one customer
// from affecting others' performance
const rateLimit = getTenantRateLimit(tenantId);

// Bad: Explains obvious code
// Get the user
const user = getUser(id);
```

### API Documentation

```typescript
/**
 * Create a new user in the system
 *
 * @param dto - User creation data
 * @param tenantId - Tenant context
 * @returns Created user object
 * @throws {ConflictException} Email already exists
 * @throws {BadRequestException} Invalid input data
 *
 * @example
 * ```typescript
 * const user = await userService.create(
 *   { email: 'user@example.com', password: '...' },
 *   'tenant-123'
 * );
 * ```
 */
async create(dto: CreateUserDto, tenantId: string): Promise<User> {
  // implementation
}
```

### README Updates

- Update README.md if adding new features
- Add troubleshooting section if applicable
- Update API documentation

## Performance Considerations

### Database

- Use indexes for frequently queried columns
- Optimize queries with EXPLAIN ANALYZE
- Use pagination for large result sets
- Batch operations when possible

### Caching

- Cache frequently accessed data in Redis
- Set appropriate TTLs
- Invalidate cache on updates
- Use cache-aside pattern

### API

- Use pagination (default: 20 items)
- Filter and search efficiently
- Use field selection (GraphQL-like)
- Implement rate limiting per tenant

## Security

### Secrets Management

- Never commit `.env` files
- Use `.env.example` for documentation
- Rotate secrets regularly
- Use strong JWT secrets

### Input Validation

```typescript
// Validate all inputs
@Post()
create(@Body() dto: CreateUserDto): Promise<User> {
  return this.userService.create(dto);
}

// Use DTOs with class-validator
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Password must contain letters and numbers',
  })
  password: string;
}
```

### Authorization

- Always check tenant context
- Implement RBAC properly
- Use guards for protected routes
- Log security events

## Changelog

Maintain [CHANGELOG.md](CHANGELOG.md) with:

```markdown
## [1.0.0] - 2024-01-09

### Added
- New feature X
- New feature Y

### Fixed
- Bug X
- Bug Y

### Changed
- Breaking change description

### Deprecated
- Feature to be removed in v2.0.0
```

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
4. Push tag: `git push origin v1.0.0`
5. Build and push Docker image
6. Deploy to production

## Getting Help

- Check [DEVELOPMENT.md](DEVELOPMENT.md)
- Review existing issues and PRs
- Ask in pull request comments
- Create discussion in GitHub Discussions

## Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- GitHub contributors page

Thank you for contributing! 🎉
