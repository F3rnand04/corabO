'use client';

import { FeedClientComponent } from '@/components/FeedClientComponent';

// This component is now simplified. 
// AppLayout handles the logic to show LoginPage or this Feed.
export default function HomePage() {
  return <FeedClientComponent />;
}
