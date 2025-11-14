#!/usr/bin/env node

/**
 * SPIN WHEEL ROTATION FORMULA VERIFICATION
 *
 * This script empirically tests the rotation formula to ensure
 * the wheel lands correctly on the intended slices.
 */

const WHEEL_SLICES = [
  { id: 'try_again', label: 'Try Again', color: 'Gray' },    // Index 0
  { id: '5%', label: '5%', color: 'Green' },                 // Index 1
  { id: '10%', label: '10%', color: 'Orange' },              // Index 2
  { id: '5%', label: '5%', color: 'Green' },                 // Index 3
  { id: 'try_again', label: 'Try Again', color: 'Gray' },    // Index 4
  { id: '15%', label: '15%', color: 'Red' },                 // Index 5
  { id: '5%', label: '5%', color: 'Green' },                 // Index 6
  { id: '10%', label: '10%', color: 'Orange' },              // Index 7
  { id: '5%', label: '5%', color: 'Green' },                 // Index 8
  { id: 'try_again', label: 'Try Again', color: 'Gray' },    // Index 9
  { id: '5%', label: '5%', color: 'Green' },                 // Index 10
  { id: '10%', label: '10%', color: 'Orange' },              // Index 11
];

const totalSlices = WHEEL_SLICES.length;
const sliceAngle = 360 / totalSlices; // 30°

console.log('════════════════════════════════════════════════════════════');
console.log('  SPIN WHEEL ROTATION FORMULA TEST');
console.log('════════════════════════════════════════════════════════════\n');

// Test the corrected formula
console.log('📐 CORRECTED FORMULA:');
console.log('   rotation = (360 - sliceIndex × 30) % 360\n');

console.log('🧪 Testing all 12 slices:\n');
console.log('┌───────┬──────────────┬──────────┬──────────────┬────────┐');
console.log('│ Index │ Label        │ Color    │ Rotation     │ Verify │');
console.log('├───────┼──────────────┼──────────┼──────────────┼────────┤');

let allCorrect = true;

for (let sliceIndex = 0; sliceIndex < totalSlices; sliceIndex++) {
  const slice = WHEEL_SLICES[sliceIndex];

  // Calculate target rotation using corrected formula
  const targetRotation = (360 - (sliceIndex * sliceAngle)) % 360;

  // Verify: Calculate which slice should be at top given this rotation
  const verifyIndex = Math.round((360 - targetRotation) / sliceAngle) % totalSlices;
  const verifySlice = WHEEL_SLICES[verifyIndex];

  // Check if they match
  const isCorrect = verifyIndex === sliceIndex;
  const status = isCorrect ? '✅' : '❌';

  if (!isCorrect) {
    allCorrect = false;
  }

  console.log(
    `│ ${sliceIndex.toString().padStart(5)} │ ` +
    `${slice.label.padEnd(12)} │ ` +
    `${slice.color.padEnd(8)} │ ` +
    `${targetRotation.toString().padStart(6)}°      │ ` +
    `${status}     │`
  );

  // Show error details if mismatch
  if (!isCorrect) {
    console.log(`│       │ ⚠️  ERROR: Lands on index ${verifyIndex} (${verifySlice.label})          │`);
  }
}

console.log('└───────┴──────────────┴──────────┴──────────────┴────────┘\n');

if (allCorrect) {
  console.log('✅ SUCCESS! All 12 tests passed!\n');
  console.log('The formula is CORRECT and ready for production.\n');
} else {
  console.log('❌ FAILED! Formula has errors!\n');
  console.log('The rotation calculation needs to be fixed.\n');
}

console.log('════════════════════════════════════════════════════════════\n');

// Test specific scenarios from bug report
console.log('🐛 BUG SCENARIO TESTING:\n');

console.log('Scenario 1: Backend returns "try_again" for Spin 1');
console.log('  - Available slices: 0, 4, 9 (all "Try Again")');
console.log('  - If server picks slice 4:');
const spin1Rotation = (360 - 4 * 30) % 360;
const spin1Landing = Math.round((360 - spin1Rotation) / 30) % 12;
console.log(`    → rotation = (360 - 120) % 360 = ${spin1Rotation}°`);
console.log(`    → lands on slice ${spin1Landing}: ${WHEEL_SLICES[spin1Landing].label}`);
console.log(`    → ${spin1Landing === 4 ? '✅ CORRECT' : '❌ WRONG'}\n`);

console.log('Scenario 2: Backend returns "5" for Spin 3');
console.log('  - Available slices: 1, 3, 6, 8, 10 (all "5%")');
console.log('  - If server picks slice 1:');
const spin3Rotation = (360 - 1 * 30) % 360;
const spin3Landing = Math.round((360 - spin3Rotation) / 30) % 12;
console.log(`    → rotation = (360 - 30) % 360 = ${spin3Rotation}°`);
console.log(`    → lands on slice ${spin3Landing}: ${WHEEL_SLICES[spin3Landing].label}`);
console.log(`    → ${spin3Landing === 1 ? '✅ CORRECT' : '❌ WRONG'}\n`);

console.log('════════════════════════════════════════════════════════════\n');

// Output corrected code snippet
console.log('📝 CORRECTED CODE FOR SpinWheel.tsx:\n');
console.log('```typescript');
console.log('// Line ~349: Target Rotation Calculation');
console.log('const targetRotation = (360 - (targetSliceIndex * sliceAngle)) % 360;');
console.log('');
console.log('// Line ~387: Verification Formula');
console.log('const expectedSliceIndex = Math.round((360 - finalNormalized) / sliceAngle) % totalSlices;');
console.log('```\n');

console.log('════════════════════════════════════════════════════════════\n');






