# Supabase Database Setup Guide

## Overview

This document provides comprehensive guidance for setting up and maintaining the Supabase database
for the Kubota Rental Platform.

## Current Configuration

### Database Connection

- **URL**: `https://bnimazxnqligusckahab.supabase.co`
- **Database**: PostgreSQL (hosted on Supabase)
- **Port**: 5432
- **Connection String**:
  `postgresql://postgres.bnimazxnqligusckahab:cursormcppass!@db.bnimazxnqligusckahab.supabase.co:5432/postgres`

### Environment Variables

```bash
SUPABASE_URL=https://bnimazxnqligusckahab.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjY0OTksImV4cCI6MjA3NTM0MjQ5OX0.FSURILCc3fVVeBTjFxVu7YsLU0t7PLcnIjEuuvcGDPc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2NjQ5OSwiZXhwIjoyMDc1MzQyNDk5fQ.ZkwAdRCdTL0DKGPgJtkbcBllkvachJqTdomV7IcGH3I
```

## Implementation Status

### ✅ Completed

1. **Supabase Service**: Created `backend/src/supabase/supabase.service.ts`
2. **Supabase Module**: Created `backend/src/supabase/supabase.module.ts`
3. **App Integration**: SupabaseModule integrated into main AppModule
4. **Connection Testing**: Database connection verified and working
5. **Start Script**: Created `backend/start-with-supabase.sh` for easy startup

### 🔧 Current Architecture

- **Service Layer**: `SupabaseService` provides database operations
- **Module Structure**: Properly integrated with NestJS dependency injection
- **Error Handling**: Comprehensive error logging and validation
- **Connection Management**: Secure connection with service role key

## Database Schema

### Core Tables

- `users` - User accounts and profiles
- `equipment` - Equipment inventory and specifications
- `bookings` - Rental bookings and reservations
- `payments` - Payment transactions and records
- `contracts` - Rental agreements and contracts

### Key Features

- **Real-time subscriptions** for live updates
- **Row Level Security (RLS)** for data protection
- **Automatic API generation** from schema
- **Built-in authentication** and user management

## Usage Guidelines

### 1. Service Integration

```typescript
// Inject SupabaseService in your modules
constructor(private supabaseService: SupabaseService) {}

// Use the service for database operations
const users = await this.supabaseService.getUsers();
const equipment = await this.supabaseService.getEquipment();
```

### 2. Error Handling

```typescript
try {
  const { data, error } = await this.supabaseService.getClient().from('table_name').select('*');

  if (error) throw error;
  return data;
} catch (error) {
  console.error('Database operation failed:', error);
  throw new Error('Database operation failed');
}
```

### 3. Security Best Practices

- Always use the service role key for backend operations
- Implement proper input validation
- Use Row Level Security policies
- Never expose service role key to frontend

## Monitoring and Maintenance

### Health Checks

- Database connection status
- Query performance monitoring
- Error rate tracking
- Response time metrics

### Backup Strategy

- Automatic daily backups
- Point-in-time recovery
- Cross-region replication
- Data retention policies

## Troubleshooting

### Common Issues

1. **Connection Timeouts**: Check network connectivity and Supabase status
2. **Authentication Errors**: Verify service role key is correct
3. **Query Failures**: Check RLS policies and table permissions
4. **Rate Limiting**: Implement proper retry logic and caching

### Debug Commands

```bash
# Test database connection
cd backend && node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('users').select('count').then(console.log);
"

# Start with Supabase
cd backend && ./start-with-supabase.sh
```

## Security Considerations

### Data Protection

- All data encrypted in transit and at rest
- Service role key stored securely in environment variables
- Row Level Security policies implemented
- Regular security audits and updates

### Access Control

- Service role key for backend operations only
- Anonymous key for public operations
- User-specific data access through RLS
- API rate limiting and monitoring

## Performance Optimization

### Query Optimization

- Use proper indexes on frequently queried columns
- Implement query caching where appropriate
- Monitor slow queries and optimize
- Use connection pooling

### Caching Strategy

- Redis for session data
- Application-level caching for frequently accessed data
- CDN for static assets
- Database query result caching

## Future Enhancements

### Planned Features

1. **Real-time Subscriptions**: Live updates for booking changes
2. **Advanced Analytics**: Business intelligence and reporting
3. **Automated Scaling**: Dynamic resource allocation
4. **Multi-region Support**: Global deployment capabilities

### Migration Strategy

- Gradual migration from TypeORM to Supabase
- Data migration scripts and validation
- Rollback procedures and testing
- Performance monitoring and optimization

## Support and Resources

### Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)

### Monitoring

- Supabase Dashboard: https://supabase.com/dashboard
- Database metrics and logs
- Performance monitoring
- Error tracking and alerts

---

**Last Updated**: January 21, 2025 **Version**: 1.0.0 **Status**: ✅ Active and Operational
