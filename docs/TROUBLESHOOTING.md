# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the U-Dig It Rentals platform.

## Table of Contents

- [Quick Fixes](#quick-fixes)
- [Development Environment Issues](#development-environment-issues)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Database Issues](#database-issues)
- [API Issues](#api-issues)
- [Frontend Issues](#frontend-issues)
- [Performance Issues](#performance-issues)
- [Getting Help](#getting-help)

## Quick Fixes

### Most Common Solutions

1. **Clear all caches and reinstall**:
   ```bash
   pnpm run clean
   rm -rf node_modules .next dist
   pnpm install
   ```

2. **Restart Docker services**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Reset database**:
   ```bash
   pnpm run db:migrate:revert
   pnpm run db:migrate
   pnpm run db:seed
   ```

## Development Environment Issues

### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm run dev:frontend
```

**For port 3001 (backend)**:
```bash
lsof -ti:3001 | xargs kill -9
```

### Node.js Version Issues

**Error**: `The engine "node" is incompatible with this module`

**Solution**:
```bash
# Check Node.js version
node --version

# Install correct version (use nvm)
nvm install 20
nvm use 20

# Or update to latest LTS
nvm install --lts
nvm use --lts
```

### pnpm Installation Issues

**Error**: `pnpm: command not found`

**Solution**:
```bash
# Install pnpm globally
npm install -g pnpm

# Or use npx
npx pnpm install
```

### Environment Variables Missing

**Error**: `Environment variable not found`

**Solution**:
1. Copy environment files:
   ```bash
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   ```

2. Fill in required variables (see README.md for complete list)

3. Restart the development server

### Docker Issues

**Error**: `Cannot connect to the Docker daemon`

**Solution**:
```bash
# Start Docker Desktop
# Or restart Docker service
sudo systemctl restart docker

# Check Docker status
docker --version
docker-compose --version
```

**Error**: `Container not found`

**Solution**:
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Build and Deployment Issues

### TypeScript Errors

**Error**: `Type error: Property 'x' does not exist on type 'y'`

**Solution**:
```bash
# Check TypeScript errors
pnpm run type-check

# Fix common issues
pnpm run lint:fix

# Update types if needed
pnpm update @types/*
```

### Build Failures

**Error**: `Build failed with exit code 1`

**Solution**:
```bash
# Clean build artifacts
rm -rf .next dist node_modules/.cache

# Reinstall dependencies
pnpm install

# Try building again
pnpm run build
```

### Vercel Deployment Issues

**Error**: `Build failed on Vercel`

**Solution**:
1. Check build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Check Node.js version in `package.json`
4. Verify build command: `pnpm run build`

### Railway Deployment Issues

**Error**: `Deployment failed on Railway`

**Solution**:
1. Check Railway logs
2. Verify environment variables
3. Ensure build command: `pnpm install && pnpm run build`
4. Check start command: `pnpm run start:prod`

## Database Issues

### Connection Refused

**Error**: `Connection refused: connect`

**Solution**:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Start PostgreSQL
docker-compose up -d postgres

# Check connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Migration Errors

**Error**: `Migration failed`

**Solution**:
```bash
# Check migration status
pnpm run db:migrate:status

# Revert last migration
pnpm run db:migrate:revert

# Run migrations again
pnpm run db:migrate
```

### Data Corruption

**Error**: `Database is in an inconsistent state`

**Solution**:
```bash
# Backup data first
pg_dump $DATABASE_URL > backup.sql

# Reset database
pnpm run db:migrate:revert
pnpm run db:migrate
pnpm run db:seed

# Restore data if needed
psql $DATABASE_URL < backup.sql
```

### Redis Connection Issues

**Error**: `Redis connection failed`

**Solution**:
```bash
# Check Redis status
docker-compose ps redis

# Start Redis
docker-compose up -d redis

# Test connection
redis-cli ping
```

## API Issues

### Authentication Errors

**Error**: `401 Unauthorized`

**Solution**:
1. Check if JWT token is valid
2. Verify token in Authorization header
3. Refresh token if expired
4. Check JWT_SECRET environment variable

**Error**: `403 Forbidden`

**Solution**:
1. Check user permissions
2. Verify user role
3. Check if resource belongs to user

### Validation Errors

**Error**: `400 Bad Request - Validation failed`

**Solution**:
1. Check request body format
2. Verify required fields are present
3. Check data types and formats
4. Review API documentation

### Rate Limiting

**Error**: `429 Too Many Requests`

**Solution**:
1. Wait for rate limit to reset
2. Implement exponential backoff
3. Reduce request frequency
4. Check rate limit headers

### CORS Issues

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:
1. Check CORS configuration in backend
2. Verify allowed origins
3. Check preflight requests
4. Update CORS settings if needed

## Frontend Issues

### Hydration Errors

**Error**: `Hydration failed because the server rendered HTML didn't match the client`

**Solution**:
1. Check for client-only code in server components
2. Use `useEffect` for client-side only code
3. Check for conditional rendering based on client state
4. Use dynamic imports for client-only components

### Build Errors

**Error**: `Module not found: Can't resolve 'module'`

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
pnpm install

# Check import paths
# Verify module exists
# Check package.json dependencies
```

### Styling Issues

**Error**: `Styles not loading`

**Solution**:
1. Check Tailwind CSS configuration
2. Verify CSS imports
3. Check for conflicting styles
4. Restart development server

### Authentication Issues

**Error**: `Session not found`

**Solution**:
1. Check NextAuth configuration
2. Verify session provider setup
3. Check authentication callbacks
4. Clear browser cookies and localStorage

## Performance Issues

### Slow Page Loads

**Symptoms**: Pages take >3 seconds to load

**Solution**:
1. Check bundle size: `pnpm run analyze`
2. Optimize images and assets
3. Enable compression
4. Use code splitting
5. Check for memory leaks

### High Memory Usage

**Symptoms**: Application becomes slow or crashes

**Solution**:
1. Check for memory leaks
2. Optimize component re-renders
3. Use React.memo for expensive components
4. Check for infinite loops
5. Monitor with browser dev tools

### Database Performance

**Symptoms**: Slow API responses

**Solution**:
1. Check database indexes
2. Optimize queries
3. Use database connection pooling
4. Monitor query performance
5. Consider caching strategies

## Debugging Tools

### Frontend Debugging

1. **Browser Dev Tools**:
   - Console for errors
   - Network tab for API calls
   - Performance tab for bottlenecks
   - React DevTools for component state

2. **Next.js Debug Mode**:
   ```bash
   NEXT_DEBUG=1 pnpm run dev:frontend
   ```

3. **Bundle Analysis**:
   ```bash
   pnpm run analyze
   ```

### Backend Debugging

1. **Debug Mode**:
   ```bash
   DEBUG=* pnpm run dev:backend
   ```

2. **Database Logging**:
   ```bash
   # Enable query logging in TypeORM config
   logging: true
   ```

3. **API Testing**:
   - Use Postman or Insomnia
   - Check Swagger UI at `/api`
   - Monitor with Sentry

### Database Debugging

1. **Query Analysis**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM bookings WHERE status = 'confirmed';
   ```

2. **Connection Monitoring**:
   ```sql
   SELECT * FROM pg_stat_activity;
   ```

3. **Performance Monitoring**:
   ```sql
   SELECT * FROM pg_stat_user_tables;
   ```

## Common Error Messages

### "Module not found"
- Check import paths
- Verify package installation
- Clear node_modules and reinstall

### "Cannot read property of undefined"
- Check object existence before access
- Use optional chaining (?.)
- Add proper error handling

### "Network Error"
- Check API endpoint URL
- Verify CORS configuration
- Check network connectivity

### "Database connection failed"
- Check database service status
- Verify connection string
- Check firewall settings

### "Build failed"
- Check TypeScript errors
- Verify all dependencies
- Clear build cache

## Getting Help

### Before Asking for Help

1. **Check this guide** for your specific error
2. **Search existing issues** on GitHub
3. **Check logs** for detailed error messages
4. **Try common solutions** listed above
5. **Gather information** about your environment

### Information to Include

When reporting issues, include:

1. **Error message** (exact text)
2. **Steps to reproduce**
3. **Environment details**:
   - OS and version
   - Node.js version
   - pnpm version
   - Browser (for frontend issues)
4. **Relevant logs**
5. **What you've tried**

### Support Channels

1. **GitHub Issues**: For bugs and feature requests
2. **Email**: support@udigit.ca for urgent issues
3. **Documentation**: Check README.md and API docs
4. **Community**: GitHub Discussions for questions

### Emergency Contacts

- **Critical Issues**: support@udigit.ca
- **Security Issues**: security@udigit.ca
- **API Issues**: api-support@udigit.ca

## Prevention

### Best Practices

1. **Keep dependencies updated**
2. **Use environment variables** for configuration
3. **Write tests** for critical functionality
4. **Monitor performance** regularly
5. **Backup data** before major changes
6. **Use version control** properly
7. **Document changes** and decisions

### Monitoring

1. **Set up error tracking** (Sentry)
2. **Monitor performance** (Lighthouse CI)
3. **Check logs** regularly
4. **Set up alerts** for critical issues
5. **Monitor database** performance

### Maintenance

1. **Regular updates** of dependencies
2. **Security patches** as they become available
3. **Performance optimization** based on metrics
4. **Database maintenance** and cleanup
5. **Code review** and refactoring