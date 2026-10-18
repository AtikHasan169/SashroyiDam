# Implementation Plan: Footer Minimal Icon-Only Social Buttons

Streamlining the footer social links section into sleek, recognizable icon-only buttons without redundant text labels.

---

## 1. Footer Social Links Redesign
- **File**: `src/components/Footer.tsx`
- **Changes**:
  - Replace wide text pill badges (`[f] Facebook`, `[icon] WhatsApp`, `[icon] Instagram`) with elegant circular icon-only buttons.
  - **Facebook**: Circular button with Facebook blue accent and "f" logo.
  - **WhatsApp**: Circular button with WhatsApp emerald accent and chat bubble icon.
  - **Instagram**: Circular button with Instagram gradient accent and camera icon.
  - Add clear `title` tooltips and `aria-label` attributes for accessibility.
  - Include subtle hover animations (`scale-110`, transition colors) for a polished, classy feel.

---

## 2. Verification
- Verify the footer renders cleanly on mobile and desktop without clutter or label wrapping.
- Verify links open the respective social channels in a new tab.
- Run `compile_applet` to confirm successful build.
