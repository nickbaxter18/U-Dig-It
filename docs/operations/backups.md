# Backup and Recovery Procedures

## Overview

The Kubota Rental Platform uses Supabase automatic backups for disaster recovery and point-in-time recovery.

## Automatic Backups

### Configuration

Automatic backups are configured in the Supabase project settings:

- **Backup Schedule**: Daily at 2:00 AM UTC
- **Retention Policy**: 7 days (configurable up to 30 days)
- **Backup Storage**: Managed by Supabase

### Backup Types

1. **Full Database Backup**: Complete database snapshot
2. **Point-in-Time Recovery (PITR)**: Continuous backup for point-in-time recovery
3. **Transaction Log Backup**: Continuous transaction log backups

## Manual Backup Procedures

### Creating a Manual Backup

1. Navigate to Supabase Dashboard → Project Settings → Database
2. Click "Create Backup"
3. Select backup type (Full or Point-in-Time)
4. Confirm backup creation

### Backup Verification

Backups are automatically verified by Supabase. To manually verify:

1. Check backup status in Supabase Dashboard
2. Verify backup size and timestamp
3. Test restore procedure in a development environment

## Restore Procedures

### Full Database Restore

1. Navigate to Supabase Dashboard → Project Settings → Database
2. Click "Restore from Backup"
3. Select backup point
4. Choose restore target (new project or existing)
5. Confirm restore

### Point-in-Time Recovery

1. Navigate to Supabase Dashboard → Project Settings → Database
2. Click "Point-in-Time Recovery"
3. Select recovery point (date and time)
4. Choose restore target
5. Confirm recovery

### Post-Restore Verification

After restoring a backup:

1. **Verify Data Integrity**
   - Check critical tables (bookings, payments, users)
   - Verify record counts match expected values
   - Check foreign key relationships

2. **Test Application Functionality**
   - Test user authentication
   - Test booking creation
   - Test payment processing
   - Verify API endpoints

3. **Check Application Logs**
   - Review error logs for issues
   - Verify scheduled jobs are running
   - Check webhook endpoints

## Backup Retention Policy

### Current Policy

- **Daily Backups**: Retained for 7 days
- **Weekly Backups**: Retained for 4 weeks (if configured)
- **Monthly Backups**: Retained for 12 months (if configured)

### Policy Updates

To update retention policy:

1. Navigate to Supabase Dashboard → Project Settings → Database
2. Click "Backup Settings"
3. Adjust retention periods
4. Save changes

## Disaster Recovery Plan

### Recovery Time Objectives (RTO)

- **Target RTO**: < 1 hour for full database restore
- **Target RTO**: < 15 minutes for point-in-time recovery

### Recovery Point Objectives (RPO)

- **Target RPO**: < 5 minutes (continuous transaction log backups)

### Recovery Procedures

1. **Assess Situation**
   - Identify data loss scope
   - Determine recovery point needed
   - Verify backup availability

2. **Initiate Recovery**
   - Use Supabase Dashboard or CLI
   - Select appropriate backup point
   - Confirm recovery parameters

3. **Verify Recovery**
   - Run data integrity checks
   - Test critical functionality
   - Monitor application logs

4. **Post-Recovery**
   - Document incident
   - Review backup procedures
   - Update disaster recovery plan if needed

## Backup Monitoring

### Automated Monitoring

- Supabase automatically monitors backup health
- Alerts sent for backup failures
- Dashboard shows backup status

### Manual Monitoring

Check backup status weekly:

1. Navigate to Supabase Dashboard
2. Review backup history
3. Verify recent backups succeeded
4. Check backup sizes (should be consistent)

## Best Practices

1. **Regular Testing**
   - Test restore procedures quarterly
   - Verify backups in development environment
   - Document any issues encountered

2. **Backup Verification**
   - Verify backups complete successfully
   - Check backup sizes are reasonable
   - Monitor backup storage usage

3. **Documentation**
   - Keep backup procedures up-to-date
   - Document any custom backup scripts
   - Maintain recovery runbooks

4. **Security**
   - Secure backup access credentials
   - Encrypt backup storage
   - Limit backup access to authorized personnel

## Troubleshooting

### Backup Failures

If backups fail:

1. Check Supabase status page
2. Review backup error messages
3. Verify database connectivity
4. Contact Supabase support if needed

### Restore Issues

If restore fails:

1. Verify backup file integrity
2. Check restore target has sufficient resources
3. Review restore error messages
4. Try restoring to a different point in time

## Related Documentation

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [Disaster Recovery Plan](./disaster-recovery.md)
- [Operations Runbook](./runbooks.md)


