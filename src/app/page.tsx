
'use client';

import { FeedClientComponent } from "@/components/FeedClientComponent";

// This is now a simple client component wrapper.
// It delegates all data fetching and rendering logic to FeedClientComponent.
// This prevents any server-side data fetching on the root page, fixing previous errors.
export default function HomePage() {
  return (
    <main className="flex-1">
      <FeedClientComponent />
    </main>
  );
}
