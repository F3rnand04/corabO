
'use client';

import { FeedClientComponent } from "@/components/FeedClientComponent";

// This component now acts as the main entry point of the application.
// It directly renders the FeedClientComponent without any loading checks.
export default function HomePage() {
  return (
    <main className="flex-1">
      <FeedClientComponent />
    </main>
  );
}
