# Skeleton & Loading Strategy Plan

## Current State

All loading states use a single spinning circle:
```tsx
<div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
```

This creates blank, jumpy pages during data fetches. No skeleton components exist.

---

## Goals

1. Replace spinners-on-blank-pages with skeleton placeholders that match content shape
2. Keep implementation minimal — no new library, no abstraction overhead
3. Consistent pattern: one reusable `Skeleton` primitive + per-page skeleton layouts

---

## Approach: One Primitive, Composed Per Page

### Step 1 — Add a `Skeleton` primitive

One file: `src/components/ui/skeleton.tsx`

```tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted/50", className)} />
  );
}
```

That's it. No props, no variants. Just a pulsing gray box.

---

### Step 2 — Compose skeletons per page/component

Create one skeleton layout per loading context. Keep them co-located with their page or in a `*Skeleton.tsx` sibling file.

#### `TherapistCardSkeleton`

Mirrors the `TherapistCard` layout: image area + text lines.

```tsx
// src/components/TherapistCardSkeleton.tsx
export function TherapistCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-2 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
```

Used in: `src/app/client/page.tsx` — replace the current spinner with a 4-card grid of skeletons.

---

#### `BookingCardSkeleton`

Mirrors `BookingCard`: thumbnail + 3 text lines + badge.

```tsx
// src/components/BookingCardSkeleton.tsx
export function BookingCardSkeleton() {
  return (
    <div className="flex gap-3 p-3 rounded-xl">
      <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}
```

Used in: `src/app/client/bookings/page.tsx` and therapist dashboard.

---

#### `TherapistProfileSkeleton`

Used on `src/app/client/therapist/[id]/page.tsx` — big image, name, bio lines, slot list.

```tsx
export function TherapistProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="px-4 space-y-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
```

---

#### `DashboardSkeleton`

Used on `src/app/therapist/page.tsx` — booking list with 3 skeleton rows.

Reuse `BookingCardSkeleton` × 3.

---

### Step 3 — Replace spinners in pages

| Page | Replace | With |
|------|---------|------|
| `client/page.tsx` | centered spinner | grid of 4× `TherapistCardSkeleton` |
| `client/bookings/page.tsx` | centered spinner | 3× `BookingCardSkeleton` |
| `client/therapist/[id]/page.tsx` | centered spinner | `TherapistProfileSkeleton` |
| `therapist/page.tsx` | centered spinner | 3× `BookingCardSkeleton` |
| `therapist/profile/page.tsx` | none (form mounts empty) | form field skeletons |

Pattern in each page:

```tsx
if (isLoading) return <TherapistCardSkeleton />;  // or the grid equivalent
```

No layout shift. The skeleton matches the real content shape, so the page doesn't jump.

---

### Step 4 — Auth init loading

`providers.tsx` renders `AuthInit` which blocks the whole app while fetching a JWT.
Currently shows nothing (or a flash).

Replace with a centered logo + pulsing ring — one static component, not a skeleton:

```tsx
// src/components/AppLoader.tsx
export function AppLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="border-primary h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" />
    </div>
  );
}
```

Show this from `providers.tsx` while `!token && !authError`.

---

## What NOT to do

- No new skeleton library (e.g., `react-loading-skeleton`) — adds 15KB for no gain
- No `loading.tsx` Next.js files — React Query already owns the loading state, mixing both creates double-loading flickers
- No complex `Suspense` boundaries — the app uses client components throughout; Suspense adds complexity without benefit here
- No animated shimmer gradients — the CSS `animate-pulse` is enough and keeps the bundle clean

---

## File Checklist

```
src/components/ui/skeleton.tsx              ← new primitive
src/components/TherapistCardSkeleton.tsx    ← new
src/components/BookingCardSkeleton.tsx      ← new
src/components/TherapistProfileSkeleton.tsx ← new
src/components/AppLoader.tsx                ← new (replaces inline spinner in providers)
src/app/client/page.tsx                     ← edit: swap spinner for skeleton grid
src/app/client/bookings/page.tsx            ← edit: swap spinner for skeleton list
src/app/client/therapist/[id]/page.tsx      ← edit: swap spinner for profile skeleton
src/app/therapist/page.tsx                  ← edit: swap spinner for skeleton list
src/app/providers.tsx                       ← edit: use AppLoader during auth init
```

Total: 5 new files, 5 small edits. No new dependencies.
