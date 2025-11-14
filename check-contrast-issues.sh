#!/bin/bash

# Check for common contrast issues in admin pages

echo "🎨 Checking for contrast issues..."
echo ""

echo "1. Checking for white text on light backgrounds:"
grep -r "text-white.*bg-yellow\|text-white.*bg-amber\|text-white.*bg-lime\|text-white.*bg-orange-[123]\|text-white.*bg-gray-[123]" frontend/src/app/admin/*.tsx 2>/dev/null | head -10

echo ""
echo "2. Checking for light text on light backgrounds:"
grep -r "text-gray-[123].*bg-gray-[123]\|text-gray-[123].*bg-white\|text-white.*bg-white" frontend/src/app/admin/*.tsx 2>/dev/null | head -10

echo ""
echo "3. Checking for brand-primary (light yellow) with white text:"
grep -r "bg-brand-primary.*text-white\|text-white.*bg-brand-primary" frontend/src/app/admin/*.tsx frontend/src/components/admin/*.tsx 2>/dev/null

echo ""
echo "4. Checking Communications tab email buttons in BookingDetailsModal:"
grep -n "Send.*Email\|Send.*Reminder" frontend/src/components/admin/BookingDetailsModal.tsx

echo ""
echo "✅ Audit complete!"


