# Chart Testing & Debugging Plan

## Overview
Comprehensive testing and debugging plan for RevenueChart and BookingTrendsChart components, ensuring compliance with Recharts best practices and documentation.

**Reference**: [Recharts Guide](https://recharts.github.io/en-US/guide/)

---

## 1. Data Validation & Structure

### 1.1 Data Format Validation
- [ ] **Verify data structure**: Ensure all data arrays are arrays of objects with consistent keys
- [ ] **Check data types**: Validate all numeric fields are numbers (not strings)
- [ ] **Test edge cases**:
  - Empty arrays
  - Single data point
  - Large datasets (100+ points)
  - Missing fields
  - Null/undefined values
  - Zero values

### 1.2 Data Transformation
- [ ] **Test `transformDataForRecharts` function**:
  - Handles empty comparison arrays
  - Correctly maps comparison data by index
  - Sets comparison values to 0 when data exists but point is missing
  - Handles length mismatches (padding/truncation)

### 1.3 Data Validation Function
- [ ] **Test `validateData` function**:
  - Filters invalid entries
  - Validates date parsing
  - Sanitizes numeric fields
  - Ensures data integrity (netRevenue ≤ grossRevenue)

---

## 2. ResponsiveContainer Configuration

### 2.1 Basic Configuration
- [ ] **Width/Height props**: Verify `width="100%"` and `height={chartHeight}`
- [ ] **Debounce value**: Check `debounce={100}` is appropriate (prevents excessive resize calculations)
- [ ] **Test resize behavior**: Resize browser window, verify chart adapts smoothly

### 2.2 Best Practices
- [ ] **Parent container**: Ensure parent has defined dimensions
- [ ] **No fixed dimensions**: Verify no fixed pixel widths that break responsiveness
- [ ] **Aspect ratio**: Consider using `aspect` prop if needed for consistent sizing

**Reference**: [Recharts ResponsiveContainer Guide](https://recharts.github.io/en-US/api/ResponsiveContainer)

---

## 3. BarChart Component Configuration

### 3.1 Required Props
- [ ] **data prop**: Verify data is passed correctly
- [ ] **margin**: Check all margins (top, right, left, bottom) are appropriate
- [ ] **barCategoryGap**: Verify gap adjusts for single point (`isSinglePoint ? '20%' : '10%'`)
- [ ] **barSize**: Check size is appropriate for compact vs normal mode

### 3.2 Advanced Props
- [ ] **accessibilityLayer**: Verify `accessibilityLayer={true}` is set
- [ ] **syncId**: Check `syncId` is unique per chart type
- [ ] **layout**: Verify default layout (vertical bars) is correct

**Reference**: [Recharts BarChart API](https://recharts.github.io/en-US/api/BarChart)

---

## 4. XAxis & YAxis Configuration

### 4.1 XAxis Configuration
- [ ] **dataKey**: Verify `dataKey="date"` matches data structure
- [ ] **tickFormatter**: Test `formatChartDate` function handles all date formats
- [ ] **angle**: Check angle adjusts for single point (0°) vs multiple points (-45°)
- [ ] **textAnchor**: Verify anchor position matches angle
- [ ] **height**: Check height accommodates angled labels
- [ ] **interval**: Test interval logic for large datasets (>30 points)
- [ ] **minTickGap**: Verify gap prevents label overlap

### 4.2 YAxis Configuration
- [ ] **domain**: Verify domain includes comparison values: `[0, maxRevenue]` or `[0, maxBookings]`
- [ ] **tickFormatter**: Test `formatYAxisLabel` for currency formatting
- [ ] **width**: Check width accommodates formatted labels
- [ ] **allowDecimals**: Verify `allowDecimals={false}` for booking counts

**Reference**: [Recharts XAxis API](https://recharts.github.io/en-US/api/XAxis) | [Recharts YAxis API](https://recharts.github.io/en-US/api/YAxis)

---

## 5. Tooltip Component

### 5.1 Custom Tooltip
- [ ] **CustomTooltip component**: Verify renders correctly
- [ ] **Active state**: Check tooltip only shows when `active === true`
- [ ] **Payload handling**: Verify payload structure matches expected format
- [ ] **Data display**: Test all data fields display correctly (revenue, bookings, comparison)

### 5.2 Tooltip Props
- [ ] **content**: Verify `<CustomTooltip />` is passed correctly
- [ ] **cursor**: Check cursor styling `{ fill: 'rgba(0, 0, 0, 0.05)' }`
- [ ] **animationDuration**: Verify `animationDuration={200}` provides smooth transitions
- [ ] **wrapperStyle**: Check `wrapperStyle={{ outline: 'none' }}` prevents focus outline

**Reference**: [Recharts Tooltip API](https://recharts.github.io/en-US/api/Tooltip)

---

## 6. Legend Component

### 6.1 Legend Configuration
- [ ] **Conditional rendering**: Verify legend only shows when `!compact && hasComparison`
- [ ] **wrapperStyle**: Check `wrapperStyle={{ paddingTop: '20px' }}` provides spacing
- [ ] **iconType**: Verify `iconType="rect"` matches bar chart style
- [ ] **formatter**: Test formatter function styles text correctly

### 6.2 Custom Legend (Below Chart)
- [ ] **Custom legend**: Verify custom legend below chart renders correctly
- [ ] **Comparison indicator**: Check comparison legend only shows when `hasComparison` is true
- [ ] **Styling**: Test legend styling in compact vs normal mode

**Reference**: [Recharts Legend API](https://recharts.github.io/en-US/api/Legend)

---

## 7. Bar Components

### 7.1 Main Bars
- [ ] **dataKey**: Verify `dataKey="netRevenue"` or `dataKey="total"` matches data
- [ ] **fill**: Check gradient URLs match defs IDs (`url(#revenueGradient)`)
- [ ] **radius**: Verify `radius={[4, 4, 0, 0]}` creates rounded top corners
- [ ] **name**: Check name matches legend display

### 7.2 Comparison Bars
- [ ] **Conditional rendering**: Verify comparison bars only render when `hasComparison` is true
- [ ] **Rendering order**: Check comparison bars render first (behind main bars)
- [ ] **Gradient**: Verify comparison gradient is distinct from main bars

### 7.3 Stacked Bars (BookingTrendsChart)
- [ ] **stackId**: Verify `stackId="current"` groups bars correctly
- [ ] **Stacking order**: Check completed, active, cancelled stack in correct order
- [ ] **Radius**: Verify only top bar (cancelled) has rounded corners

### 7.4 Animation
- [ ] **isAnimationActive**: Verify `isAnimationActive={true}` enables animations
- [ ] **animationDuration**: Check `animationDuration={500}` provides smooth animation
- [ ] **animationEasing**: Verify `animationEasing="ease-out"` provides natural motion

**Reference**: [Recharts Bar API](https://recharts.github.io/en-US/api/Bar)

---

## 8. Gradient Definitions

### 8.1 Gradient IDs
- [ ] **Unique IDs**: Verify all gradient IDs are unique:
  - `revenueGradient`
  - `revenueComparisonGradient`
  - `completedGradient`
  - `activeGradient`
  - `cancelledGradient`
  - `comparisonGradient`

### 8.2 Gradient Structure
- [ ] **Linear gradients**: Verify all gradients use `linearGradient` with correct `x1`, `y1`, `x2`, `y2`
- [ ] **Color stops**: Check color stops are defined correctly
- [ ] **Stop opacity**: Verify opacity values are appropriate

**Reference**: [Recharts Customize Guide](https://recharts.github.io/en-US/guide/customize)

---

## 9. Comparison Data Logic

### 9.1 hasComparison Detection
- [ ] **Empty array check**: Verify `hasComparison` returns false when `comparison.length === 0`
- [ ] **Zero value detection**: Check `hasComparison` detects comparison values including 0
- [ ] **Undefined handling**: Verify undefined values don't break detection

### 9.2 Data Alignment
- [ ] **Index-based alignment**: Verify comparison data aligns by index, not date
- [ ] **Padding logic**: Check missing comparison points are padded with 0 (not undefined)
- [ ] **Truncation logic**: Verify excess comparison points are truncated

### 9.3 Transform Function
- [ ] **Comparison mapping**: Test `transformDataForRecharts` correctly maps comparison data
- [ ] **Zero handling**: Verify comparison values of 0 are set correctly (not undefined)
- [ ] **Length handling**: Check function handles length mismatches gracefully

---

## 10. Date Range Testing

### 10.1 All Date Ranges
- [ ] **Today**: Test charts with today's data
- [ ] **Week**: Test weekly view (7 days)
- [ ] **Month**: Test monthly view (30 days)
- [ ] **Quarter**: Test quarterly view (90 days)
- [ ] **Year**: Test yearly view (365 days)
- [ ] **Custom**: Test custom date range selection

### 10.2 Previous Period Calculation
- [ ] **Date calculation**: Verify previous period dates are calculated correctly for all ranges
- [ ] **Data retrieval**: Check API returns comparison data for all ranges
- [ ] **Data alignment**: Verify comparison data aligns correctly for all ranges

---

## 11. Error Handling

### 11.1 Invalid Data
- [ ] **Missing data prop**: Test component with missing `data` prop
- [ ] **Invalid data structure**: Test with malformed data
- [ ] **Network errors**: Test error handling when API fails

### 11.2 Edge Cases
- [ ] **All zero values**: Test charts with all zero revenue/bookings
- [ ] **Negative values**: Verify negative values are handled (shouldn't occur, but test)
- [ ] **Very large values**: Test with extremely large numbers

### 11.3 Error Boundaries
- [ ] **React error boundaries**: Verify error boundaries catch chart errors
- [ ] **Graceful degradation**: Check charts fail gracefully without crashing app

---

## 12. Accessibility

### 12.1 ARIA Labels
- [ ] **Container labels**: Verify `aria-label` on chart containers
- [ ] **Axis labels**: Check `aria-label` on XAxis and YAxis
- [ ] **Legend labels**: Verify `aria-label` on legend groups

### 12.2 Screen Reader Support
- [ ] **Screen reader summary**: Check `.sr-only` summary provides complete information
- [ ] **Data list**: Verify data list in screen reader summary is accurate

### 12.3 Keyboard Navigation
- [ ] **Focus management**: Test keyboard navigation through chart
- [ ] **Tooltip activation**: Verify tooltip can be activated via keyboard

**Reference**: [Recharts Accessibility](https://recharts.github.io/en-US/guide/accessibility)

---

## 13. Performance

### 13.1 Memoization
- [ ] **Component memoization**: Verify `memo()` prevents unnecessary re-renders
- [ ] **useMemo hooks**: Check `useMemo` for `validatedData`, `chartData`, `hasComparison`
- [ ] **Dependency arrays**: Verify dependency arrays are correct

### 13.2 Large Datasets
- [ ] **100+ data points**: Test charts with 100+ data points
- [ ] **Rendering performance**: Check rendering time is acceptable
- [ ] **Memory usage**: Verify no memory leaks with large datasets

### 13.3 Resize Performance
- [ ] **Debounce**: Verify `debounce={100}` prevents excessive resize calculations
- [ ] **Smooth resizing**: Test chart resizes smoothly without lag

---

## 14. Empty States

### 14.1 No Data
- [ ] **Empty state rendering**: Verify empty state displays when `validatedData.length === 0`
- [ ] **Empty message**: Check empty message is user-friendly
- [ ] **Styling**: Verify empty state styling matches design

### 14.2 No Comparison Data
- [ ] **Comparison bars hidden**: Verify comparison bars don't render when no comparison data
- [ ] **Legend hidden**: Check legend doesn't show when no comparison data

---

## 15. Compact Mode

### 15.1 Sizing
- [ ] **Chart height**: Verify `chartHeight` adjusts for compact mode (200px vs 256px)
- [ ] **Margins**: Check margins adjust for compact mode
- [ ] **Bar size**: Verify `barSize` adjusts for compact mode (24px vs 32px)

### 15.2 Element Visibility
- [ ] **Summary stats**: Verify summary stats are hidden in compact mode
- [ ] **Reference line**: Check reference line is hidden in compact mode
- [ ] **Legend**: Verify legend styling adjusts for compact mode

---

## 16. ReferenceLine Component

### 16.1 Average Revenue Line
- [ ] **Conditional rendering**: Verify line only shows when `!compact && averageRevenue > 0 && chartData.length > 1`
- [ ] **Y value**: Check line renders at correct Y position
- [ ] **Styling**: Verify stroke color, dash array, width are correct
- [ ] **Label**: Check label positioning and styling

**Reference**: [Recharts ReferenceLine API](https://recharts.github.io/en-US/api/ReferenceLine)

---

## 17. CartesianGrid Component

### 17.1 Grid Configuration
- [ ] **strokeDasharray**: Verify `strokeDasharray="3 3"` creates dashed lines
- [ ] **stroke color**: Check `stroke="#e5e7eb"` matches design
- [ ] **vertical prop**: Verify `vertical={false}` hides vertical grid lines

**Reference**: [Recharts CartesianGrid API](https://recharts.github.io/en-US/api/CartesianGrid)

---

## 18. Single Data Point Edge Case

### 18.1 Bar Category Gap
- [ ] **Gap adjustment**: Verify `barCategoryGap={isSinglePoint ? '20%' : '10%'}` provides spacing
- [ ] **Bar positioning**: Check single bar is centered correctly

### 18.2 XAxis Angle
- [ ] **Angle adjustment**: Verify `angle={isSinglePoint ? 0 : -45}` prevents label overlap
- [ ] **Text anchor**: Check `textAnchor={isSinglePoint ? 'middle' : 'end'}` positions label correctly

---

## 19. Console Errors & Warnings

### 19.1 React Warnings
- [ ] **No console errors**: Verify no React errors in console
- [ ] **No warnings**: Check for React warnings (key props, etc.)

### 19.2 Recharts Warnings
- [ ] **No Recharts errors**: Verify no Recharts-specific errors
- [ ] **No deprecation warnings**: Check for deprecated prop usage

### 19.3 Development Logging
- [ ] **Debug logs**: Verify debug logs only appear in development mode
- [ ] **Log clarity**: Check logs provide useful debugging information

---

## 20. Responsive Behavior

### 20.1 Browser Resize
- [ ] **Window resize**: Test chart adapts when browser window is resized
- [ ] **Smooth transitions**: Verify resize is smooth without flickering

### 20.2 Device Testing
- [ ] **Mobile**: Test charts on mobile devices (320px - 768px)
- [ ] **Tablet**: Test charts on tablet devices (768px - 1024px)
- [ ] **Desktop**: Test charts on desktop devices (1024px+)

---

## 21. Y-Axis Domain Calculation

### 21.1 Max Value Calculation
- [ ] **Includes comparison**: Verify `maxRevenue`/`maxBookings` includes comparison values
- [ ] **Padding**: Check 10% padding is added to max value
- [ ] **Zero handling**: Verify domain handles all-zero data correctly (returns 1 to prevent division by zero)

---

## 22. BookingTrendsChart Stacked Bars

### 22.1 Stack Configuration
- [ ] **stackId**: Verify all current period bars use `stackId="current"`
- [ ] **Stacking order**: Check bars stack in correct order (completed, active, cancelled)
- [ ] **Radius**: Verify only top bar (cancelled) has rounded corners

### 22.2 Comparison Bar
- [ ] **Separate bar**: Verify comparison bar doesn't use stackId (renders separately)
- [ ] **Positioning**: Check comparison bar renders behind stacked bars

---

## 23. Integration Testing

### 23.1 Dashboard Integration
- [ ] **Both charts**: Test both charts render correctly on dashboard
- [ ] **No conflicts**: Verify no conflicts between charts (syncId, gradients, etc.)
- [ ] **Data flow**: Check data flows correctly from API → page.tsx → chart components

### 23.2 Modal Integration
- [ ] **Expand functionality**: Test expand button opens modal with full-size chart
- [ ] **Modal rendering**: Verify chart renders correctly in modal
- [ ] **Modal closing**: Check modal closes correctly

---

## 24. Final Checklist

### 24.1 Code Quality
- [ ] **TypeScript**: No type errors
- [ ] **Linting**: No linting errors
- [ ] **Formatting**: Code is properly formatted

### 24.2 Documentation
- [ ] **Code comments**: All complex logic is commented
- [ ] **JSDoc**: Functions have JSDoc comments where appropriate

### 24.3 Testing
- [ ] **All tests pass**: Run test suite, verify all tests pass
- [ ] **Manual testing**: Complete manual testing of all scenarios above

---

## Testing Tools & Resources

### Browser DevTools
- React DevTools: Inspect component props and state
- Console: Check for errors and warnings
- Network tab: Verify API calls and responses
- Elements: Inspect rendered SVG structure

### Recharts Documentation
- [Recharts Guide](https://recharts.github.io/en-US/guide/)
- [Recharts API Reference](https://recharts.github.io/en-US/api)
- [Recharts Examples](https://recharts.github.io/en-US/examples)

### Testing Commands
```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run tests
pnpm test

# Start dev server
pnpm dev
```

---

## Success Criteria

✅ **All tests pass**: Every item in this plan is verified
✅ **No console errors**: No errors or warnings in browser console
✅ **All date ranges work**: Charts work correctly for all date ranges
✅ **Comparison data displays**: Previous period data shows for all ranges
✅ **Responsive**: Charts adapt correctly to all screen sizes
✅ **Accessible**: Charts meet WCAG AA standards
✅ **Performant**: Charts render smoothly with large datasets
✅ **Best practices**: Code follows Recharts best practices

---

**Status**: 📋 Plan Created
**Last Updated**: 2025-01-22
**Next Steps**: Begin systematic testing following this plan

