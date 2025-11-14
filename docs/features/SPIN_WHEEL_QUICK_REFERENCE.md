# Spin Wheel Quick Reference Guide

**Last Updated**: October 31, 2025
**Status**: ✅ Fully Operational

---

## 🎰 **Current Configuration**

### **Prize Structure**
| Prize | Slices | Color | Weight |
|-------|--------|-------|--------|
| $50 | 5 | Green (#10B981) | 1 |
| $75 | 3 | Orange (#F59E0B) | 2 |
| $100 | 1 | Red (#EF4444) | 2 |
| Try Again | 3 | Gray (#6B7280) | 3 |
| **Total** | **12** | - | **16** |

### **Visual Elements**
- ✅ Downward-pointing red pointer (16px wide, 24px tall)
- ✅ 12 metallic yellow pegs (3px diameter)
- ✅ Wheel size: 384px x 384px (w-96 h-96)
- ✅ Outer gray gradient ring with white border
- ✅ Prize text radially oriented with drop shadows

---

## 📝 **Messaging Standards**

### **Subtitle**
- **Spin 1**: "Spin 1 of 3"
- **Spin 2**: "Spin 2 of 3"
- **Spin 3**: "Your final spin awaits!"
- **After Win**: "You won $XX off your rental!"

### **Spin Result Messages**
- **After 1st miss**: "You've got 2 more spins. Keep going!"
- **After 2nd miss**:
  - Heading: "Last Spin Magic ✨"
  - Line 1: "You've got one last shot — make it count!"
  - Line 2: "Big prizes are waiting... will it be your lucky one?"
- **After Win (3rd spin)**:
  - Personalized: "Nice work, {firstName} — you made it to the final round!"
  - Message: "You won $XX off!"
  - Subtext: "You nailed it 🎉 — looks like that last spin paid off!"

### **Call-to-Action Text**
- **Not spinning**: "🎰 Spin #X"
- **While spinning**: "Spinning..."
- **Final spin**: "🎯 Final Spin!"
- **After win**: "Don't forget to save your code!"

### **How It Works**
"Up to 3 spins to win big discounts ($50/$75/$100 off your rental)."

---

## 🎨 **Design Specifications**

### **Pointer (Downward)**
```tsx
Position: top-0, left-1/2, translate-y-[-8px]
Outer Triangle: border-l-[16px] border-r-[16px] border-t-[24px]
Inner Triangle: border-l-[12px] border-r-[12px] border-t-[18px]
Colors: border-t-red-500 (outer), border-t-red-600 (inner)
Shadow: drop-shadow(0 4px 8px rgba(239, 68, 68, 0.6))
```

### **Pegs (12 Total)**
```tsx
Size: 3px x 3px (w-3 h-3)
Position: radius=125, angle=(index * 30) - 90
Background: linear-gradient(135deg, #FDE047 0%, #FBBF24 50%, #F59E0B 100%)
Border: 2px solid #D97706
Shadow: 0 2px 4px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.6)
```

### **Color Palette**
- **$50 Prize**: Green (#10B981)
- **$75 Prize**: Orange (#F59E0B)
- **$100 Prize**: Red (#EF4444)
- **Try Again**: Gray (#6B7280)
- **Pointer**: Red (#EF4444, #B91C1C)
- **Pegs**: Yellow-Orange Gradient
- **Countdown**: Red text

---

## 🔐 **Guest Form Requirements**

### **Required Fields:**
1. ✅ Email Address (type: email, validated)
2. ✅ Marketing Consent Checkbox (marked with *)

### **Optional Fields:**
- Phone Number (for SMS reminders)

### **Button State**:
```tsx
disabled={isLoading || !guestEmail || !marketingConsent}
```

---

## 🎬 **Animation Sequences**

### **Spin Animation**
1. User clicks "Spin #X" button
2. Button changes to "Spinning..."
3. Wheel rotates with 4s cubic-bezier easing
4. Lands on outcome (determined server-side)
5. 500ms buffer before showing result
6. Result modal appears with appropriate message

### **Available CSS Animations** (Ready to Use)
- `@keyframes confetti` - Celebratory confetti fall
- `@keyframes neonGlow` - Pulsing glow on wheel border
- `@keyframes winningFlash` - Flash winning segment
- `@keyframes pointerPulse` - Pulsing pointer glow
- `@keyframes hubRotate` - Rotating center hub
- `@keyframes pegShine` - Metallic peg highlights
- `@keyframes sparkle` - Particle effects during spin

---

## 🎯 **Hook Order (Critical!)**

```typescript
// 1. Context
const { user } = useAuth();

// 2-11. State Variables (10 total)
const [session, setSession] = useState<SpinSession | null>(null);
const [isSpinning, setIsSpinning] = useState(false);
const [spinResult, setSpinResult] = useState<string | null>(null);
const [timeLeft, setTimeLeft] = useState<number>(0);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [guestEmail, setGuestEmail] = useState('');
const [guestPhone, setGuestPhone] = useState('');
const [showGuestForm, setShowGuestForm] = useState(false);
const [marketingConsent, setMarketingConsent] = useState(false);

// 12. Ref
const wheelRef = useRef<HTMLDivElement>(null);

// 13-17. Effects (5 total) - ALL BEFORE EARLY RETURN
useEffect(() => { /* Track modal view */ }, [isOpen]);
useEffect(() => { /* Reset state when modal closes */ }, [isOpen]);
useEffect(() => { /* Timer countdown */ }, [session?.expires_at]);
useEffect(() => { /* Create or load session */ }, [isOpen, user, guestEmail, guestPhone]);
useEffect(() => { /* Keyboard handler for ESC key */ }, [isOpen, isSpinning]);

// ⚠️ EARLY RETURN MUST COME AFTER ALL HOOKS
if (!isOpen) return null;

// Now safe to define non-hook functions and variables
const isLastSpin = session ? session.spins_used === 2 : false;
const handleClose = () => { ... };
const handleSpin = async () => { ... };
```

---

## 🔧 **Troubleshooting**

### **If Hook Error Appears:**
1. Check all hooks are before `if (!isOpen) return null;`
2. Verify no conditional hooks
3. Restart Next.js dev server: `pkill -f "next dev" && pnpm dev`
4. Hard reload browser

### **If Wheel Shows Percentages Instead of Dollars:**
- Check WHEEL_SLICES definition (lines 57-75)
- Verify labels are '$50', '$75', '$100' (not '5%', '10%', '15%')
- Check API response is returning dollar amounts

### **If "Guaranteed Winner" Text Appears:**
Search for these strings and remove:
- `guaranteed`
- `guarantee`
- `3rd spin guaranteed to win`

### **If Marketing Consent Not Required:**
- Check `marketingConsent` state is defined
- Verify checkbox has `required`, `checked`, and `onChange` props
- Confirm button disabled condition includes `!marketingConsent`

---

## 🎮 **Browser Testing Commands**

```typescript
// 1. Navigate to page
await browser_navigate("http://localhost:3000/equipment")

// 2. Wait for page load
await browser_wait_for({ time: 2 })

// 3. Click Claim Offer
await browser_click("Claim Offer button", ref)

// 4. Wait for modal
await browser_wait_for({ time: 2 })

// 5. Fill guest form
await browser_fill_form([
  { name: "Email Address", type: "textbox", ref: "[from_snapshot]", value: "test@example.com" },
  { name: "Marketing consent", type: "checkbox", ref: "[from_snapshot]", value: "true" }
])

// 6. Click Start Spinning
await browser_click("Start Spinning button", ref)

// 7. Wait for wheel to load
await browser_wait_for({ time: 2 })

// 8. Take screenshot
await browser_take_screenshot("wheel_test.png")

// 9. Perform spin
await browser_click("Spin #1 button", ref)

// 10. Wait for spin to complete
await browser_wait_for({ time: 5 })

// 11. Verify result
await browser_snapshot()
```

---

## 📱 **Mobile Responsiveness**

- ✅ Modal width: max-w-2xl (responsive)
- ✅ Modal height: max-h-95vh (prevents overflow)
- ✅ Wheel scales proportionally
- ✅ Touch targets minimum 44px
- ✅ Text readable on small screens
- ✅ No horizontal scrolling

---

## 🔒 **Security & Compliance**

- ✅ Marketing consent tracked for CASL compliance
- ✅ Server-side outcome determination (no client manipulation)
- ✅ Fraud detection with device fingerprinting
- ✅ Rate limiting on API routes
- ✅ Input sanitization and validation
- ✅ Secure session tokens
- ✅ Privacy policy and terms links

---

## 📊 **Analytics Events**

1. `spin_modal_view` - Modal opened
2. `spin_email_captured` - Guest email collected
3. `spin_session_created` - Session initialized
4. `spin_started` - Spin button clicked
5. `spin_completed` - Spin finished
6. `spin_modal_close` - Modal closed (abandonment tracking)
7. `coupon_issued` - Prize won and coupon code generated

---

## 🎯 **Success Metrics**

**Conversion Goals**:
- 70%+ guest email capture rate
- 60%+ spin completion rate (all 3 spins used)
- 30%+ spin-to-booking conversion

**Performance Targets**:
- Modal load: < 2 seconds
- Spin animation: 4 seconds (consistent)
- API response: < 1 second
- No React errors in console

---

**Quick Links**:
- Main Component: `/frontend/src/components/SpinWheel.tsx`
- API Routes: `/frontend/src/app/api/spin/start/route.ts`, `/frontend/src/app/api/spin/roll/route.ts`
- CSS Animations: `/frontend/src/app/globals.css` (lines 2498-2600+)
- Analytics: `/frontend/src/lib/analytics/spin-events.ts`

---

**Last Tested**: October 31, 2025, 7:52 AM
**Status**: ✅ All features operational




