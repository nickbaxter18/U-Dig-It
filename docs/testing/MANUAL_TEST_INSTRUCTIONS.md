# 🎯 MANUAL TESTING INSTRUCTIONS - Spin Wheel

**Time Required:** 5-10 minutes
**URL:** http://localhost:3000/equipment

---

## 🚀 Quick Test Procedure

### **Step 1: Open Spin Wheel (30 seconds)**
1. Navigate to http://localhost:3000/equipment
2. Click **"Claim Offer"** button (top right, yellow)
3. **OBSERVE:** Modal should open instantly (no choppy loading)

---

### **Step 2: Fill Guest Form (30 seconds)**
4. Enter email: `visualtest@example.com`
5. Check the marketing consent checkbox
6. **VERIFY:** Button should become enabled (changes from gray to blue gradient)
7. Click **"Start Spinning! 🎰"**
8. **OBSERVE:** Wheel should load showing all 12 slices
9. **VERIFY:** NO countdown timer visible yet

---

### **Step 3: Visual Inspection (1 minute)**
10. **COUNT SLICES:**
    - Green ($50): Should be exactly 3
    - Orange ($75): Should be exactly 2
    - Red ($100): Should be exactly 1
    - Gray (Try Again): Should be exactly 6
    - **Total: 12 slices**

11. **VERIFY EQUAL SIZE:**
    - All slices should be the same size (30° each)
    - No slice should be larger or smaller than others

12. **VERIFY MIXED DISTRIBUTION:**
    - Slices should NOT be grouped together
    - Should alternate between prizes and Try Again

13. **VERIFY POINTER:**
    - Red triangular pointer at top pointing DOWN
    - Should overhang wheel slightly
    - Should have a red glow effect

14. **VERIFY PEGS:**
    - 12 small golden/yellow dots around perimeter
    - Should be between the outer border and prize labels
    - Should have metallic shine

---

### **Step 4: First Spin Test (15 seconds)**
15. Click **"🎰 Spin #1"** button
16. **OBSERVE DURING SPIN:**
    - Wheel should spin DRAMATICALLY (8-10 full rotations)
    - Should take 4 seconds
    - Should hear ticking sound as pegs pass pointer
17. **OBSERVE AFTER SPIN:**
    - Should land on "Try Again" (first spin always loses)
    - Message: "You've got 2 more spins. Keep going!"
    - **VERIFY:** Still NO countdown timer

---

### **Step 5: Second Spin Test (15 seconds)**
18. Click **"🎰 Spin #2"** button
19. **OBSERVE DURING SPIN:**
    - Wheel should spin DRAMATICALLY again (from where it stopped)
    - Should NOT just move slightly
    - Should spin 8-10 MORE full rotations
    - Should hear ticking sound
20. **OBSERVE AFTER SPIN:**
    - Should land on "Try Again" DIRECTLY NEXT TO $100 prize
    - Check visual: "Try Again" (gray) should be right after "$100" (red)
    - Message: "Last Spin Magic ✨" with emotional copy
    - **VERIFY:** Still NO countdown timer

---

### **Step 6: Third Spin Test (20 seconds)**
21. Click **"🎰 Spin #3"** button
22. **OBSERVE DURING SPIN:**
    - Wheel should spin DRAMATICALLY again
    - Should spin 8-10 MORE full rotations from current position
    - Total rotation should be 24-30+ full spins by now
    - Should hear ticking sound
23. **OBSERVE AFTER SPIN:**
    - Should land on a DOLLAR PRIZE ($50, $75, or $100)
    - **VERIFY:** Confetti animation plays
    - **VERIFY:** Win sound plays (celebratory ding)
    - Message: "You won $XX off!"
    - Coupon code: "UDIG-SPIN50" or "UDIG-SPIN75" or "UDIG-SPIN100"
    - **VERIFY:** Text says "Don't forget to save your code!"
    - **VERIFY:** Countdown timer NOW APPEARS (red text)
    - **VERIFY:** "Book Now" button present

---

## 🎯 KEY OBSERVATIONS TO MAKE

### Critical Items (MUST Work):
- ✅ **Equal slices** - All same size
- ✅ **Dramatic spinning** - 8-10 rotations EVERY time
- ✅ **2nd spin lands correctly** - Try Again next to $100
- ✅ **Countdown timing** - Only after win
- ✅ **All 3 spins actually spin** - Not just move slightly

### Visual Polish (Should Work):
- ⚠️ **Pointer visible** - Red triangle pointing down
- ⚠️ **Pegs visible** - 12 golden dots
- ⚠️ **Neon glow** - Blue/purple glow on wheel edge
- ⚠️ **3D depth** - Gradients on slices
- ⚠️ **Confetti** - Falling colored squares on win

### Audio (Should Work):
- ⚠️ **Ticking sound** - During spin
- ⚠️ **Win sound** - Celebratory ding
- ⚠️ **Lose sound** - Optional "aww" sound

---

## 📸 SCREENSHOTS TO CAPTURE

Please take screenshots at these moments:

1. **SCREENSHOT 1:** Guest form loaded (before spinning)
2. **SCREENSHOT 2:** Wheel with all slices visible (before Spin #1)
3. **SCREENSHOT 3:** After Spin #1 completes (should show "Try Again")
4. **SCREENSHOT 4:** After Spin #2 completes (forced landing)
5. **SCREENSHOT 5:** After Spin #3 completes (should show win + countdown)

---

## ⚠️ WHAT TO LOOK FOR (Issues)

### If Slices Are NOT Equal Size:
**Problem:** CSS weight calculation issue
**Check:** Browser DevTools → Inspect wheel → Look at SVG/div slice widths

### If Wheel Doesn't Spin (Just Moves Slightly):
**Problem:** `currentRotation` state not working
**Check:** Console logs should show: `newRotation: XXXX` increasing each spin

### If 2nd Spin Lands Incorrectly:
**Problem:** Forced slice index doesn't match visual layout
**Check:** Console logs should show: `forcedSlice: 7`, count slices clockwise from top

### If Pointer/Pegs Not Visible:
**Problem:** CSS not applying or z-index issue
**Check:** DevTools → Elements tab → Search for "pointer" or "peg" class
**Verify:** Elements exist in DOM with correct styles

### If Countdown Shows on Spin #1:
**Problem:** Logic fix didn't apply
**Check:** Hard refresh browser (Ctrl+Shift+R) to clear cache

---

##🎉 SUCCESS INDICATORS

You'll know everything is working when:

1. **Spin #1:**
   - Wheel spins dramatically
   - Lands on Try Again
   - NO countdown timer
   - Message: "You've got 2 more spins. Keep going!"

2. **Spin #2:**
   - Wheel spins dramatically AGAIN
   - Lands on Try Again slice RIGHT NEXT TO $100
   - STILL NO countdown timer
   - Message: "Last Spin Magic ✨..."

3. **Spin #3:**
   - Wheel spins dramatically AGAIN
   - Lands on dollar prize ($50/$75/$100)
   - Confetti animation
   - Win sound
   - Countdown timer APPEARS for first time
   - Message: "Don't forget to save your code!"
   - Code displayed (UDIG-SPINXX)

---

## 🛠️ TROUBLESHOOTING

### Issue: Browser shows error page
**Solution:** Refresh page, check console for specific error

### Issue: Modal won't open
**Solution:** Check browser console for errors, clear localStorage

### Issue: Wheel looks broken/misaligned
**Solution:** Hard refresh (Ctrl+Shift+R), check if CSS loaded

### Issue: No sound
**Solution:** Check browser allows audio, click anywhere on page first to enable audio

### Issue: Automation button stays disabled
**Solution:** This is expected - you need to manually type email (React state requirement)

---

## ✅ READY FOR TESTING

All code changes have been applied and are ready for manual verification!

**Confidence Level:** 🟢 HIGH
**Critical Fixes:** ✅ ALL APPLIED
**Visual Enhancements:** ✅ ALL IN CODE
**Manual Testing:** ⚠️ REQUIRED

---

**Next Step:** Perform manual testing and report any visual issues found!





