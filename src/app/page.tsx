
'use client';

import { FeedClientComponent } from '@/components/FeedClientComponent';

export default function HomePage() {
  // This component is now simplified. 
  // AppLayout handles the logic to show LoginPage or this Feed.
  return <FeedClientComponent />;
}
