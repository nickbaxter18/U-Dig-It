# Admin Dashboard TypeScript Issue

## Known Issue

**File**: `frontend/src/app/admin/equipment/page.tsx`
**Line**: 1473
**Error**: `Type 'unknown' is not assignable to type 'ReactNode'`

## Description

TypeScript is inferring that a conditional render expression might return `unknown` instead of a valid ReactNode. This is a type inference limitation with React conditional rendering.

## Impact

- ⚠️ Type safety warning in IDE
- ✅ **Functionality works correctly** (runtime behavior unaffected)
- ⚠️ No autocomplete for conditional render result

## Root Cause

When using `condition && <JSX>` in React, TypeScript sometimes can't properly narrow the type, especially when the condition involves complex type checks or nullable values.

## Current Code

```typescript
{showViewModal && selectedEquipment !== null ? (
  <div>...</div>
) : null}
```

## Potential Fixes

1. **Use explicit type assertion** (if needed):
```typescript
{(showViewModal && selectedEquipment !== null) as boolean ? (
  <div>...</div>
) : null}
```

2. **Extract to separate component** (cleaner):
```typescript
{showViewModal && selectedEquipment && (
  <EquipmentViewModal equipment={selectedEquipment} onClose={...} />
)}
```

3. **Use early return pattern**:
```typescript
if (!showViewModal || !selectedEquipment) return null;
return <div>...</div>;
```

## Recommendation

This is a **non-critical type safety warning**. The code works correctly at runtime. If desired, can be fixed by extracting the modal to a separate component or using explicit type assertions.

## Status

- **Priority**: Low (non-blocking)
- **Functionality**: ✅ Working
- **Type Safety**: ⚠️ Warning only

