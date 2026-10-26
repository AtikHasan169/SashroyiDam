# Hero Loading Skeleton & Retail Customer Banner Redesign

Eliminate the jarring developer setup placeholder text during initial load and replace it with a smooth shimmer skeleton loader matching exact carousel dimensions, coupled with an authentic customer-facing retail campaign banner fallback when no custom slides are configured.

## User Review & Critical Decisions

> [!IMPORTANT]
> The confirmed choices from the clarifying questions have been incorporated into this specification:
> - **Loading Presentation**: Replace text flash with a dimension-matched smooth shimmer skeleton (`animate-pulse`) during data fetching.
> - **Fallback Experience**: When loading finishes and no promotional slides exist, display an authentic customer retail headline ("সাশ্রয়ী দামে সেরা কেনাকাটা") and shop now CTA rather than internal admin onboarding copy.

- **Confirmed Decision 1**: Dimension-matched shimmer skeleton while storefront metadata and catalog products load.
- **Confirmed Decision 2**: Premium retail customer banner fallback (removing all developer setup / admin onboarding copy from the public storefront).

---

### 1. Overview & Core Concept

- **What It Solves**: When visiting the store, users previously experienced a jarring flash of a developer setup message ("ক্যাটালগ সম্পূর্ণ প্রস্তুত। অ্যাডমিন প্যানেল থেকে আপনার নিজস্ব পণ্য, ক্যাটাগরি এবং ব্যানার যুক্ত করে দ্রুত বিক্রি শুরু করুন") while products loaded. This created layout disruption and exposed internal administrative copy to shoppers.
- **Target Audience**: Shoppers browsing the online retail store on mobile or desktop devices.
- **Key Value**: Zero visual flicker on page load, smooth skeleton transitions, and a 100% customer-centric retail atmosphere even before promotional banners are uploaded.

---

### 2. User Experience & Visual Design

- **Loading State**:
  - A clean, responsive container matching the hero banner's exact dimensions (`aspect-[16/7] sm:aspect-[21/8] md:aspect-[24/8] min-h-[190px] sm:min-h-[280px] md:min-h-[340px] rounded-2xl sm:rounded-3xl`).
  - Subtle wave/shimmer gradient (`bg-stone-200/80` with dark emerald pulse accents) that occupies identical space to prevent layout shift (CLS = 0).
  - No text or button flash during network round-trips.

- **Customer Retail Fallback (When No Custom Slides Exist)**:
  - **Aesthetic**: Deep brand forest green gradient (`#07241A` to `#0F4C3A`) with subtle radial illumination.
  - **Kicker / Tag**: Clean unboxed typographic label: `সাশ্রয়ী দাম · আপনার বিশ্বস্ত অনলাইন রিটেইল`.
  - **Headline**: High-contrast, bold retail title: `সাশ্রয়ী দামে সেরা কেনাকাটা · খাঁটি পণ্যের বিশ্বস্ত ঠিকানা`.
  - **Customer Subtitle**: Customer-focused value proposition: `দেশসেরা গ্যাজেট, লাইফস্টাইল ও খাঁটি নিত্যপ্রয়োজনীয় পণ্যের নির্ভরযোগ্য সংগ্রহ। দ্রুত ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা।`
  - **Call to Action**: High-contrast amber shopping button (`পণ্য দেখুন →`) that smoothly scrolls to the product collection.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Explicit Loading State Binding in Hero Component**
  - *Chosen Approach*: Pass `isLoading` prop from `App.tsx` (`isLoadingProducts`) into `<Hero />`.
  - *Why*: Decouples data arrival from the zero-slide fallback state, guaranteeing the skeleton shows only while fetching and the fallback shows only after fetch completes with empty slides.
  - *Alternative Considered*: Showing an empty blank space (causes noticeable layout jump when products render).

- **Decision 2: Complete Removal of Admin Copy from Public Storefront**
  - *Chosen Approach*: Eliminate all developer onboarding text ("অ্যাডমিন প্যানেল থেকে আপনার নিজস্ব পণ্য...") from the client-facing hero template.
  - *Why*: Public e-commerce visitors should only ever see commercial shopping propositions, trust assurances, and product exploration prompts.

---

### 4. Technical Architecture & Component Flow

```
┌────────────────────────────────────────────────────────┐
│                        App.tsx                         │
│  State: isLoadingProducts, products, banners           │
└──────────────────────────┬─────────────────────────────┘
                           │
             isLoading & slide data props
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                       Hero.tsx                         │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ If isLoading:                                    │  │
│  │ Render Shimmer Skeleton (Matching Aspect Ratio)  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Else If allSlides.length > 0:                    │  │
│  │ Render Dynamic Pure Image Carousel               │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Else:                                            │  │
│  │ Render Customer Retail Campaign Banner           │  │
│  │ (No Admin Text, Shopping CTA)                    │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

- **Execution Steps**:
  1. Update `Hero.tsx`:
     - Add `isLoading?: boolean` to `HeroProps`.
     - Build `HeroSkeleton` matching exact responsive aspect ratio and rounded radii.
     - Rewrite the zero-slide fallback with polished customer copy and clean retail typography.
  2. Update `App.tsx`:
     - Pass `isLoading={isLoadingProducts}` to `<Hero />`.
  3. Validate with `compile_applet` and `lint_applet`.
