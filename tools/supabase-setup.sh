#!/bin/bash

# Clear any existing DATABASE_URL
unset DATABASE_URL

# Set the correct Supabase connection
export DATABASE_URL="postgresql://postgres.bnimazxnqligusckahab:cursormcppass!@db.bnimazxnqligusckahab.supabase.co:5432/postgres"

# Set other Supabase environment variables
export SUPABASE_URL="https://bnimazxnqligusckahab.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjY0OTksImV4cCI6MjA3NTM0MjQ5OX0.FSURILCc3fVVeBTjFxVu7YsLU0t7PLcnIjEuuvcGDPc"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2NjQ5OSwiZXhwIjoyMDc1MzQyNDk5fQ.ZkwAdRCdTL0DKGPgJtkbcBllkvachJqTdomV7IcGH3I"

echo "🚀 Starting U-Dig It Rentals Backend with Supabase..."
echo "📍 Database URL: $DATABASE_URL"
echo "🔗 Supabase URL: $SUPABASE_URL"

# Test database connection first
echo "🔍 Testing Supabase connection..."
node test-db-connection.js

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
    echo "🚀 Starting backend server..."
    npm run start:simple
else
    echo "❌ Database connection failed. Please check your Supabase configuration."
    exit 1
fi