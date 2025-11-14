# 🎨 SPIN WHEEL VISUAL REFERENCE GUIDE

## Purpose
This guide provides visual diagrams and examples to understand the spin wheel coordinate system and rotation behavior.

---

## 1. SVG COORDINATE SYSTEM EXPLAINED

### Standard SVG Coordinates (Before Rotation)

```
        270° (TOP in standard math)
             │
             │
             │
180° ────────┼──────── 0° (RIGHT)
  (LEFT)     │
             │
             │
        90° (BOTTOM)
```

**But SVG uses Y-axis DOWN, so:**
- 0° = RIGHT (3 o'clock) ✓
- 90° = BOTTOM (6 o'clock) ✓
- 180° = LEFT (9 o'clock) ✓
- 270° = TOP (12 o'clock) ✓

---

### After SVG `transform: rotate(-90deg)`

The ENTIRE SVG is rotated -90° (counterclockwise):

```
BEFORE rotation (-90deg):        AFTER rotation:

        270°                              180° (LEFT)
         │                                  │
         │                                  │
         │                                  │
 180° ───┼─── 0°                   270° ────┼──── 90°
         │                          (TOP)   │  (BOTTOM)
         │                                  │
         │                                  │
         90°                               0° (RIGHT)
```

**Key Insight:** After -90° rotation, **0° in SVG appears at 270° visual (TOP!)**

---

## 2. SLICE POSITIONING

### Slice Index 0 (Our Reference Point)

**In SVG coordinates:**
- Slice 0 drawn from 0° to 30° in SVG
- Center at 15° in SVG

**After -90° SVG rotation:**
- 0° → 270° (top-left of top position)
- 15° → 285° (TOP! Where pointer is!)
- 30° → 300° (top-right of top position)

**Conclusion:** Slice 0 is at the TOP pointer when wheel rotation = 0°

---

### All 12 Slices Visualized

```
                   POINTER (TOP)
                        ↓
          ┌─────────────▼─────────────┐
          │         Slice 0           │  0° to 30° in SVG
          │       "Try Again"         │  → 270° to 300° visual
          │       (GRAY)              │  → At TOP when rotation = 0°
          ├───────────────────────────┤
          │        Slice 1            │  30° to 60° in SVG
          │        "5%"               │  → 300° to 330° visual
          │       (GREEN)             │  → At TOP when rotation = 330°
          ├───────────────────────────┤
          │        Slice 2            │  60° to 90° in SVG
          │        "10%"              │  → 330° to 360° visual
          │       (ORANGE)            │  → At TOP when rotation = 300°
          ├───────────────────────────┤
          │        Slice 3            │  90° to 120° in SVG
          │        "5%"               │  → 0° to 30° visual (RIGHT)
          │       (GREEN)             │  → At TOP when rotation = 270°
          └───────────────────────────┘

          ... (and so on for all 12 slices)
```

---

## 3. ROTATION EXAMPLES

### Example 1: Landing on Slice 0 ("Try Again")

**Goal:** Server returns `outcome = 'try_again'`, selects slice 0

**Formula:** `rotation = (360 - 0 × 30) % 360 = 0°`

**Visual:**
```
BEFORE (rotation = 0°):              AFTER (rotation = 0°):

     POINTER                              POINTER
        ↓                                    ↓
    ┌───▼───┐                            ┌───▼───┐
    │ Slice0│  ← Already at top!         │ Slice0│  ← Stays at top!
    │  Try  │                             │  Try  │
    │ Again │                             │ Again │
    └───────┘                             └───────┘
```

**Result:** ✅ Slice 0 at top, matches backend outcome `'try_again'`

---

### Example 2: Landing on Slice 4 ("Try Again")

**Goal:** Server returns `outcome = 'try_again'`, selects slice 4

**Formula:** `rotation = (360 - 4 × 30) % 360 = 240°`

**Visual:**
```
BEFORE (rotation = 0°):              AFTER (rotation = 240°):

     POINTER                              POINTER
        ↓                                    ↓
    ┌───▼───┐                            ┌───▼───┐
    │ Slice0│                             │ Slice4│  ← Rotated into position!
    │  Try  │                             │  Try  │
    │ Again │                             │ Again │
    ├───────┤                             ├───────┤
    │Slice 1│                             │Slice 5│
    │  5%   │                             │  15%  │
    ├───────┤                             ├───────┤
    │Slice 2│      Rotate 240° →         │Slice 6│
    │  10%  │      (clockwise)            │  5%   │
    ├───────┤                             ├───────┤
    │Slice 3│                             │Slice 7│
    │  5%   │                             │  10%  │
    ├───────┤                             ├───────┤
    │Slice 4│                             │Slice 8│
    │  Try  │                             │  5%   │
    │ Again │                             │       │
    └───────┘                             └───────┘
```

**Result:** ✅ Slice 4 at top, matches backend outcome `'try_again'`

---

### Example 3: Landing on Slice 1 ("5%")

**Goal:** Server returns `outcome = '5'`, selects slice 1

**Formula:** `rotation = (360 - 1 × 30) % 360 = 330°`

**Visual:**
```
BEFORE (rotation = 0°):              AFTER (rotation = 330°):

     POINTER                              POINTER
        ↓                                    ↓
    ┌───▼───┐                            ┌───▼───┐
    │ Slice0│                             │ Slice1│  ← Rotated into position!
    │  Try  │                             │  5%   │
    │ Again │                             │ GREEN │  ← WIN!
    ├───────┤                             ├───────┤
    │Slice 1│      Rotate 330° →         │Slice 2│
    │  5%   │      (clockwise)            │  10%  │
    │ GREEN │                             │ORANGE │
    └───────┘                             └───────┘
```

**Result:** ✅ Slice 1 (green 5%) at top, matches backend outcome `'5'`

---

## 4. MULTI-SPIN ROTATION

### Full 3-Spin Example

**Session:** New user spins all 3 times

#### Spin 1
- **Backend:** `outcome = 'try_again'`
- **Frontend:** Selects slice 4 (random among [0, 4, 9])
- **Calculation:**
  ```
  targetRotation = (360 - 4×30) % 360 = 240°
  currentNormalized = 0°
  delta = 240° - 0° = 240°
  newRotation = 0° + (360° × 5) + 240° = 2040°
  ```
- **Visual:** Wheel spins 5.67 full rotations, lands with slice 4 at top
- **Outcome:** Gray "Try Again" ✓

#### Spin 2
- **Backend:** `outcome = 'try_again'`
- **Frontend:** Selects slice 9 (random among [0, 4, 9])
- **Calculation:**
  ```
  targetRotation = (360 - 9×30) % 360 = 90°
  currentNormalized = (2040 % 360) = 240°
  delta = 90° - 240° = -150° → +360° = 210°
  newRotation = 2040° + (360° × 5) + 210° = 4050°
  ```
- **Visual:** Wheel spins 5.58 more rotations, lands with slice 9 at top
- **Outcome:** Gray "Try Again" ✓

#### Spin 3
- **Backend:** `outcome = '5'` (60% chance)
- **Frontend:** Selects slice 1 (random among [1, 3, 6, 8, 10])
- **Calculation:**
  ```
  targetRotation = (360 - 1×30) % 360 = 330°
  currentNormalized = (4050 % 360) = 90°
  delta = 330° - 90° = 240°
  newRotation = 4050° + (360° × 5) + 240° = 6090°
  ```
- **Visual:** Wheel spins 5.67 more rotations, lands with slice 1 at top
- **Outcome:** Green "5%" ✓

**Total rotations:** 6090° = 16.92 full rotations across all 3 spins

---

## 5. VISUAL VERIFICATION CHECKLIST

### What to Look For

#### ✅ CORRECT Landing (Example: Slice 4 "Try Again")
```
          POINTER
             ↓
        ┌────▼────┐
        │         │
        │  Try    │  ← Pointer clearly in CENTER
        │ Again   │  ← Gray color confirms "Try Again"
        │         │  ← White borders visible on both sides
        └─────────┘
```

**Indicators:**
- ✅ Pointer tip in the middle of the slice
- ✅ White borders visible on left and right
- ✅ Slice color matches outcome (gray = try_again)
- ✅ Text label clearly visible and centered

---

#### ❌ INCORRECT Landing (Edge/Border)
```
          POINTER
             ↓
        ┌────┬▼───┐
        │    │    │
        │ Try│ 5% │  ← Pointer on the BORDER!
        │Again│GREEN│  ← Unclear which prize!
        │    │    │  ← AMBIGUOUS LANDING
        └────┴────┘
```

**Indicators:**
- ❌ Pointer on white border line
- ❌ Touching two different slices
- ❌ Unclear which prize was won
- ❌ Confusing for users

**This is NEVER acceptable!**

---

## 6. COLOR REFERENCE

### Slice Color Meanings

```
┌──────────────────────────────────────────┐
│  GRAY (#6B7280)                          │
│  ══════════════                          │
│  "Try Again" - Loss                      │
│  User did NOT win this spin              │
│  Available on: Slice 0, 4, 9             │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  GREEN (#10B981)                         │
│  ════════════════                        │
│  "5% OFF" - Most Common Win              │
│  60% probability on spin 3               │
│  Available on: Slice 1, 3, 6, 8, 10      │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  ORANGE (#F59E0B)                        │
│  ═════════════════                       │
│  "10% OFF" - Medium Win                  │
│  30% probability on spin 3               │
│  Available on: Slice 2, 7, 11            │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  RED (#EF4444)                           │
│  ══════════════                          │
│  "15% OFF" - Rare Win                    │
│  10% probability on spin 3               │
│  Available on: Slice 5 only              │
└──────────────────────────────────────────┘
```

---

## 7. COMMON VISUAL BUGS (AND HOW TO SPOT THEM)

### Bug Type 1: Systematic Offset

**Symptoms:**
- Wheel consistently lands 1-2 slices off from expected
- Example: Backend says "Try Again", wheel shows "5%"

**Visual Pattern:**
```
Expected:  POINTER → [Try Again]
Actual:    POINTER → [5%] ← Off by 1 slice!
```

**Cause:** Wrong rotation formula (e.g., using 75° offset)

**Fix:** Use correct formula `(360 - index × 30) % 360`

---

### Bug Type 2: Edge Landing

**Symptoms:**
- Pointer lands on borders between slices
- Unclear which prize was won

**Visual Pattern:**
```
         POINTER
            ↓
    [Try Again|5%] ← Landing on border!
```

**Cause:** Random offset added to rotation

**Fix:** Remove random offset, land exactly in center

---

### Bug Type 3: Opposite Outcome

**Symptoms:**
- Backend says "win", visual shows "loss" (or vice versa)
- Completely inverted results

**Visual Pattern:**
```
Backend: outcome = '5' (WIN)
Visual:  Lands on "Try Again" (LOSS) ← Completely wrong!
```

**Cause:** Slice ID mapping error or sign error in formula

**Fix:** Verify outcome-to-sliceId mapping:
```typescript
const resultSliceId = outcome === 'try_again' ? 'try_again' : `${outcome}%`;
```

---

## 8. SUCCESS VISUAL EXAMPLES

### Perfect Spin 1 Landing

```
╔═══════════════════════════════════════╗
║         🎰 Spin to Win!               ║
║   Spin 1 of 3 (3rd spin guaranteed)  ║
╠═══════════════════════════════════════╣
║                                       ║
║             POINTER                   ║
║                ↓                      ║
║          ┌─────▼─────┐                ║
║          │           │                ║
║          │    TRY    │  ← GRAY        ║
║          │   AGAIN   │  ← CENTERED    ║
║          │           │  ← CLEAR       ║
║          └───────────┘                ║
║                                       ║
║  Your prize expires in: 47:59:58     ║
║                                       ║
║  ┌─────────────────────────────────┐ ║
║  │ 😔 So close!                    │ ║
║  │                                 │ ║
║  │ You've got 2 more spin(s).     │ ║
║  │ If the next one misses, the    │ ║
║  │ last one will guarantee a win! │ ║
║  └─────────────────────────────────┘ ║
║                                       ║
║     [ 🎰 Spin #2 ]                   ║
║                                       ║
╚═══════════════════════════════════════╝
```

**✅ Verification:**
- Pointer on gray slice ✓
- Message says "So close!" ✓
- Shows 2 more spins available ✓
- Button says "Spin #2" ✓

---

### Perfect Spin 3 Landing (Win)

```
╔═══════════════════════════════════════╗
║         🎯 Final Spin!                ║
║    This spin is guaranteed to win!   ║
╠═══════════════════════════════════════╣
║                                       ║
║             POINTER                   ║
║                ↓                      ║
║          ┌─────▼─────┐                ║
║          │           │                ║
║          │    5%     │  ← GREEN       ║
║          │   OFF     │  ← CENTERED    ║
║          │           │  ← CLEAR WIN   ║
║          └───────────┘                ║
║                                       ║
║  Your prize expires in: 47:55:23     ║
║                                       ║
║  ┌─────────────────────────────────┐ ║
║  │ 🎉 Congratulations!             │ ║
║  │                                 │ ║
║  │ You won 5% OFF                  │ ║
║  │ your first booking!             │ ║
║  │                                 │ ║
║  │ Code: UDIG-SPIN5-A1B2C3         │ ║
║  └─────────────────────────────────┘ ║
║                                       ║
║   [ 🎁 Claim Your Discount ]         ║
║                                       ║
╚═══════════════════════════════════════╝
```

**✅ Verification:**
- Pointer on green slice ✓
- Message says "Congratulations! You won 5% OFF" ✓
- Coupon code displayed ✓
- Button says "Claim Your Discount" ✓

---

## 9. SCREENSHOT CHECKLIST

When taking screenshots for verification, ensure:

### Spin 1 Screenshot Must Show:
- [ ] Wheel landed on gray "Try Again" slice
- [ ] Pointer clearly in CENTER of slice
- [ ] Message: "So close!"
- [ ] Button: "Spin #2"
- [ ] Timer showing ~47:59:XX

### Spin 2 Screenshot Must Show:
- [ ] Wheel landed on gray "Try Again" slice
- [ ] Pointer clearly in CENTER of slice
- [ ] Message: "So close!"
- [ ] Button: "Final Spin - Guaranteed to Win!"
- [ ] Timer showing ~47:59:XX

### Spin 3 Screenshot Must Show:
- [ ] Wheel landed on COLORED slice (green/orange/red)
- [ ] Pointer clearly in CENTER of slice
- [ ] Message: "Congratulations! You won X% OFF!"
- [ ] Coupon code displayed (UDIG-SPINX-XXXXXX)
- [ ] Button: "Claim Your Discount"
- [ ] OR: Redirected to booking page with promo code in URL

---

## 10. ANIMATION QUALITY REFERENCE

### What "Professional" Animation Looks Like

**Timing:**
```
0s     ────────────────────────────── 4s
│                                      │
Start                                 End
│                                      │
├─ Fast acceleration (0-0.5s)         │
├─ Maximum speed (0.5-2.5s)           │
├─ Gradual deceleration (2.5-3.5s)    │
└─ Gentle landing (3.5-4.0s)          │
```

**Speed Curve:**
```
Speed
  │     ╱‾‾‾‾‾‾‾‾╲
  │    ╱          ╲
  │   ╱            ╲___
  │  ╱                 ‾‾╲_
  │ ╱                      ‾╲___
  └─────────────────────────────── Time
  0s    1s    2s    3s    4s
```

**Cubic-Bezier:** `(0.25, 0.46, 0.45, 0.94)`
- Smooth start (no jarring)
- Natural deceleration (like real physics)
- Gentle landing (professional feel)

---

### What "Amateur" Animation Looks Like (AVOID!)

**Linear Animation:**
```
Speed
  │ ┌────────────────┐
  │ │                │  ← Constant speed
  │ │                │  ← Abrupt stop
  │ │                │  ← Looks robotic
  └─┴────────────────┴───────── Time
```

**Ease-In-Out (Too Simple):**
```
Speed
  │    ╱╲
  │   ╱  ╲    ← Too symmetrical
  │  ╱    ╲   ← No drama
  │ ╱      ╲  ← Boring
  └─────────╲───────── Time
```

**RULE:** ALWAYS use `cubic-bezier(0.25, 0.46, 0.45, 0.94)` - no exceptions!

---

## 11. MOBILE RESPONSIVE GUIDELINES

### Desktop (≥ 1024px)
```
Wheel size: 384px × 384px (w-96 h-96)
Text size: 18px
Pointer size: 30px triangle
```

### Tablet (768px - 1023px)
```
Wheel size: 320px × 320px (w-80 h-80)
Text size: 16px
Pointer size: 25px triangle
```

### Mobile (< 768px)
```
Wheel size: 280px × 280px (w-70 h-70)
Text size: 14px
Pointer size: 20px triangle
```

**RULE:** Scale proportionally - maintain aspect ratios!

---

## 12. BROWSER COMPATIBILITY

### Supported Browsers

| Browser | Version | Animation | SVG | Notes |
|---------|---------|-----------|-----|-------|
| Chrome | 90+ | ✅ | ✅ | Full support |
| Firefox | 88+ | ✅ | ✅ | Full support |
| Safari | 14+ | ✅ | ✅ | Full support |
| Edge | 90+ | ✅ | ✅ | Full support |
| iOS Safari | 14+ | ✅ | ✅ | Test on real devices |
| Android Chrome | 90+ | ✅ | ✅ | Test on real devices |

**RULE:** Test on actual devices, not just simulators!

---

## 13. FINAL VISUAL ACCEPTANCE CRITERIA

**The spin wheel is visually correct when ALL of these are true:**

### Layout & Positioning
- [ ] Wheel is perfectly circular (not oval)
- [ ] Pointer is at exact TOP (12 o'clock)
- [ ] Pointer is centered horizontally
- [ ] All 12 slices are equal size (30° each)
- [ ] Slices are in correct mixed order

### Landing Accuracy
- [ ] Pointer lands in CENTER of slices
- [ ] Never lands on borders/edges
- [ ] Landing position stable (not wiggling)
- [ ] Same rotation always lands on same slice

### Color & Contrast
- [ ] Gray slices clearly distinguishable
- [ ] Green slices vibrant and visible
- [ ] Orange slices distinguishable from green and red
- [ ] Red slice stands out as rare/special
- [ ] White text readable on all backgrounds
- [ ] White borders clearly visible between slices

### Animation Quality
- [ ] Smooth acceleration (no jarring start)
- [ ] Consistent speed during middle phase
- [ ] Gradual deceleration (no abrupt stop)
- [ ] No frame drops or stuttering
- [ ] Feels "premium" and "professional"

### Outcome Matching
- [ ] Spins 1 & 2: Always land on GRAY
- [ ] Spin 3: Always lands on COLOR (green/orange/red)
- [ ] Color matches prize (green=5%, orange=10%, red=15%)
- [ ] Message matches visual landing
- [ ] Console shows `verificationMatch: true`

---

**If ALL criteria pass → DEPLOY TO PRODUCTION! ✅**

**If ANY criteria fail → FIX BEFORE DEPLOYING! ❌**

---

**END OF VISUAL GUIDE**






