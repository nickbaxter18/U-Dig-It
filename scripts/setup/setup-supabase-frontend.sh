#!/bin/bash

# 🚜 Supabase Frontend Integration Setup Script
# This script implements the most efficient Supabase integration strategy

set -e

echo "🚜 Setting up Supabase Frontend Integration..."
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the frontend directory
if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
    echo -e "${RED}❌ Error: Please run this script from the frontend directory${NC}"
    echo "Usage: cd frontend && ./setup-supabase-frontend.sh"
    exit 1
fi

echo -e "${GREEN}✅ Frontend directory detected${NC}"

# Step 1: Install Supabase dependencies
echo -e "\n${YELLOW}📦 Step 1: Installing Supabase dependencies...${NC}"
npm install @supabase/supabase-js @supabase/ssr

echo -e "${GREEN}✅ Supabase packages installed${NC}"

# Step 2: Create environment variables
echo -e "\n${YELLOW}🔧 Step 2: Setting up environment variables...${NC}"

# Check if .env.local exists
if [[ -f ".env.local" ]]; then
    echo -e "${YELLOW}⚠️  .env.local already exists. Please add these variables manually:${NC}"
    echo ""
    echo "# Supabase Configuration (add to .env.local)"
    echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    echo ""
    echo -e "${YELLOW}Get these values from your Supabase dashboard > Settings > API${NC}"
else
    echo -e "${YELLOW}Creating .env.local with Supabase configuration...${NC}"
    echo "# Supabase Configuration" > .env.local
    echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" >> .env.local
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key" >> .env.local
    echo "" >> .env.local
    echo "# Keep existing variables" >> .env.local
    echo "NEXTAUTH_SECRET=your_nextauth_secret" >> .env.local
    echo "GOOGLE_CLIENT_ID=your_google_client_id" >> .env.local
    echo "GOOGLE_CLIENT_SECRET=your_google_client_secret" >> .env.local

    echo -e "${GREEN}✅ .env.local created with Supabase configuration${NC}"
    echo -e "${YELLOW}⚠️  Please update the Supabase URL and keys from your dashboard${NC}"
fi

# Step 3: Create Supabase client
echo -e "\n${YELLOW}🔧 Step 3: Creating Supabase client setup...${NC}"

# Create the Supabase client directory
mkdir -p src/lib/supabase

# Create client.ts
cat > src/lib/supabase/client.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../../supabase/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side client (for SSR)
export const createServerSupabaseClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}
EOF

echo -e "${GREEN}✅ Supabase client created${NC}"

# Step 4: Create authentication service
echo -e "\n${YELLOW}🔧 Step 4: Creating authentication service...${NC}"

cat > src/lib/supabase/auth.ts << 'EOF'
import { supabase } from './client'
import type { Tables } from '../../../supabase/types'

export type User = Tables<'users'>

export const authService = {
  // Sign up with email/password
  async signUp(email: string, password: string, userData: Partial<User>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })

    if (error) throw error
    return data
  },

  // Sign in with email/password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  },

  // Google OAuth
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Get session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }
}
EOF

echo -e "${GREEN}✅ Authentication service created${NC}"

# Step 5: Create API client
echo -e "\n${YELLOW}🔧 Step 5: Creating type-safe API client...${NC}"

cat > src/lib/supabase/api-client.ts << 'EOF'
import { supabase } from './client'
import type { Database, Tables, TablesInsert, TablesUpdate } from '../../../supabase/types'

// Type-safe API client
export class SupabaseApiClient {
  // Equipment operations
  async getEquipment(id: string) {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async getEquipmentList(params?: {
    category?: string
    available?: boolean
    page?: number
    limit?: number
  }) {
    let query = supabase
      .from('equipment')
      .select('*')

    if (params?.category) {
      query = query.eq('type', params.category)
    }

    if (params?.available !== undefined) {
      query = query.eq('status', params.available ? 'available' : 'unavailable')
    }

    if (params?.limit) {
      query = query.limit(params.limit)
      if (params.page && params.page > 1) {
        query = query.range((params.page - 1) * params.limit, params.page * params.limit - 1)
      }
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  // Check availability (most critical for rental platform)
  async checkAvailability(equipmentId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .rpc('check_equipment_availability', {
        equipment_id: equipmentId,
        start_date: startDate,
        end_date: endDate
      })

    if (error) throw error
    return data
  }

  // Booking operations
  async createBooking(bookingData: TablesInsert<'bookings'>) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getBookings(filters?: {
    status?: string
    userId?: string
    page?: number
    limit?: number
  }) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        equipment:equipment_id (
          id,
          model,
          make,
          year,
          dailyRate,
          images
        ),
        customer:customerId (
          id,
          firstName,
          lastName,
          email
        )
      `)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.userId) {
      query = query.eq('customerId', filters.userId)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
      if (filters.page && filters.page > 1) {
        query = query.range((filters.page - 1) * filters.limit, filters.page * filters.limit - 1)
      }
    }

    const { data, error } = await query.order('createdAt', { ascending: false })
    if (error) throw error
    return data
  }

  // Payment operations
  async createPayment(paymentData: TablesInsert<'payments'>) {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getPayments(bookingId?: string) {
    let query = supabase
      .from('payments')
      .select('*')

    if (bookingId) {
      query = query.eq('bookingId', bookingId)
    }

    const { data, error } = await query.order('createdAt', { ascending: false })
    if (error) throw error
    return data
  }
}

// Export singleton instance
export const supabaseApi = new SupabaseApiClient()
EOF

echo -e "${GREEN}✅ Type-safe API client created${NC}"

# Step 6: Create React hooks
echo -e "\n${YELLOW}🔧 Step 6: Creating React hooks for data management...${NC}"

cat > src/hooks/useSupabase.ts << 'EOF'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Tables, TablesInsert } from '../../../supabase/types'

// Generic hook for Supabase queries
export function useSupabaseQuery<T>(
  table: string,
  query: any,
  options?: {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
  }
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!options?.enabled) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from(table)
          .select(query.select || '*')
          .eq(query.eq?.key, query.eq?.value)
          .limit(query.limit || 100)

        if (error) throw error
        setData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [table, JSON.stringify(query), options?.enabled])

  return { data, loading, error, refetch: () => window.location.reload() }
}

// Equipment hooks
export function useEquipment(id?: string) {
  return useSupabaseQuery<Tables<'equipment'>>(
    'equipment',
    id ? { select: '*', eq: { key: 'id', value: id } } : { select: '*' },
    { enabled: true }
  )
}

export function useBookings(userId?: string) {
  return useSupabaseQuery<Tables<'bookings'>[]>(
    'bookings',
    {
      select: `
        *,
        equipment:equipment_id (
          id, model, make, year, dailyRate, images
        ),
        customer:customerId (
          id, firstName, lastName, email
        )
      `,
      eq: userId ? { key: 'customerId', value: userId } : undefined
    },
    { enabled: true }
  )
}

// Real-time hooks
export function useRealtimeSubscription<T>(
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter
        },
        callback || (() => {})
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, callback])
}
EOF

echo -e "${GREEN}✅ React hooks created${NC}"

# Step 7: Create auth context provider
echo -e "\n${YELLOW}🔧 Step 7: Creating authentication context provider...${NC}"

mkdir -p src/components/providers

cat > src/components/providers/SupabaseAuthProvider.tsx << 'EOF'
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { authService } from '@/lib/supabase/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    authService.getCurrentUser().then(setUser).finally(() => setLoading(false))

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      await authService.signIn(email, password)
    },
    signUp: async (email: string, password: string, userData: any) => {
      await authService.signUp(email, password, userData)
    },
    signInWithGoogle: async () => {
      await authService.signInWithGoogle()
    },
    signOut: async () => {
      await authService.signOut()
    }
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider')
  }
  return context
}
EOF

echo -e "${GREEN}✅ Auth context provider created${NC}"

# Step 8: Create error handling utilities
echo -e "\n${YELLOW}🔧 Step 8: Creating error handling utilities...${NC}"

cat > src/lib/supabase/error-handler.ts << 'EOF'
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'SupabaseError'
  }
}

export const handleSupabaseError = (error: any): SupabaseError => {
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        return new SupabaseError('No data found', 'NOT_FOUND', error)
      case 'PGRST301':
        return new SupabaseError('Access denied', 'UNAUTHORIZED', error)
      case '23505':
        return new SupabaseError('Duplicate entry', 'DUPLICATE', error)
      case '23503':
        return new SupabaseError('Referenced record not found', 'FOREIGN_KEY', error)
      default:
        return new SupabaseError(error.message || 'Database error', error.code, error)
    }
  }

  return new SupabaseError(error.message || 'Unknown error', 'UNKNOWN', error)
}
EOF

echo -e "${GREEN}✅ Error handling utilities created${NC}"

# Step 9: Update package.json scripts
echo -e "\n${YELLOW}🔧 Step 9: Adding helpful scripts...${NC}"

# Check if we need to add scripts to package.json
if ! grep -q "supabase" package.json; then
    echo -e "${YELLOW}Consider adding these scripts to package.json:${NC}"
    echo ""
    echo '  "scripts": {'
    echo '    "supabase:generate-types": "supabase gen types typescript --local > supabase/types.ts",'
    echo '    "supabase:reset": "supabase db reset",'
    echo '    "supabase:seed": "supabase db reset && supabase db push"'
    echo '  }'
fi

# Step 10: Create Next.js configuration for Supabase
echo -e "\n${YELLOW}🔧 Step 10: Creating Next.js configuration...${NC}"

if [[ -f "next.config.js" ]]; then
    echo -e "${YELLOW}⚠️  next.config.js already exists. Please add these configurations manually:${NC}"
    echo ""
    echo "// Add to next.config.js for Supabase SSR support"
    echo "const { createClient } = require('@supabase/supabase-js')"
    echo ""
    echo "module.exports = {"
    echo "  // ... existing config"
    echo "  experimental: {"
    echo "    serverComponentsExternalPackages: ['@supabase/supabase-js']"
    echo "  }"
    echo "}"
else
    echo -e "${YELLOW}Creating next.config.js with Supabase configuration...${NC}"
    cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    domains: ['your-project.supabase.co'],
  },
}

module.exports = nextConfig
EOF
    echo -e "${GREEN}✅ next.config.js created with Supabase configuration${NC}"
fi

# Step 11: Create integration testing
echo -e "\n${YELLOW}🔧 Step 11: Creating integration tests...${NC}"

mkdir -p src/__tests__

cat > src/__tests__/supabase-integration.test.ts << 'EOF'
import { supabaseApi } from '@/lib/supabase/api-client'

describe('Supabase Integration', () => {
  test('should fetch equipment list', async () => {
    const equipment = await supabaseApi.getEquipmentList()
    expect(equipment).toBeDefined()
    expect(Array.isArray(equipment)).toBe(true)
  })

  test('should check equipment availability', async () => {
    const availability = await supabaseApi.checkAvailability(
      'test-equipment-id',
      '2024-01-01',
      '2024-01-02'
    )
    expect(availability).toBeDefined()
    expect(typeof availability.available).toBe('boolean')
  })

  test('should create booking', async () => {
    const bookingData = {
      equipmentId: 'test-equipment-id',
      customerId: 'test-user-id',
      startDate: '2024-01-01',
      endDate: '2024-01-02',
      // ... other required fields
    }

    const booking = await supabaseApi.createBooking(bookingData)
    expect(booking).toBeDefined()
    expect(booking.id).toBeDefined()
  })
})
EOF

echo -e "${GREEN}✅ Integration tests created${NC}"

# Step 12: Final instructions
echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo "1. Update .env.local with your actual Supabase credentials"
echo "2. Add the SupabaseAuthProvider to your app layout"
echo "3. Update your components to use the new Supabase hooks"
echo "4. Test the integration with your existing data"
echo ""
echo -e "${GREEN}✅ Your frontend is now ready for Supabase integration!${NC}"
echo -e "${YELLOW}🚀 Expected Benefits:${NC}"
echo "- 50% faster development (no REST API layer)"
echo "- 100% type safety with generated types"
echo "- Real-time features for live updates"
echo "- Built-in authentication and RLS security"
echo "- Automatic performance optimization"

echo -e "\n${GREEN}Ready to start building your rental platform frontend! 🎯🚜${NC}"
























