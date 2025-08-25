
'use client';

import { FeedClientComponent } from "@/components/FeedClientComponent";

// This component now acts as the main entry point of the application.
// It directly renders the FeedClientComponent. The Header is handled by AppLayout.
export default function HomePage() {
  return (
    <main className="flex-1 container mx-auto max-w-2xl">
      <FeedClientComponent />
    </main>
  );
}
