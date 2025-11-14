#!/bin/bash

# 🚜 Component Migration Helper Script
# Helps migrate existing components from REST API to Supabase

echo "🔄 Component Migration Helper"
echo "============================="
echo ""
echo "This script helps you find and migrate components that need updating."
echo ""

# Find API client usage
echo "📋 Components using apiClient:"
grep -r "apiClient\." src/ --include="*.tsx" --include="*.ts" | head -10

echo ""
echo "📋 Components using NextAuth:"
grep -r "useSession\|signIn\|getSession" src/ --include="*.tsx" --include="*.ts" | head -10

echo ""
echo "📋 Equipment-related components:"
grep -r "equipment" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | head -10

echo ""
echo "📋 Booking-related components:"
grep -r "booking" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | head -10

echo ""
echo "✅ Migration Checklist:"
echo "- [ ] Update EquipmentShowcase.tsx to use useEquipment() hook"
echo "- [ ] Update BookingWidget.tsx to use supabaseApi.checkAvailability()"
echo "- [ ] Update UserDashboard.tsx to use useBookings() hook"
echo "- [ ] Update auth components to use useAuth() hook"
echo "- [ ] Add real-time features to components that need live updates"
echo "- [ ] Test all migrated components"

echo ""
echo "🚀 Ready to start migrating components!"
echo "Check SUPABASE_INTEGRATION_COMPLETE.md for detailed migration examples."
