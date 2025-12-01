# GraphQL API Documentation

## Overview

The Kubota Rental Platform exposes a GraphQL API powered by the `pg_graphql` extension. This API provides a flexible way to query and mutate data using GraphQL syntax.

## Endpoint

The GraphQL endpoint is available at:

```
POST /rest/v1/graphql
```

Or via the Supabase client:

```typescript
const { data } = await supabase.rpc('graphql', {
  query: '...',
  variables: {}
});
```

## Authentication

GraphQL queries respect Row-Level Security (RLS) policies. You must be authenticated to access protected resources.

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

// GraphQL queries will use the authenticated user's context
```

## Example Queries

### Query Equipment

```graphql
query GetEquipment {
  equipmentCollection(first: 10) {
    edges {
      node {
        id
        unitId
        make
        model
        dailyRate
        status
      }
    }
  }
}
```

### Query Bookings with Relations

```graphql
query GetBookings {
  bookingsCollection(
    filter: { status: { eq: "confirmed" } }
    first: 20
  ) {
    edges {
      node {
        id
        bookingNumber
        status
        totalAmount
        customer: customerId {
          firstName
          lastName
          email
        }
        equipment: equipmentId {
          unitId
          make
          model
        }
      }
    }
  }
}
```

### Query with Filters

```graphql
query SearchEquipment($searchTerm: String) {
  equipmentCollection(
    filter: {
      or: [
        { make: { ilike: $searchTerm } }
        { model: { ilike: $searchTerm } }
      ]
    }
    first: 20
  ) {
    edges {
      node {
        id
        unitId
        make
        model
      }
    }
  }
}
```

### Mutations

```graphql
mutation CreateBooking($input: bookingsInsertInput!) {
  insertIntobookingsCollection(objects: [$input]) {
    records {
      id
      bookingNumber
      status
    }
  }
}
```

## Schema

The GraphQL schema is automatically generated from your PostgreSQL schema. All tables, views, and functions in the `public` schema are exposed.

### Available Collections

- `equipmentCollection` - Equipment inventory
- `bookingsCollection` - Rental bookings
- `usersCollection` - User accounts
- `paymentsCollection` - Payment records
- `notificationsCollection` - User notifications
- And more...

## RLS Policies

All GraphQL queries respect Row-Level Security policies:

- Users can only see their own bookings
- Admins can see all data
- Public data (like equipment) is accessible to all

## Best Practices

1. **Use specific fields** - Don't query `*`, specify only needed fields
2. **Use pagination** - Use `first` and `after` for large datasets
3. **Use filters** - Filter at the database level, not in application code
4. **Handle errors** - GraphQL returns errors in the `errors` array

## Error Handling

```typescript
const { data, error } = await supabase.rpc('graphql', {
  query: '...',
  variables: {}
});

if (error) {
  console.error('GraphQL error:', error);
}

if (data?.errors) {
  console.error('GraphQL query errors:', data.errors);
}
```

## Rate Limiting

GraphQL queries are subject to the same rate limits as REST API requests. Use connection pooling for high-volume queries.

## Documentation

For the full GraphQL schema, use GraphQL introspection:

```graphql
query IntrospectionQuery {
  __schema {
    types {
      name
      kind
      description
    }
  }
}
```

Or use a GraphQL client like Apollo or Relay to explore the schema interactively.

## Support

For issues or questions about the GraphQL API, refer to:
- [Supabase GraphQL Documentation](https://supabase.com/docs/guides/api/graphql)
- [pg_graphql Extension Documentation](https://github.com/supabase/pg_graphql)


